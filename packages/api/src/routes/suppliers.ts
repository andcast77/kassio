import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth } from '../lib/require-auth.js'
import { handleRoute, parsePagination } from '../lib/route-handler.js'
import * as suppliers from '../services/suppliers.service.js'

const bodySchema = z.object({
  name: z.string().min(1),
  taxId: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
})

const updateSchema = bodySchema.partial()

export async function supplierRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  app.get('/', async (request, reply) => {
    const q = request.query as Record<string, unknown>
    const { page, limit } = parsePagination(q)
    return handleRoute(reply, async () =>
      suppliers.listSuppliers({
        search: typeof q.search === 'string' ? q.search : undefined,
        page,
        limit,
      }),
    )
  })

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    return handleRoute(reply, async () => ({ supplier: await suppliers.getSupplierById(id) }))
  })

  app.post('/', async (request, reply) => {
    const parsed = bodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ success: false, data: null, message: 'Datos inválidos', code: 'VALIDATION_ERROR' })
    }
    const data = { ...parsed.data, email: parsed.data.email || null }
    return handleRoute(reply, async () => ({ supplier: await suppliers.createSupplier(data) }), 201)
  })

  app.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = updateSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ success: false, data: null, message: 'Datos inválidos', code: 'VALIDATION_ERROR' })
    }
    return handleRoute(reply, async () => ({ supplier: await suppliers.updateSupplier(id, parsed.data) }))
  })

  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    return handleRoute(reply, async () => {
      await suppliers.deleteSupplier(id)
      return null
    }, 204)
  })
}
