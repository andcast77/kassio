import { Prisma } from '@kassio/database'
import { prisma } from '@kassio/database'
import { AppError } from '../lib/errors.js'
import { dec } from '../lib/decimal.js'

export type ProductListQuery = {
  search?: string
  categoryId?: string
  active?: boolean
  page?: number
  limit?: number
}

function serializeProduct(product: {
  id: string
  name: string
  sku: string | null
  barcode: string | null
  price: Prisma.Decimal
  cost: Prisma.Decimal | null
  stockQuantity: number
  active: boolean
  categoryId: string | null
  createdAt: Date
  updatedAt: Date
  category?: { id: string; name: string } | null
}) {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    price: dec(product.price)!,
    cost: dec(product.cost),
    stockQuantity: product.stockQuantity,
    active: product.active,
    categoryId: product.categoryId,
    category: product.category ?? null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }
}

export async function listProducts(query: ProductListQuery) {
  const page = Math.max(1, query.page ?? 1)
  const limit = Math.min(100, Math.max(1, query.limit ?? 20))
  const skip = (page - 1) * limit

  const where: Prisma.ProductWhereInput = {}
  if (query.categoryId) where.categoryId = query.categoryId
  if (query.active !== undefined) where.active = query.active
  if (query.search?.trim()) {
    const term = query.search.trim()
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { sku: { contains: term, mode: 'insensitive' } },
      { barcode: { contains: term, mode: 'insensitive' } },
    ]
  }

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: limit,
      include: { category: { select: { id: true, name: true } } },
    }),
  ])

  return {
    products: items.map(serializeProduct),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true } } },
  })
  if (!product) throw new AppError(404, 'Producto no encontrado', 'NOT_FOUND')
  return serializeProduct(product)
}

export async function createProduct(data: {
  name: string
  sku?: string | null
  barcode?: string | null
  price: number
  cost?: number | null
  stockQuantity?: number
  categoryId?: string | null
  active?: boolean
}) {
  if (data.categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: data.categoryId } })
    if (!cat) throw new AppError(404, 'Categoría no encontrada', 'NOT_FOUND')
  }

  try {
    const product = await prisma.product.create({
      data: {
        name: data.name.trim(),
        sku: data.sku?.trim() || null,
        barcode: data.barcode?.trim() || null,
        price: data.price,
        cost: data.cost ?? null,
        stockQuantity: data.stockQuantity ?? 0,
        categoryId: data.categoryId ?? null,
        active: data.active ?? true,
      },
      include: { category: { select: { id: true, name: true } } },
    })
    return serializeProduct(product)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(409, 'SKU o código de barras ya existe', 'CONFLICT')
    }
    throw error
  }
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string
    sku: string | null
    barcode: string | null
    price: number
    cost: number | null
    stockQuantity: number
    categoryId: string | null
    active: boolean
  }>,
) {
  await getProductById(id)

  if (data.categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: data.categoryId } })
    if (!cat) throw new AppError(404, 'Categoría no encontrada', 'NOT_FOUND')
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.sku !== undefined ? { sku: data.sku?.trim() || null } : {}),
        ...(data.barcode !== undefined ? { barcode: data.barcode?.trim() || null } : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.cost !== undefined ? { cost: data.cost } : {}),
        ...(data.stockQuantity !== undefined ? { stockQuantity: data.stockQuantity } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
      include: { category: { select: { id: true, name: true } } },
    })
    return serializeProduct(product)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(409, 'SKU o código de barras ya existe', 'CONFLICT')
    }
    throw error
  }
}

export async function deleteProduct(id: string) {
  await getProductById(id)
  await prisma.product.delete({ where: { id } })
}
