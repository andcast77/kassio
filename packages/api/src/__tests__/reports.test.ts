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

describe('Reports API (shopflow-ui-slice-1)', () => {
  const appPromise = buildApp()
  let token = ''

  beforeAll(async () => {
    const app = await appPromise
    await app.ready()

    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'cajero@kassio.local', password: 'Cajero123!' },
    })
    token = login.json().data.token
  })

  afterAll(async () => {
    const app = await appPromise
    await app.close()
    await prisma.$disconnect()
  })

  it('returns stats, daily, top products, and inventory for authenticated users', async () => {
    const app = await appPromise
    const auth = { authorization: `Bearer ${token}` }

    const stats = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/stats?period=today',
      headers: auth,
    })
    expect(stats.statusCode).toBe(200)
    expect(stats.json().data.stats).toMatchObject({
      salesCount: expect.any(Number),
      totalRevenue: expect.any(String),
      totalDiscount: expect.any(String),
      averageSale: expect.any(String),
      totalTax: '0',
    })

    const daily = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/daily?days=7',
      headers: auth,
    })
    expect(daily.statusCode).toBe(200)
    expect(daily.json().data.daily).toHaveLength(7)
    expect(daily.json().data.daily[0]).toMatchObject({
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      sales: expect.any(Number),
      revenue: expect.any(String),
    })

    const top = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/top-products?period=week&limit=5',
      headers: auth,
    })
    expect(top.statusCode).toBe(200)
    expect(Array.isArray(top.json().data.products)).toBe(true)

    const inventory = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/inventory',
      headers: auth,
    })
    expect(inventory.statusCode).toBe(200)
    expect(inventory.json().data.inventory).toMatchObject({
      totalProducts: expect.any(Number),
      outOfStockProducts: expect.any(Number),
      totalStockUnits: expect.any(Number),
      inventoryCostValue: expect.any(String),
      inventoryRetailValue: expect.any(String),
    })
  })

  it('rejects unauthenticated report requests', async () => {
    const app = await appPromise
    const res = await app.inject({ method: 'GET', url: '/api/v1/reports/stats' })
    expect(res.statusCode).toBe(401)
  })
})
