import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth } from '../lib/require-auth.js'
import { handleRoute } from '../lib/route-handler.js'
import * as reports from '../services/reports.service.js'

const periodSchema = z.enum(['today', 'week', 'month'])

export async function reportRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  app.get('/stats', async (request, reply) => {
    const q = request.query as Record<string, unknown>
    const parsed = periodSchema.safeParse(q.period ?? 'today')
    const period = parsed.success ? parsed.data : 'today'
    return handleRoute(reply, async () => ({ stats: await reports.getSalesStats(period) }))
  })

  app.get('/daily', async (request, reply) => {
    const q = request.query as Record<string, unknown>
    const days = q.days ? Number(q.days) : 7
    return handleRoute(reply, async () => ({ daily: await reports.getDailySales(days) }))
  })

  app.get('/top-products', async (request, reply) => {
    const q = request.query as Record<string, unknown>
    const parsed = periodSchema.safeParse(q.period ?? 'week')
    const period = parsed.success ? parsed.data : 'week'
    const limit = q.limit ? Number(q.limit) : 10
    return handleRoute(reply, async () => ({
      products: await reports.getTopProducts(period, limit),
    }))
  })

  app.get('/inventory', async (_request, reply) => {
    return handleRoute(reply, async () => ({
      inventory: await reports.getInventorySummary(),
    }))
  })
}
