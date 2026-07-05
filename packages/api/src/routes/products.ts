import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth } from '../lib/require-auth.js'
import { handleRoute, parseBool, parsePagination, parseStringArray } from '../lib/route-handler.js'
import * as products from '../services/products.service.js'

const createSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  price: z.number().positive(),
  taxRate: z.number().min(0).max(1).optional(),
  cost: z.number().nonnegative().optional().nullable(),
  stockQuantity: z.number().int().nonnegative().optional(),
  categoryId: z.string().optional().nullable(),
  active: z.boolean().optional(),
})

const updateSchema = createSchema.partial()

export async function productRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  app.get('/', async (request, reply) => {
    const q = request.query as Record<string, unknown>
    const { page, limit } = parsePagination(q)
    return handleRoute(reply, async () =>
      products.listProducts({
        search: typeof q.search === 'string' ? q.search : undefined,
        categoryId: typeof q.categoryId === 'string' ? q.categoryId : undefined,
        categoryIds: parseStringArray(q.categoryIds),
        active: parseBool(q.active),
        page,
        limit,
      }),
    )
  })

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    return handleRoute(reply, async () => ({ product: await products.getProductById(id) }))
  })

  app.post('/', async (request, reply) => {
    const parsed = createSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ success: false, data: null, message: 'Datos inválidos', code: 'VALIDATION_ERROR' })
    }
    return handleRoute(reply, async () => ({ product: await products.createProduct(parsed.data) }), 201)
  })

  app.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = updateSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ success: false, data: null, message: 'Datos inválidos', code: 'VALIDATION_ERROR' })
    }
    return handleRoute(reply, async () => ({ product: await products.updateProduct(id, parsed.data) }))
  })

  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    return handleRoute(reply, async () => {
      await products.deleteProduct(id)
      return null
    }, 204)
  })
}
