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

export type SaleLineWithTax = SaleLineInput & { taxRate: number }

export function taxFromGross(gross: number, taxRate: number): number {
  if (taxRate <= 0 || gross <= 0) return 0
  return gross * (taxRate / (1 + taxRate))
}

/** unitPrice en cada línea es con IVA incluido; subtotal de venta es neto, total es bruto. */
export function computeSaleTotalsWithLineTax(
  items: SaleLineWithTax[],
  discount = 0,
): SaleTotals {
  const lineItems = items.map((item) => ({
    ...item,
    lineTotal: item.quantity * item.unitPrice,
  }))
  const grossSubtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0)

  if (discount < 0 || discount > grossSubtotal) {
    throw new Error('Descuento inválido')
  }

  const tax = lineItems.reduce((sum, item) => {
    const share = grossSubtotal > 0 ? item.lineTotal / grossSubtotal : 0
    const grossAfterDiscount = item.lineTotal - discount * share
    return sum + taxFromGross(grossAfterDiscount, item.taxRate)
  }, 0)

  const grossAfterDiscount = grossSubtotal - discount

  return {
    subtotal: grossAfterDiscount - tax,
    discount,
    tax,
    total: grossAfterDiscount,
    lineItems,
  }
}

export function validateCashPayment(paidAmount: number, total: number): boolean {
  return paidAmount >= total
}

export function computeChange(paidAmount: number, total: number): number {
  return Math.max(0, paidAmount - total)
}
