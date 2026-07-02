import { config } from 'dotenv'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest'
import { CashSessionStatus, prisma } from '@kassio/database'
import { buildApp } from '../app.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootEnv = join(__dirname, '../../../.env')
if (existsSync(rootEnv)) config({ path: rootEnv })

describe('Phase 3 sales API', () => {
  const appPromise = buildApp()
  let token = ''
  let productId = ''

  beforeAll(async () => {
    const app = await appPromise
    await app.ready()

    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'cajero@kassio.local', password: 'Cajero123!' },
    })
    token = login.json().data.token

    const product = await prisma.product.findFirst({ where: { active: true } })
    if (!product) throw new Error('No demo product in seed')
    productId = product.id
  })

  beforeEach(async () => {
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

  it('creates sale, decrements stock, and void restores stock', async () => {
    const app = await appPromise
    const auth = { authorization: `Bearer ${token}` }
    const before = await prisma.product.findUnique({ where: { id: productId } })
    const stockBefore = before!.stockQuantity

    const saleRes = await app.inject({
      method: 'POST',
      url: '/api/v1/sales',
      headers: auth,
      payload: {
        paymentMethod: 'CASH',
        paidAmount: 5000,
        items: [{ productId, quantity: 2 }],
      },
    })
    expect(saleRes.statusCode).toBe(201)
    const sale = saleRes.json().data.sale
    expect(sale.ticketNumber).toBeGreaterThan(0)
    expect(sale.status).toBe('COMPLETED')

    const productAfterSale = await prisma.product.findUnique({ where: { id: productId } })
    expect(productAfterSale!.stockQuantity).toBe(stockBefore - 2)

    const today = await app.inject({ method: 'GET', url: '/api/v1/sales/today', headers: auth })
    expect(today.json().data.summary.salesCount).toBeGreaterThanOrEqual(1)

    const voidRes = await app.inject({
      method: 'POST',
      url: `/api/v1/sales/${sale.id}/void`,
      headers: auth,
    })
    expect(voidRes.statusCode).toBe(200)
    expect(voidRes.json().data.sale.status).toBe('VOIDED')

    const productAfterVoid = await prisma.product.findUnique({ where: { id: productId } })
    expect(productAfterVoid!.stockQuantity).toBe(stockBefore)
  })

  it('rejects sale without open cash session', async () => {
    await prisma.cashSession.updateMany({
      where: { status: CashSessionStatus.OPEN },
      data: { status: CashSessionStatus.CLOSED, closedAt: new Date(), countedCash: 0 },
    })
    const app = await appPromise
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sales',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        paymentMethod: 'CARD',
        items: [{ productId, quantity: 1 }],
      },
    })
    expect(res.statusCode).toBe(409)
    expect(res.json().code).toBe('NO_OPEN_CASH_SESSION')
  })
})
