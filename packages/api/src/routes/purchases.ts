import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth } from '../lib/require-auth.js'
import { handleRoute, parsePagination } from '../lib/route-handler.js'
import * as purchases from '../services/purchases.service.js'

const createSchema = z.object({
  supplierId: z.string().min(1),
  notes: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
        unitCost: z.number().nonnegative(),
      }),
    )
    .min(1),
})

export async function purchaseRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  app.get('/', async (request, reply) => {
    const { page, limit } = parsePagination(request.query as Record<string, unknown>)
    return handleRoute(reply, async () => purchases.listPurchases({ page, limit }))
  })

  app.post('/', async (request, reply) => {
    const parsed = createSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ success: false, data: null, message: 'Datos inválidos', code: 'VALIDATION_ERROR' })
    }
    return handleRoute(reply, async () => ({ purchase: await purchases.createPurchase(parsed.data) }), 201)
  })
}
