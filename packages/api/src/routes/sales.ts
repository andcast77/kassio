import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { SaleStatus } from '@kassio/database'
import { requireAuth } from '../lib/require-auth.js'
import { handleRoute, parsePagination } from '../lib/route-handler.js'
import * as sales from '../services/sales.service.js'

const createSchema = z.object({
  customerId: z.string().optional().nullable(),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive(),
    }),
  ).min(1),
  paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'OTHER']),
  discount: z.number().nonnegative().optional(),
  paidAmount: z.number().nonnegative().optional(),
  notes: z.string().max(500).optional().nullable(),
})

export async function salesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  app.get('/today', async (_request, reply) => {
    return handleRoute(reply, async () => ({ summary: await sales.getTodaySummary() }))
  })

  app.get('/', async (request, reply) => {
    const q = request.query as Record<string, unknown>
    const { page, limit } = parsePagination(q)
    const status = typeof q.status === 'string' && q.status in SaleStatus ? (q.status as SaleStatus) : undefined
    return handleRoute(reply, async () =>
      sales.listSales({
        page,
        limit,
        startDate: typeof q.startDate === 'string' ? q.startDate : undefined,
        endDate: typeof q.endDate === 'string' ? q.endDate : undefined,
        status,
      }),
    )
  })

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    return handleRoute(reply, async () => ({ sale: await sales.getSaleById(id) }))
  })

  app.post('/', async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ success: false, data: null, message: 'No autorizado', code: 'UNAUTHORIZED' })
    }
    const parsed = createSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ success: false, data: null, message: 'Datos inválidos', code: 'VALIDATION_ERROR' })
    }
    return handleRoute(
      reply,
      async () => ({ sale: await sales.createSale(request.user!.id, parsed.data) }),
      201,
    )
  })

  app.post('/:id/void', async (request, reply) => {
    const { id } = request.params as { id: string }
    return handleRoute(reply, async () => ({ sale: await sales.voidSale(id) }))
  })
}
