import type { FastifyInstance } from 'fastify'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { authRoutes } from './routes/auth.js'
import { cashSessionRoutes } from './routes/cash-sessions.js'
import { categoryRoutes } from './routes/categories.js'
import { productRoutes } from './routes/products.js'
import { customerRoutes } from './routes/customers.js'
import { supplierRoutes } from './routes/suppliers.js'
import { purchaseRoutes } from './routes/purchases.js'
import { inventoryRoutes } from './routes/inventory.js'
import { salesRoutes } from './routes/sales.js'
import { businessRoutes } from './routes/business.js'
import { reportRoutes } from './routes/reports.js'
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
  await app.register(categoryRoutes, { prefix: '/api/v1/categories' })
  await app.register(productRoutes, { prefix: '/api/v1/products' })
  await app.register(customerRoutes, { prefix: '/api/v1/customers' })
  await app.register(supplierRoutes, { prefix: '/api/v1/suppliers' })
  await app.register(purchaseRoutes, { prefix: '/api/v1/purchases' })
  await app.register(inventoryRoutes, { prefix: '/api/v1/inventory' })
  await app.register(salesRoutes, { prefix: '/api/v1/sales' })
  await app.register(businessRoutes, { prefix: '/api/v1/business' })
  await app.register(reportRoutes, { prefix: '/api/v1/reports' })

  return app
}
