import { CashSessionStatus, prisma, SaleStatus, StockMovementType, type PaymentMethod } from '@kassio/database'
import { AppError } from '../lib/errors.js'
import { dec } from '../lib/decimal.js'
import { computeChange, computeSaleTotals, validateCashPayment } from '../lib/sale-totals.js'
import { getBusinessTaxRate } from './business.service.js'

function serializeSale(sale: {
  id: string
  ticketNumber: number
  userId: string
  cashSessionId: string
  customerId: string | null
  status: SaleStatus
  paymentMethod: PaymentMethod
  subtotal: { toString(): string }
  discount: { toString(): string }
  tax: { toString(): string }
  total: { toString(): string }
  paidAmount: { toString(): string } | null
  change: { toString(): string } | null
  notes: string | null
  createdAt: Date
  user?: { id: string; name: string; email: string }
  customer?: {
    id: string
    name: string
    email?: string | null
    phone?: string | null
    taxId?: string | null
  } | null
  items?: Array<{
    id: string
    productId: string
    quantity: number
    unitPrice: { toString(): string }
    lineTotal: { toString(): string }
    product?: { id: string; name: string; sku: string | null }
  }>
}) {
  return {
    id: sale.id,
    ticketNumber: sale.ticketNumber,
    userId: sale.userId,
    cashSessionId: sale.cashSessionId,
    customerId: sale.customerId,
    status: sale.status,
    paymentMethod: sale.paymentMethod,
    subtotal: dec(sale.subtotal)!,
    discount: dec(sale.discount)!,
    tax: dec(sale.tax)!,
    total: dec(sale.total)!,
    paidAmount: dec(sale.paidAmount),
    change: dec(sale.change),
    notes: sale.notes,
    createdAt: sale.createdAt.toISOString(),
    user: sale.user,
    customer: sale.customer ?? null,
    items: sale.items?.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: dec(item.unitPrice)!,
      lineTotal: dec(item.lineTotal)!,
      product: item.product,
    })),
  }
}

async function nextTicketNumber(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) {
  const seq = await tx.ticketSequence.upsert({
    where: { id: 'default' },
    create: { id: 'default', lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  })
  return seq.lastNumber
}

export async function createSale(
  userId: string,
  data: {
    customerId?: string | null
    items: Array<{ productId: string; quantity: number }>
    paymentMethod: PaymentMethod
    discount?: number
    paidAmount?: number
    notes?: string | null
  },
) {
  if (data.items.length === 0) {
    throw new AppError(400, 'La venta debe tener al menos un ítem', 'VALIDATION_ERROR')
  }

  if (data.customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } })
    if (!customer) throw new AppError(404, 'Cliente no encontrado', 'NOT_FOUND')
  }

  const lineItems: Array<{ productId: string; quantity: number; unitPrice: number; lineTotal: number }> = []

  for (const item of data.items) {
    if (item.quantity <= 0) throw new AppError(400, 'Cantidad inválida', 'VALIDATION_ERROR')

    const product = await prisma.product.findUnique({ where: { id: item.productId } })
    if (!product) throw new AppError(404, `Producto no encontrado`, 'NOT_FOUND')
    if (!product.active) throw new AppError(400, `El producto ${product.name} no está activo`, 'VALIDATION_ERROR')
    if (product.stockQuantity < item.quantity) {
      throw new AppError(
        400,
        `Stock insuficiente para ${product.name}. Disponible: ${product.stockQuantity}`,
        'INSUFFICIENT_STOCK',
      )
    }

    const unitPrice = Number(product.price)
    lineItems.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
    })
  }

  const taxRate = await getBusinessTaxRate()

  let totals
  try {
    totals = computeSaleTotals(
      lineItems.map(({ quantity, unitPrice }) => ({ quantity, unitPrice })),
      data.discount ?? 0,
      taxRate,
    )
  } catch {
    throw new AppError(400, 'Descuento inválido', 'VALIDATION_ERROR')
  }

  const paidAmount =
    data.paymentMethod === 'CASH' && data.paidAmount != null ? data.paidAmount : null
  const changeAmount =
    paidAmount != null ? computeChange(paidAmount, totals.total) : null

  if (data.paymentMethod === 'CASH' && paidAmount != null && !validateCashPayment(paidAmount, totals.total)) {
    throw new AppError(400, 'El monto pagado es menor que el total', 'VALIDATION_ERROR')
  }

  const sale = await prisma.$transaction(async (tx) => {
    const cashSession = await tx.cashSession.findFirst({
      where: { status: CashSessionStatus.OPEN },
      orderBy: { openedAt: 'desc' },
    })
    if (!cashSession) {
      throw new AppError(409, 'No hay caja abierta', 'NO_OPEN_CASH_SESSION')
    }

    const ticketNumber = await nextTicketNumber(tx)

    const created = await tx.sale.create({
      data: {
        ticketNumber,
        userId,
        cashSessionId: cashSession.id,
        customerId: data.customerId ?? null,
        paymentMethod: data.paymentMethod,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        paidAmount,
        change: changeAmount,
        notes: data.notes?.trim() || null,
        status: SaleStatus.COMPLETED,
        items: {
          create: lineItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          })),
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        customer: { select: { id: true, name: true, email: true, phone: true, taxId: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    })

    for (const item of lineItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } },
      })
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: StockMovementType.SALE,
          quantity: item.quantity,
          reason: `Venta #${ticketNumber}`,
        },
      })
    }

    return created
  })

  return serializeSale(sale)
}

