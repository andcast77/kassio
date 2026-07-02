import { prisma, StockMovementType } from '@kassio/database'
import { AppError } from '../lib/errors.js'

export async function adjustInventory(data: {
  productId: string
  quantity: number
  type: 'ADJUST' | 'ADD' | 'REMOVE'
  reason?: string | null
}) {
  const product = await prisma.product.findUnique({ where: { id: data.productId } })
  if (!product) throw new AppError(404, 'Producto no encontrado', 'NOT_FOUND')

  let delta = 0
  let newStock = product.stockQuantity

  if (data.type === 'ADJUST') {
    if (data.quantity < 0) throw new AppError(400, 'Stock inválido', 'VALIDATION_ERROR')
    newStock = data.quantity
    delta = newStock - product.stockQuantity
  } else if (data.type === 'ADD') {
    if (data.quantity <= 0) throw new AppError(400, 'Cantidad inválida', 'VALIDATION_ERROR')
    newStock = product.stockQuantity + data.quantity
    delta = data.quantity
  } else {
    if (data.quantity <= 0) throw new AppError(400, 'Cantidad inválida', 'VALIDATION_ERROR')
    newStock = Math.max(0, product.stockQuantity - data.quantity)
    delta = newStock - product.stockQuantity
  }

  if (delta === 0) {
    return { productId: product.id, stockQuantity: product.stockQuantity }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const p = await tx.product.update({
      where: { id: product.id },
      data: { stockQuantity: newStock },
    })
    await tx.stockMovement.create({
      data: {
        productId: product.id,
        type: StockMovementType.ADJUSTMENT,
        quantity: delta,
        reason: data.reason?.trim() || `Ajuste ${data.type}`,
      },
    })
    return p
  })

  return { productId: updated.id, stockQuantity: updated.stockQuantity }
}

export async function listStockMovements(productId?: string, limit = 50) {
  return prisma.stockMovement.findMany({
    where: productId ? { productId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { product: { select: { id: true, name: true, sku: true } } },
  })
}
