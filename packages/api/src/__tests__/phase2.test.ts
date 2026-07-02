import { config } from 'dotenv'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import { prisma } from '@kassio/database'
import { buildApp } from '../app.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootEnv = join(__dirname, '../../../.env')
if (existsSync(rootEnv)) config({ path: rootEnv })

describe('Phase 2 catalog API', () => {
  const appPromise = buildApp()
  let token = ''
  let productId = ''

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

  it('creates category and product, purchase increases stock', async () => {
    const app = await appPromise
    const auth = { authorization: `Bearer ${token}` }

    const category = await app.inject({
      method: 'POST',
      url: '/api/v1/categories',
      headers: auth,
      payload: { name: `Cat test ${Date.now()}` },
    })
    expect(category.statusCode).toBe(201)

    const product = await app.inject({
      method: 'POST',
      url: '/api/v1/products',
      headers: auth,
      payload: {
        name: `Prod test ${Date.now()}`,
        sku: `TST-${Date.now()}`,
        price: 100,
        stockQuantity: 5,
        categoryId: category.json().data.category.id,
      },
    })
    expect(product.statusCode).toBe(201)
    productId = product.json().data.product.id

    const supplier = await app.inject({
      method: 'POST',
      url: '/api/v1/suppliers',
      headers: auth,
      payload: { name: `Sup test ${Date.now()}` },
    })
    expect(supplier.statusCode).toBe(201)

    const purchase = await app.inject({
      method: 'POST',
      url: '/api/v1/purchases',
      headers: auth,
      payload: {
        supplierId: supplier.json().data.supplier.id,
        items: [{ productId, quantity: 3, unitCost: 50 }],
      },
    })
    expect(purchase.statusCode).toBe(201)

    const updated = await app.inject({
      method: 'GET',
      url: `/api/v1/products/${productId}`,
      headers: auth,
    })
    expect(updated.json().data.product.stockQuantity).toBe(8)
  })
})
