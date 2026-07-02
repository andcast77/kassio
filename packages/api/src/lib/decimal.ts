import type { Prisma } from '@kassio/database'

export function dec(value: Prisma.Decimal | null | undefined): string | null {
  if (value == null) return null
  return value.toString()
}
