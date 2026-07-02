import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth } from '../lib/require-auth.js'
import { handleRoute } from '../lib/route-handler.js'
import * as categories from '../services/categories.service.js'

const createSchema = z.object({
  name: z.string().min(1),
  active: z.boolean().optional(),
})

const updateSchema = createSchema.partial()

export async function categoryRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  app.get('/', async (request, reply) => {
    const search = (request.query as { search?: string }).search
    return handleRoute(reply, async () => ({
      categories: await categories.listCategories(search),
    }))
  })

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    return handleRoute(reply, async () => ({
      category: await categories.getCategoryById(id),
    }))
  })

  app.post('/', async (request, reply) => {
    const parsed = createSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ success: false, data: null, message: 'Datos inválidos', code: 'VALIDATION_ERROR' })
    }
    return handleRoute(
      reply,
      async () => ({ category: await categories.createCategory(parsed.data) }),
      201,
    )
  })

  app.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = updateSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ success: false, data: null, message: 'Datos inválidos', code: 'VALIDATION_ERROR' })
    }
    return handleRoute(reply, async () => ({
      category: await categories.updateCategory(id, parsed.data),
    }))
  })

  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    return handleRoute(reply, async () => {
      await categories.deleteCategory(id)
      return null
    }, 204)
  })
}
