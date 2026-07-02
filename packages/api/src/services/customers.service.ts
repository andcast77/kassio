import type { Prisma } from '@kassio/database'
import { prisma } from '@kassio/database'
import { AppError } from '../lib/errors.js'

export async function listCustomers(query: { search?: string; page?: number; limit?: number }) {
  const page = Math.max(1, query.page ?? 1)
  const limit = Math.min(100, Math.max(1, query.limit ?? 20))
  const skip = (page - 1) * limit

  const where: Prisma.CustomerWhereInput = {}
  if (query.search?.trim()) {
    const term = query.search.trim()
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { phone: { contains: term, mode: 'insensitive' } },
    ]
  }

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({ where, orderBy: { name: 'asc' }, skip, take: limit }),
  ])

  return {
    customers,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({ where: { id } })
  if (!customer) throw new AppError(404, 'Cliente no encontrado', 'NOT_FOUND')
  return customer
}

export async function createCustomer(data: {
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
}) {
  return prisma.customer.create({
    data: {
      name: data.name.trim(),
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
    },
  })
}

export async function updateCustomer(
  id: string,
  data: Partial<{ name: string; email: string | null; phone: string | null; address: string | null }>,
) {
  await getCustomerById(id)
  return prisma.customer.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.email !== undefined ? { email: data.email?.trim() || null } : {}),
      ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
      ...(data.address !== undefined ? { address: data.address?.trim() || null } : {}),
    },
  })
}

export async function deleteCustomer(id: string) {
  await getCustomerById(id)
  const sales = await prisma.sale.count({ where: { customerId: id } })
  if (sales > 0) {
    throw new AppError(400, 'No se puede eliminar un cliente con ventas', 'CUSTOMER_HAS_SALES')
  }
  await prisma.customer.delete({ where: { id } })
}
