import { prisma, StockMovementType } from '@kassio/database'
import { AppError } from '../lib/errors.js'
import { dec } from '../lib/decimal.js'

export async function createPurchase(data: {
  supplierId: string
  notes?: string | null
  items: Array<{ productId: string; quantity: number; unitCost: number }>
}) {
  if (data.items.length === 0) {
    throw new AppError(400, 'La compra debe tener al menos un ítem', 'VALIDATION_ERROR')
  }

  const supplier = await prisma.supplier.findUnique({ where: { id: data.supplierId } })
  if (!supplier) throw new AppError(404, 'Proveedor no encontrado', 'NOT_FOUND')

  for (const item of data.items) {
    if (item.quantity <= 0) throw new AppError(400, 'Cantidad inválida', 'VALIDATION_ERROR')
    if (item.unitCost < 0) throw new AppError(400, 'Costo inválido', 'VALIDATION_ERROR')
    const product = await prisma.product.findUnique({ where: { id: item.productId } })
    if (!product) throw new AppError(404, `Producto ${item.productId} no encontrado`, 'NOT_FOUND')
  }

  const total = data.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)

  const purchase = await prisma.$transaction(async (tx) => {
    const created = await tx.purchase.create({
      data: {
        supplierId: data.supplierId,
        notes: data.notes?.trim() || null,
        total,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
          })),
        },
      },
      include: {
        supplier: true,
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    })

    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { increment: item.quantity } },
      })
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: StockMovementType.PURCHASE,
          quantity: item.quantity,
          reason: `Compra ${created.id}`,
        },
      })
    }

    return created
  })

  return {
    ...purchase,
    total: dec(purchase.total)!,
    items: purchase.items.map((item) => ({
      ...item,
      unitCost: dec(item.unitCost)!,
      product: item.product,
    })),
  }
}

export async function listPurchases(query: { page?: number; limit?: number }) {
  const page = Math.max(1, query.page ?? 1)
  const limit = Math.min(100, Math.max(1, query.limit ?? 20))
  const skip = (page - 1) * limit

  const [total, purchases] = await Promise.all([
    prisma.purchase.count(),
    prisma.purchase.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        supplier: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true } } } },
      },
    }),
  ])

  return {
    purchases: purchases.map((p) => ({
      ...p,
      total: dec(p.total)!,
      items: p.items.map((i) => ({ ...i, unitCost: dec(i.unitCost)! })),
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}
