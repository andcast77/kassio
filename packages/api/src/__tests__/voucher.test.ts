import { describe, expect, it } from 'vitest'
import {
  AFIP_VOUCHER_TYPE,
  DEFAULT_POS_VOUCHER_TYPE,
  formatVoucherNumber,
  resolvePosVoucherType,
  serializeOptionalFiscalFields,
  serializeVoucherFields,
  voucherTypeLabel,
} from '../lib/voucher.js'

describe('voucher', () => {
  it('formats AFIP voucher number', () => {
    expect(formatVoucherNumber(1, 62)).toBe('0001-00000062')
    expect(formatVoucherNumber(12, 3)).toBe('0012-00000003')
  })

  it('labels common voucher types', () => {
    expect(voucherTypeLabel(AFIP_VOUCHER_TYPE.FACTURA_C)).toBe('Factura C')
    expect(voucherTypeLabel(AFIP_VOUCHER_TYPE.FACTURA_B)).toBe('Factura B')
  })

  it('resolves POS voucher type from customer tax id', () => {
    expect(resolvePosVoucherType(null)).toBe(DEFAULT_POS_VOUCHER_TYPE)
    expect(resolvePosVoucherType('')).toBe(DEFAULT_POS_VOUCHER_TYPE)
    expect(resolvePosVoucherType('20-12345678-9')).toBe(AFIP_VOUCHER_TYPE.FACTURA_B)
  })

  it('serializes voucher fields for API', () => {
    expect(serializeVoucherFields(1, 11, 5)).toEqual({
      puntoVenta: 1,
      voucherType: 11,
      voucherNumber: 5,
      voucherFormatted: '0001-00000005',
      voucherTypeName: 'Factura C',
    })
  })

  it('serializes optional fiscal fields as null when not invoiced', () => {
    expect(serializeOptionalFiscalFields(null, null, null)).toEqual({
      puntoVenta: null,
      voucherType: null,
      voucherNumber: null,
      voucherFormatted: null,
      voucherTypeName: null,
    })
  })
})
