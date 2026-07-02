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

const CATALOG_SIZE = 5000

describe('Phase 5 large catalog', () => {
  const appPromise = buildApp()
  let token = ''
  let categoryId = ''

  beforeAll(async () => {
    const app = await appPromise
    await app.ready()

    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'admin@kassio.local', password: 'Admin123!' },
    })
    token = login.json().data.token

    const category = await prisma.category.upsert({
      where: { id: 'perf-category' },
      update: {},
      create: { id: 'perf-category', name: 'Performance' },
    })
    categoryId = category.id

    const existing = await prisma.product.count({ where: { sku: { startsWith: 'PERF-' } } })
    if (existing < CATALOG_SIZE) {
      const batch = 500
      for (let offset = existing; offset < CATALOG_SIZE; offset += batch) {
        const rows = Array.from({ length: Math.min(batch, CATALOG_SIZE - offset) }, (_, i) => {
          const n = offset + i + 1
          return {
            name: `Producto perf ${n}`,
            sku: `PERF-${String(n).padStart(5, '0')}`,
            price: 100 + (n % 50),
            stockQuantity: n % 100,
            categoryId,
            active: true,
          }
        })
        await prisma.product.createMany({ data: rows, skipDuplicates: true })
      }
    }
  })

  afterAll(async () => {
    const app = await appPromise
    await app.close()
    await prisma.$disconnect()
  })

  it(`lists ${CATALOG_SIZE}+ products under 3 seconds`, async () => {
    const app = await appPromise
    const started = Date.now()
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/products?limit=100',
      headers: { authorization: `Bearer ${token}` },
    })
    const elapsed = Date.now() - started

    expect(res.statusCode).toBe(200)
    expect(res.json().data.products.length).toBe(100)
    expect(res.json().data.pagination.total).toBeGreaterThanOrEqual(CATALOG_SIZE)
    expect(elapsed).toBeLessThan(3000)
  })
})
