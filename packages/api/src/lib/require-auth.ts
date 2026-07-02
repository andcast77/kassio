import type { FastifyReply, FastifyRequest } from 'fastify'
import { fail } from './response.js'
import { getBearerToken, verifyToken, type AuthUser } from './auth.js'

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const token = getBearerToken(request)
  if (!token) {
    return reply.status(401).send(fail('No autorizado', 'UNAUTHORIZED'))
  }

  try {
    request.user = verifyToken(token)
  } catch {
    return reply.status(401).send(fail('Sesión inválida o expirada', 'UNAUTHORIZED'))
  }
}
