import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth } from '../lib/require-auth.js'
import { handleRoute, parsePagination } from '../lib/route-handler.js'
import * as customers from '../services/customers.service.js'

const bodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
})

const updateSchema = bodySchema.partial()

export async function customerRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  app.get('/', async (request, reply) => {
    const q = request.query as Record<string, unknown>
    const { page, limit } = parsePagination(q)
    return handleRoute(reply, async () =>
      customers.listCustomers({
        search: typeof q.search === 'string' ? q.search : undefined,
        page,
        limit,
      }),
    )
  })

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    return handleRoute(reply, async () => ({ customer: await customers.getCustomerById(id) }))
  })

  app.post('/', async (request, reply) => {
    const parsed = bodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ success: false, data: null, message: 'Datos inválidos', code: 'VALIDATION_ERROR' })
    }
    const data = { ...parsed.data, email: parsed.data.email || null }
    return handleRoute(reply, async () => ({ customer: await customers.createCustomer(data) }), 201)
  })

  app.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = updateSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ success: false, data: null, message: 'Datos inválidos', code: 'VALIDATION_ERROR' })
    }
    return handleRoute(reply, async () => ({ customer: await customers.updateCustomer(id, parsed.data) }))
  })

  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    return handleRoute(reply, async () => {
      await customers.deleteCustomer(id)
      return null
    }, 204)
  })
}
