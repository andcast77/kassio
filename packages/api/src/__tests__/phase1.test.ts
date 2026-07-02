import { config } from 'dotenv'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest'
import { CashSessionStatus, prisma } from '@kassio/database'
import { buildApp } from '../app.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootEnv = join(__dirname, '../../../.env')
const apiEnv = join(__dirname, '../../.env')

if (existsSync(rootEnv)) config({ path: rootEnv })
if (existsSync(apiEnv)) config({ path: apiEnv })

const CASHIER_EMAIL = 'cajero@kassio.local'
const CASHIER_PASSWORD = 'Cajero123!'

describe('Phase 1 API', () => {
  const appPromise = buildApp()

  beforeAll(async () => {
    const app = await appPromise
    await app.ready()
  })

  afterAll(async () => {
    const app = await appPromise
    await app.close()
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    await prisma.cashSession.deleteMany({
      where: { status: CashSessionStatus.OPEN },
    })
  })

  it('rejects invalid login without revealing user existence', async () => {
    const app = await appPromise
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'noexiste@kassio.local', password: 'wrong' },
    })

    expect(res.statusCode).toBe(401)
    expect(res.json().message).toBe('Credenciales inválidas')
  })

  it('logs in cashier and opens then closes cash session', async () => {
    const app = await appPromise

    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: CASHIER_EMAIL, password: CASHIER_PASSWORD },
    })

    expect(login.statusCode).toBe(200)
    const token = login.json().data.token as string
    expect(token).toBeTruthy()

    const open = await app.inject({
      method: 'POST',
      url: '/api/v1/cash-sessions/open',
      headers: { authorization: `Bearer ${token}` },
      payload: { openingFloat: 2500 },
    })

    expect(open.statusCode).toBe(201)
    const sessionId = open.json().data.session.id as string

    const current = await app.inject({
      method: 'GET',
      url: '/api/v1/cash-sessions/current',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(current.json().data.session?.id).toBe(sessionId)

    const close = await app.inject({
      method: 'POST',
      url: `/api/v1/cash-sessions/${sessionId}/close`,
      headers: { authorization: `Bearer ${token}` },
      payload: { countedCash: 2500 },
    })

    expect(close.statusCode).toBe(200)
    expect(close.json().data.session.status).toBe('CLOSED')
  })

  it('blocks opening a second cash session', async () => {
    const app = await appPromise

    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: CASHIER_EMAIL, password: CASHIER_PASSWORD },
    })
    const token = login.json().data.token as string

    const first = await app.inject({
      method: 'POST',
      url: '/api/v1/cash-sessions/open',
      headers: { authorization: `Bearer ${token}` },
      payload: { openingFloat: 1000 },
    })
    expect(first.statusCode).toBe(201)

    const second = await app.inject({
      method: 'POST',
      url: '/api/v1/cash-sessions/open',
      headers: { authorization: `Bearer ${token}` },
      payload: { openingFloat: 500 },
    })

    expect(second.statusCode).toBe(409)
    expect(second.json().code).toBe('CASH_SESSION_ALREADY_OPEN')
  })
})
