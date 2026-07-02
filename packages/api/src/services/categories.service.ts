import type { Prisma } from '@kassio/database'
import { prisma } from '@kassio/database'
import { AppError } from '../lib/errors.js'

export async function listCategories(search?: string) {
  const where: Prisma.CategoryWhereInput = {}
  if (search?.trim()) {
    where.name = { contains: search.trim(), mode: 'insensitive' }
  }

  return prisma.category.findMany({
    where,
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  })
}

export async function getCategoryById(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  })
  if (!category) throw new AppError(404, 'Categoría no encontrada', 'NOT_FOUND')
  return category
}

export async function createCategory(data: { name: string; active?: boolean }) {
  const name = data.name.trim()
  const existing = await prisma.category.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
  })
  if (existing) throw new AppError(409, 'Ya existe una categoría con ese nombre', 'CONFLICT')

  return prisma.category.create({
    data: { name, active: data.active ?? true },
    include: { _count: { select: { products: true } } },
  })
}

export async function updateCategory(id: string, data: { name?: string; active?: boolean }) {
  await getCategoryById(id)

  if (data.name !== undefined) {
    const name = data.name.trim()
    const sibling = await prisma.category.findFirst({
      where: {
        id: { not: id },
        name: { equals: name, mode: 'insensitive' },
      },
    })
    if (sibling) throw new AppError(409, 'Ya existe una categoría con ese nombre', 'CONFLICT')
  }

  return prisma.category.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
    },
    include: { _count: { select: { products: true } } },
  })
}

export async function deleteCategory(id: string) {
  const category = await getCategoryById(id)
  if (category._count.products > 0) {
    throw new AppError(
      400,
      'No se puede eliminar una categoría con productos asignados',
      'CATEGORY_HAS_PRODUCTS',
    )
  }
  await prisma.category.delete({ where: { id } })
}
