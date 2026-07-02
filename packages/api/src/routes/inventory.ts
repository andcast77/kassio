import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth } from '../lib/require-auth.js'
import { handleRoute } from '../lib/route-handler.js'
import * as inventory from '../services/inventory.service.js'

const adjustSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int(),
  type: z.enum(['ADJUST', 'ADD', 'REMOVE']),
  reason: z.string().optional().nullable(),
})

export async function inventoryRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  app.get('/movements', async (request, reply) => {
    const q = request.query as { productId?: string; limit?: string }
    const limit = q.limit ? Number(q.limit) : 50
    return handleRoute(reply, async () => ({
      movements: await inventory.listStockMovements(q.productId, limit),
    }))
  })

  app.post('/adjust', async (request, reply) => {
    const parsed = adjustSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ success: false, data: null, message: 'Datos inválidos', code: 'VALIDATION_ERROR' })
    }
    return handleRoute(reply, async () => ({
      result: await inventory.adjustInventory(parsed.data),
    }))
  })
}
