import { prisma, SaleStatus } from '@kassio/database'
import { dec } from '../lib/decimal.js'

export type ReportPeriod = 'today' | 'week' | 'month'

function periodRange(period: ReportPeriod): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)

  if (period === 'week') {
    start.setDate(start.getDate() - 6)
  } else if (period === 'month') {
    start.setDate(start.getDate() - 29)
  }

  return { start, end }
}

export async function getSalesStats(period: ReportPeriod) {
  const { start, end } = periodRange(period)
  const agg = await prisma.sale.aggregate({
    where: {
      status: SaleStatus.COMPLETED,
      createdAt: { gte: start, lte: end },
    },
    _count: true,
    _sum: { total: true, discount: true },
  })

  const salesCount = agg._count
  const totalRevenue = Number(agg._sum.total ?? 0)
  const totalDiscount = Number(agg._sum.discount ?? 0)
  const averageSale = salesCount > 0 ? totalRevenue / salesCount : 0

  return {
    salesCount,
    totalRevenue: dec(totalRevenue)!,
    totalDiscount: dec(totalDiscount)!,
    averageSale: dec(averageSale)!,
    totalTax: '0',
  }
}

export async function getDailySales(days: number) {
  const safeDays = Math.min(90, Math.max(1, days))
  const start = new Date()
  start.setDate(start.getDate() - (safeDays - 1))
  start.setHours(0, 0, 0, 0)

  const sales = await prisma.sale.findMany({
    where: {
      status: SaleStatus.COMPLETED,
      createdAt: { gte: start },
    },
    select: { createdAt: true, total: true },
  })

  const map = new Map<string, { sales: number; revenue: number }>()
  for (const sale of sales) {
    const dateStr = sale.createdAt.toISOString().slice(0, 10)
    const cur = map.get(dateStr) ?? { sales: 0, revenue: 0 }
    cur.sales += 1
    cur.revenue += Number(sale.total)
    map.set(dateStr, cur)
  }

  const result: Array<{ date: string; sales: number; revenue: string }> = []
  for (let i = 0; i < safeDays; i++) {
    const date = new Date(start)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().slice(0, 10)
    const data = map.get(dateStr) ?? { sales: 0, revenue: 0 }
    result.push({ date: dateStr, sales: data.sales, revenue: dec(data.revenue)! })
  }

  return result
}

export async function getTopProducts(period: ReportPeriod, limit = 10) {
  const { start, end } = periodRange(period)
  const safeLimit = Math.min(50, Math.max(1, limit))

  const saleIds = (
    await prisma.sale.findMany({
      where: {
        status: SaleStatus.COMPLETED,
        createdAt: { gte: start, lte: end },
      },
      select: { id: true },
    })
  ).map((s) => s.id)

  if (saleIds.length === 0) return []

  const items = await prisma.saleItem.findMany({
    where: { saleId: { in: saleIds } },
    include: { product: { select: { id: true, name: true } } },
  })

  const byProduct = new Map<
    string,
    { productName: string; quantity: number; revenue: number; salesCount: Set<string> }
  >()

  for (const item of items) {
    const id = item.productId
    const rev = Number(item.lineTotal)
    const cur = byProduct.get(id)
    if (!cur) {
      byProduct.set(id, {
        productName: item.product.name,
        quantity: item.quantity,
        revenue: rev,
        salesCount: new Set([item.saleId]),
      })
    } else {
      cur.quantity += item.quantity
      cur.revenue += rev
      cur.salesCount.add(item.saleId)
    }
  }

  return Array.from(byProduct.entries())
    .map(([productId, v]) => ({
      productId,
      productName: v.productName,
      quantity: v.quantity,
      revenue: dec(v.revenue)!,
      salesCount: v.salesCount.size,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, safeLimit)
}

export async function getInventorySummary() {
  const products = await prisma.product.findMany({
    where: { active: true },
    select: { stockQuantity: true, price: true, cost: true },
  })

  let totalValue = 0
  let totalRetail = 0
  let totalUnits = 0
  let outOfStock = 0

  for (const p of products) {
    totalUnits += p.stockQuantity
    totalRetail += p.stockQuantity * Number(p.price)
    totalValue += p.stockQuantity * Number(p.cost ?? 0)
    if (p.stockQuantity === 0) outOfStock += 1
  }

  return {
    totalProducts: products.length,
    outOfStockProducts: outOfStock,
    totalStockUnits: totalUnits,
    inventoryCostValue: dec(totalValue)!,
    inventoryRetailValue: dec(totalRetail)!,
  }
}
