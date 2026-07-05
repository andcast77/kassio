export function grossFromNet(net: number, taxRate: number): number {
  return net * (1 + taxRate)
}

export function taxFromGross(gross: number, taxRate: number): number {
  if (taxRate <= 0 || gross <= 0) return 0
  return gross * (taxRate / (1 + taxRate))
}

export function netFromGross(gross: number, taxRate: number): number {
  return gross - taxFromGross(gross, taxRate)
}

/** Precio de venta del catálogo (con IVA incluido al IVA del producto). */
export function productSalePrice(price: number | string): number {
  return Number(price)
}

/** Neto implícito a partir del precio de catálogo y su alícuota. */
export function catalogNetPrice(salePrice: number | string, catalogTaxRate: number): number {
  return netFromGross(productSalePrice(salePrice), catalogTaxRate)
}

/** Precio con IVA para una alícuota, manteniendo el neto del catálogo. */
export function grossFromCatalog(
  salePrice: number | string,
  catalogTaxRate: number,
  taxRate: number,
): number {
  return grossFromNet(catalogNetPrice(salePrice, catalogTaxRate), taxRate)
}

export function formatIvaPercent(rate: number): string {
  return `${Number((rate * 100).toFixed(2))}%`
}

/** @deprecated use productSalePrice — el precio de catálogo ya incluye IVA */
export function productGrossPrice(netPrice: number | string, _taxRate: number): number {
  return Number(netPrice)
}
