import jwt from 'jsonwebtoken'
import type { FastifyRequest } from 'fastify'
import type { UserRole } from '@kassio/database'

export type AuthUser = {
  id: string
  email: string
  name: string
  role: UserRole
}

export type JwtPayload = AuthUser

const DEV_SECRET = 'kassio-dev-secret-change-me'

export function getJwtSecret(): string {
  return process.env.JWT_SECRET?.trim() || DEV_SECRET
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, getJwtSecret(), { expiresIn: '12h' })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as JwtPayload
}

export function getBearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  return header.slice(7).trim() || null
}
