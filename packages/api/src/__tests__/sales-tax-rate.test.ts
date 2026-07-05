import { config } from 'dotenv'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { CashSessionStatus, prisma } from '@kassio/database'
import { buildApp } from '../app.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootEnv = join(__dirname, '../../../.env')
if (existsSync(rootEnv)) config({ path: rootEnv })

function taxFromGross(gross: number, taxRate: number) {
  return gross * (taxRate / (1 + taxRate))
}

describe('Sale per-product taxRate (gross unit prices)', () => {
  const appPromise = buildApp()
  let token = ''
  let productId21 = ''
  let productId105 = ''

  beforeAll(async () => {
    const app = await appPromise
    await app.ready()

    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'cajero@kassio.local', password: 'Cajero123!' },
    })
    token = login.json().data.token

    const product21 = await prisma.product.findFirst({ where: { sku: 'SKU-001', active: true } })
    const product105 = await prisma.product.findFirst({ where: { sku: 'SKU-003', active: true } })
    if (!product21 || !product105) throw new Error('No demo products in seed')
    productId21 = product21.id
    productId105 = product105.id
  })

  beforeEach(async () => {
    await prisma.product.updateMany({
      where: { id: { in: [productId21, productId105] } },
      data: { stockQuantity: 100 },
    })
    await prisma.cashSession.updateMany({
      where: { status: CashSessionStatus.OPEN },
      data: { status: CashSessionStatus.CLOSED, closedAt: new Date(), countedCash: 0 },
    })
    const app = await appPromise
    await app.inject({
      method: 'POST',
      url: '/api/v1/cash-sessions/open',
      headers: { authorization: `Bearer ${token}` },
      payload: { openingFloat: 1000 },
    })
  })

  afterAll(async () => {
    const app = await appPromise
    await app.close()
    await prisma.$disconnect()
  })

  it('persists product taxRate and gross totals from catalog price', async () => {
    const app = await appPromise
    const auth = { authorization: `Bearer ${token}` }
    const product = await prisma.product.findUnique({ where: { id: productId21 } })
    const gross = Number(product!.price)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sales',
      headers: auth,
      payload: {
        paymentMethod: 'CARD',
        items: [{ productId: productId21, quantity: 1 }],
      },
    })

    expect(res.statusCode).toBe(201)
    const sale = res.json().data.sale
    expect(sale.taxRate).toBe('0.21')
    expect(Number(sale.total)).toBeCloseTo(gross, 2)
    expect(Number(sale.tax)).toBeCloseTo(taxFromGross(gross, 0.21), 2)
    expect(sale.items?.[0].taxRate).toBe('0.21')
    expect(Number(sale.items?.[0].unitPrice)).toBeCloseTo(gross, 2)
  })

  it('stores null sale taxRate when lines have mixed product rates', async () => {
    const app = await appPromise
    const auth = { authorization: `Bearer ${token}` }

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sales',
      headers: auth,
      payload: {
        paymentMethod: 'CARD',
        items: [
          { productId: productId21, quantity: 1 },
          { productId: productId105, quantity: 1 },
        ],
      },
    })

    expect(res.statusCode).toBe(201)
    const sale = res.json().data.sale
    expect(sale.taxRate).toBeNull()
    expect(Number(sale.tax)).toBeGreaterThan(0)
  })

  it('persists line taxRate override without updating catalog product', async () => {
    const app = await appPromise
    const auth = { authorization: `Bearer ${token}` }

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sales',
      headers: auth,
      payload: {
        paymentMethod: 'CARD',
        items: [{ productId: productId21, quantity: 1, taxRate: 0.105 }],
      },
    })

    expect(res.statusCode).toBe(201)
    const sale = res.json().data.sale
    expect(sale.taxRate).toBe('0.105')
    expect(sale.items?.[0].taxRate).toBe('0.105')

    const product = await prisma.product.findUnique({ where: { id: productId21 } })
    expect(product!.taxRate.toString()).toBe('0.21')
  })

  it('persists gross line unitPrice override without updating catalog product', async () => {
    const app = await appPromise
    const auth = { authorization: `Bearer ${token}` }

    const before = await prisma.product.findUnique({ where: { id: productId21 } })
    const catalogPrice = before!.price.toString()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sales',
      headers: auth,
      payload: {
        paymentMethod: 'CARD',
        items: [{ productId: productId21, quantity: 2, unitPrice: 750 }],
      },
    })

    expect(res.statusCode).toBe(201)
    const sale = res.json().data.sale
    expect(sale.items[0].unitPrice).toBe('750')
    expect(Number(sale.total)).toBe(1500)

    const after = await prisma.product.findUnique({ where: { id: productId21 } })
    expect(after!.price.toString()).toBe(catalogPrice)
  })
})
