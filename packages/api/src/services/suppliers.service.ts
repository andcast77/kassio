import type { Prisma } from '@kassio/database'
import { prisma } from '@kassio/database'
import { AppError } from '../lib/errors.js'

export async function listSuppliers(query: { search?: string; page?: number; limit?: number }) {
  const page = Math.max(1, query.page ?? 1)
  const limit = Math.min(100, Math.max(1, query.limit ?? 20))
  const skip = (page - 1) * limit

  const where: Prisma.SupplierWhereInput = {}
  if (query.search?.trim()) {
    const term = query.search.trim()
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { taxId: { contains: term, mode: 'insensitive' } },
    ]
  }

  const [total, suppliers] = await Promise.all([
    prisma.supplier.count({ where }),
    prisma.supplier.findMany({ where, orderBy: { name: 'asc' }, skip, take: limit }),
  ])

  return {
    suppliers,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

export async function getSupplierById(id: string) {
  const supplier = await prisma.supplier.findUnique({ where: { id } })
  if (!supplier) throw new AppError(404, 'Proveedor no encontrado', 'NOT_FOUND')
  return supplier
}

export async function createSupplier(data: {
  name: string
  taxId?: string | null
  email?: string | null
  phone?: string | null
}) {
  return prisma.supplier.create({
    data: {
      name: data.name.trim(),
      taxId: data.taxId?.trim() || null,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
    },
  })
}

export async function updateSupplier(
  id: string,
  data: Partial<{ name: string; taxId: string | null; email: string | null; phone: string | null }>,
) {
  await getSupplierById(id)
  return prisma.supplier.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.taxId !== undefined ? { taxId: data.taxId?.trim() || null } : {}),
      ...(data.email !== undefined ? { email: data.email?.trim() || null } : {}),
      ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
    },
  })
}

export async function deleteSupplier(id: string) {
  await getSupplierById(id)
  const purchases = await prisma.purchase.count({ where: { supplierId: id } })
  if (purchases > 0) {
    throw new AppError(400, 'No se puede eliminar un proveedor con compras', 'SUPPLIER_HAS_PURCHASES')
  }
  await prisma.supplier.delete({ where: { id } })
}
