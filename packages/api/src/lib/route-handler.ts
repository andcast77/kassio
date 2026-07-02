import type { FastifyReply, FastifyRequest } from 'fastify'
import { fail } from './response.js'
import { isAppError } from './errors.js'

export async function handleRoute<T>(
  reply: FastifyReply,
  fn: () => Promise<T>,
  successStatus = 200,
) {
  try {
    if (successStatus === 204) {
      await fn()
      return reply.status(204).send()
    }
    const data = await fn()
    return reply.status(successStatus).send({ success: true, data, message: '' })
  } catch (error) {
    if (isAppError(error)) {
      return reply.status(error.statusCode).send(fail(error.message, error.code))
    }
    throw error
  }
}

export function parsePagination(query: Record<string, unknown>) {
  const page = query.page ? Number(query.page) : undefined
  const limit = query.limit ? Number(query.limit) : undefined
  return {
    page: Number.isFinite(page) ? page : undefined,
    limit: Number.isFinite(limit) ? limit : undefined,
  }
}

export function parseBool(value: unknown): boolean | undefined {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}
