import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../lib/require-auth.js'
import { handleRoute } from '../lib/route-handler.js'
import * as business from '../services/business.service.js'

export async function businessRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  app.get('/', async (_request, reply) => {
    return handleRoute(reply, async () => ({ business: await business.getBusiness() }))
  })
}
