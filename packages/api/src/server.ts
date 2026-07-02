import { config } from 'dotenv'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { authRoutes } from './routes/auth.js'
import { cashSessionRoutes } from './routes/cash-sessions.js'
import { ok } from './lib/response.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootEnv = join(__dirname, '../../../.env')
const apiEnv = join(__dirname, '../.env')

if (existsSync(rootEnv)) config({ path: rootEnv })
if (existsSync(apiEnv)) config({ path: apiEnv })

const host = process.env.API_HOST ?? '127.0.0.1'
const port = Number(process.env.API_PORT ?? 3000)

const app = Fastify({ logger: true })

await app.register(cors, {
  origin: ['http://127.0.0.1:5173', 'http://localhost:5173'],
  credentials: true,
})

app.get('/health', async () => ok({ status: 'ok' }))

await app.register(authRoutes, { prefix: '/api/v1/auth' })
await app.register(cashSessionRoutes, { prefix: '/api/v1/cash-sessions' })

try {
  await app.listen({ host, port })
  app.log.info(`Kassio API listening on http://${host}:${port}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
