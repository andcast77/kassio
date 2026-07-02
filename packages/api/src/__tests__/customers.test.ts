import { config } from 'dotenv'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '@kassio/database'
import { buildApp } from '../app.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootEnv = join(__dirname, '../../../.env')
if (existsSync(rootEnv)) config({ path: rootEnv })

describe('Customers API (shopflow-ui-slice-3)', () => {
  const appPromise = buildApp()
  let token = ''
  let customerId = ''

  beforeAll(async () => {
    const app = await appPromise
    await app.ready()

    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'admin@kassio.local', password: 'Admin123!' },
    })
    token = login.json().data.token
  })

  afterAll(async () => {
    const app = await appPromise
    await app.close()
    await prisma.$disconnect()
  })

  it('creates, lists, updates, and deletes a customer', async () => {
    const app = await appPromise
    const auth = { authorization: `Bearer ${token}` }
    const stamp = Date.now()

    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/customers',
      headers: auth,
      payload: {
        name: `Cliente test ${stamp}`,
        email: `cliente-${stamp}@test.local`,
        phone: '111222333',
        taxId: '20-12345678-9',
        address: 'Calle Falsa 123',
        city: 'Buenos Aires',
        state: 'CABA',
        postalCode: '1425',
        country: 'Argentina',
      },
    })
    expect(created.statusCode).toBe(201)
    customerId = created.json().data.customer.id

    const list = await app.inject({
      method: 'GET',
      url: `/api/v1/customers?search=${stamp}`,
      headers: auth,
    })
    expect(list.statusCode).toBe(200)
    expect(list.json().data.customers.length).toBeGreaterThanOrEqual(1)

    const updated = await app.inject({
      method: 'PATCH',
      url: `/api/v1/customers/${customerId}`,
      headers: auth,
      payload: { name: `Cliente editado ${stamp}` },
    })
    expect(updated.statusCode).toBe(200)
    expect(updated.json().data.customer.name).toBe(`Cliente editado ${stamp}`)
    expect(updated.json().data.customer.city).toBe('Buenos Aires')

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/api/v1/customers/${customerId}`,
      headers: auth,
    })
    expect(deleted.statusCode).toBe(204)
    customerId = ''
  })

  it('rejects unauthenticated customer requests', async () => {
    const app = await appPromise
    const res = await app.inject({ method: 'GET', url: '/api/v1/customers' })
    expect(res.statusCode).toBe(401)
  })
})
