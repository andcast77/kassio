import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@kassio/database'
import { fail, ok } from '../lib/response.js'
import { signToken } from '../lib/auth.js'
import { requireAuth } from '../lib/require-auth.js'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send(fail('Datos inválidos', 'VALIDATION_ERROR'))
    }

    const { email, password } = parsed.data
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

    const invalid = fail('Credenciales inválidas', 'INVALID_CREDENTIALS')

    if (!user || !user.active) {
      return reply.status(401).send(invalid)
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return reply.status(401).send(invalid)
    }

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }

    return ok(
      {
        token: signToken(authUser),
        user: authUser,
      },
      'Inicio de sesión correcto',
    )
  })

  app.get('/me', { preHandler: requireAuth }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send(fail('No autorizado', 'UNAUTHORIZED'))
    }
    return ok({ user: request.user })
  })

  app.post('/logout', { preHandler: requireAuth }, async () => {
    return ok(null, 'Sesión cerrada')
  })
}
