/** Códigos de comprobante AFIP (WSFE / ARCA). */
export const AFIP_VOUCHER_TYPE = {
  FACTURA_A: 1,
  NOTA_DEBITO_A: 2,
  NOTA_CREDITO_A: 3,
  FACTURA_B: 6,
  NOTA_DEBITO_B: 7,
  NOTA_CREDITO_B: 8,
  FACTURA_C: 11,
  NOTA_DEBITO_C: 12,
  NOTA_CREDITO_C: 13,
} as const

export type AfipVoucherTypeCode = (typeof AFIP_VOUCHER_TYPE)[keyof typeof AFIP_VOUCHER_TYPE]

/** Venta mostrador a consumidor final (sin CUIT). */
export const DEFAULT_POS_VOUCHER_TYPE = AFIP_VOUCHER_TYPE.FACTURA_C

/** Venta a cliente con CUIT/CUIL. */
export const REGISTERED_CUSTOMER_VOUCHER_TYPE = AFIP_VOUCHER_TYPE.FACTURA_B

const VOUCHER_TYPE_LABELS: Record<number, string> = {
  [AFIP_VOUCHER_TYPE.FACTURA_A]: 'Factura A',
  [AFIP_VOUCHER_TYPE.NOTA_DEBITO_A]: 'Nota de débito A',
  [AFIP_VOUCHER_TYPE.NOTA_CREDITO_A]: 'Nota de crédito A',
  [AFIP_VOUCHER_TYPE.FACTURA_B]: 'Factura B',
  [AFIP_VOUCHER_TYPE.NOTA_DEBITO_B]: 'Nota de débito B',
  [AFIP_VOUCHER_TYPE.NOTA_CREDITO_B]: 'Nota de crédito B',
  [AFIP_VOUCHER_TYPE.FACTURA_C]: 'Factura C',
  [AFIP_VOUCHER_TYPE.NOTA_DEBITO_C]: 'Nota de débito C',
  [AFIP_VOUCHER_TYPE.NOTA_CREDITO_C]: 'Nota de crédito C',
}

export function voucherTypeLabel(voucherType: number): string {
  return VOUCHER_TYPE_LABELS[voucherType] ?? `Comprobante ${voucherType}`
}

/** Formato estándar AFIP: 0001-00000062 */
export function formatVoucherNumber(puntoVenta: number, voucherNumber: number): string {
  return `${String(puntoVenta).padStart(4, '0')}-${String(voucherNumber).padStart(8, '0')}`
}

export function resolvePosVoucherType(customerTaxId: string | null | undefined): AfipVoucherTypeCode {
  const trimmed = customerTaxId?.trim()
  if (trimmed) return REGISTERED_CUSTOMER_VOUCHER_TYPE
  return DEFAULT_POS_VOUCHER_TYPE
}

export type VoucherIdentity = {
  puntoVenta: number
  voucherType: number
  voucherNumber: number
}

export function serializeVoucherFields(
  puntoVenta: number,
  voucherType: number,
  voucherNumber: number,
) {
  return {
    puntoVenta,
    voucherType,
    voucherNumber,
    voucherFormatted: formatVoucherNumber(puntoVenta, voucherNumber),
    voucherTypeName: voucherTypeLabel(voucherType),
  }
}

export function serializeOptionalFiscalFields(
  puntoVenta: number | null,
  voucherType: number | null,
  voucherNumber: number | null,
) {
  if (puntoVenta == null || voucherType == null || voucherNumber == null) {
    return {
      puntoVenta: null,
      voucherType: null,
      voucherNumber: null,
      voucherFormatted: null,
      voucherTypeName: null,
    }
  }
  return serializeVoucherFields(puntoVenta, voucherType, voucherNumber)
}