export async function listSales(query: {
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
  status?: SaleStatus
}) {
  const page = Math.max(1, query.page ?? 1)
  const limit = Math.min(100, Math.max(1, query.limit ?? 20))
  const skip = (page - 1) * limit

  const where: {
    status?: SaleStatus
    createdAt?: { gte?: Date; lte?: Date }
  } = {}

  if (query.status) where.status = query.status
  if (query.startDate || query.endDate) {
    where.createdAt = {}
    if (query.startDate) where.createdAt.gte = new Date(query.startDate)
    if (query.endDate) where.createdAt.lte = new Date(query.endDate)
  }

  const [total, sales] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        customer: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    }),
  ])

  return {
    sales: sales.map(serializeSale),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

export async function getSaleById(id: string) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      customer: { select: { id: true, name: true, email: true, phone: true, taxId: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true, barcode: true } } } },
    },
  })
  if (!sale) throw new AppError(404, 'Venta no encontrada', 'NOT_FOUND')
  return serializeSale(sale)
}

export async function voidSale(id: string) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { items: true },
  })
  if (!sale) throw new AppError(404, 'Venta no encontrada', 'NOT_FOUND')
  if (sale.status !== SaleStatus.COMPLETED) {
    throw new AppError(400, 'Solo se pueden anular ventas completadas', 'VALIDATION_ERROR')
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.sale.update({
      where: { id },
      data: { status: SaleStatus.VOIDED },
    })

    for (const item of sale.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { increment: item.quantity } },
      })
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: StockMovementType.VOID,
          quantity: item.quantity,
          reason: `Anulación venta #${sale.ticketNumber}`,
        },
      })
    }

    return tx.sale.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    })
  })

  if (!updated) throw new AppError(500, 'Error al anular venta', 'INTERNAL_ERROR')
  return serializeSale(updated)
}

export async function getTodaySummary() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const [aggregate, count] = await Promise.all([
    prisma.sale.aggregate({
      where: { status: SaleStatus.COMPLETED, createdAt: { gte: start } },
      _sum: { total: true },
    }),
    prisma.sale.count({
      where: { status: SaleStatus.COMPLETED, createdAt: { gte: start } },
    }),
  ])

  return {
    date: start.toISOString().slice(0, 10),
    salesCount: count,
    totalAmount: dec(aggregate._sum.total) ?? '0',
  }
}
