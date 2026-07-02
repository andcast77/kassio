import type { FastifyInstance } from 'fastify'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { authRoutes } from './routes/auth.js'
import { cashSessionRoutes } from './routes/cash-sessions.js'
import { ok } from './lib/response.js'

export async function buildApp(options?: { logger?: boolean }): Promise<FastifyInstance> {
  const app = Fastify({ logger: options?.logger ?? false })

  await app.register(cors, {
    origin: ['http://127.0.0.1:5173', 'http://localhost:5173'],
    credentials: true,
  })

  app.get('/health', async () => ok({ status: 'ok' }))
  await app.register(authRoutes, { prefix: '/api/v1/auth' })
  await app.register(cashSessionRoutes, { prefix: '/api/v1/cash-sessions' })

  return app
}
