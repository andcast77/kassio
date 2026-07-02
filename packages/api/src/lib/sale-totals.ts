export type SaleLineInput = {
  quantity: number
  unitPrice: number
}

export type SaleTotals = {
  subtotal: number
  discount: number
  tax: number
  total: number
  lineItems: Array<SaleLineInput & { lineTotal: number }>
}

export function computeSaleTotals(
  items: SaleLineInput[],
  discount = 0,
  taxRate = 0,
): SaleTotals {
  const lineItems = items.map((item) => ({
    ...item,
    lineTotal: item.quantity * item.unitPrice,
  }))
  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0)

  if (discount < 0 || discount > subtotal) {
    throw new Error('Descuento inválido')
  }

  const afterDiscount = subtotal - discount
  const tax = afterDiscount * taxRate

  return {
    subtotal,
    discount,
    tax,
    total: afterDiscount + tax,
    lineItems,
  }
}

export function validateCashPayment(paidAmount: number, total: number): boolean {
  return paidAmount >= total
}

export function computeChange(paidAmount: number, total: number): number {
  return Math.max(0, paidAmount - total)
}
