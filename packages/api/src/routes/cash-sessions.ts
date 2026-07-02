import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { CashSessionStatus, prisma } from '@kassio/database'
import { fail, ok } from '../lib/response.js'
import { requireAuth } from '../lib/require-auth.js'

const openSchema = z.object({
  openingFloat: z.number().nonnegative(),
})

const closeSchema = z.object({
  countedCash: z.number().nonnegative(),
  notes: z.string().optional(),
})

function serializeSession(session: {
  id: string
  status: CashSessionStatus
  openingFloat: { toString(): string }
  expectedCash: { toString(): string } | null
  countedCash: { toString(): string } | null
  openedAt: Date
  closedAt: Date | null
  notes: string | null
  user: { id: string; name: string; email: string }
}) {
  return {
    id: session.id,
    status: session.status,
    openingFloat: session.openingFloat.toString(),
    expectedCash: session.expectedCash?.toString() ?? null,
    countedCash: session.countedCash?.toString() ?? null,
    openedAt: session.openedAt.toISOString(),
    closedAt: session.closedAt?.toISOString() ?? null,
    notes: session.notes,
    user: session.user,
  }
}

export async function cashSessionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  app.get('/current', async (_request, reply) => {
      const session = await prisma.cashSession.findFirst({
        where: { status: CashSessionStatus.OPEN },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { openedAt: 'desc' },
      })

    return ok({ session: session ? serializeSession(session) : null })
  })

  app.post('/open', async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send(fail('No autorizado', 'UNAUTHORIZED'))
      }

      const parsed = openSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send(fail('Datos inválidos', 'VALIDATION_ERROR'))
      }

      const existing = await prisma.cashSession.findFirst({
        where: { status: CashSessionStatus.OPEN },
      })

      if (existing) {
        return reply
          .status(409)
          .send(fail('Ya hay una caja abierta', 'CASH_SESSION_ALREADY_OPEN'))
      }

      const session = await prisma.cashSession.create({
        data: {
          userId: request.user.id,
          openingFloat: parsed.data.openingFloat,
          status: CashSessionStatus.OPEN,
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      })

    return reply.status(201).send(ok({ session: serializeSession(session) }, 'Caja abierta'))
  })

  app.post('/:id/close', async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send(fail('No autorizado', 'UNAUTHORIZED'))
      }

      const { id } = request.params as { id: string }
      const parsed = closeSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send(fail('Datos inválidos', 'VALIDATION_ERROR'))
      }

      const session = await prisma.cashSession.findUnique({
        where: { id },
        include: { user: { select: { id: true, name: true, email: true } } },
      })

      if (!session || session.status !== CashSessionStatus.OPEN) {
        return reply.status(404).send(fail('Sesión de caja no encontrada o ya cerrada', 'NOT_FOUND'))
      }

      const expectedCash = session.openingFloat

      const updated = await prisma.cashSession.update({
        where: { id },
        data: {
          status: CashSessionStatus.CLOSED,
          expectedCash,
          countedCash: parsed.data.countedCash,
          notes: parsed.data.notes,
          closedAt: new Date(),
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      })

    return ok({ session: serializeSession(updated) }, 'Caja cerrada')
  })
}
