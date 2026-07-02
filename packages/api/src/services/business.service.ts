import { prisma } from '@kassio/database'
import { AppError } from '../lib/errors.js'
import { dec } from '../lib/decimal.js'

function serializeBusiness(business: {
  id: string
  name: string
  taxId: string | null
  taxRate: { toString(): string }
  address: string | null
  phone: string | null
}) {
  return {
    id: business.id,
    name: business.name,
    taxId: business.taxId,
    taxRate: dec(business.taxRate)!,
    address: business.address,
    phone: business.phone,
  }
}

export async function getBusiness() {
  const business = await prisma.business.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!business) throw new AppError(404, 'Negocio no configurado', 'NOT_FOUND')
  return serializeBusiness(business)
}

export async function getBusinessTaxRate(): Promise<number> {
  const business = await prisma.business.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { taxRate: true },
  })
  return business ? Number(business.taxRate) : 0
}
