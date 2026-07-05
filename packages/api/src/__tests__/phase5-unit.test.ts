import { describe, expect, it } from 'vitest'
import {
  computeChange,
  computeSaleTotals,
  computeSaleTotalsWithLineTax,
  validateCashPayment,
} from '../lib/sale-totals.js'

describe('sale totals', () => {
  it('computes subtotal and total with discount', () => {
    const result = computeSaleTotals(
      [
        { quantity: 2, unitPrice: 800 },
        { quantity: 1, unitPrice: 1500 },
      ],
      100,
    )
    expect(result.subtotal).toBe(3100)
    expect(result.tax).toBe(0)
    expect(result.total).toBe(3000)
  })

  it('computes tax on amount after discount', () => {
    const result = computeSaleTotals([{ quantity: 1, unitPrice: 1000 }], 0, 0.21)
    expect(result.subtotal).toBe(1000)
    expect(result.tax).toBe(210)
    expect(result.total).toBe(1210)
  })

  it('uses explicit taxRate override instead of default', () => {
    const at21 = computeSaleTotals([{ quantity: 1, unitPrice: 1000 }], 0, 0.21)
    const at105 = computeSaleTotals([{ quantity: 1, unitPrice: 1000 }], 0, 0.105)
    expect(at105.tax).toBe(105)
    expect(at105.total).toBe(1105)
    expect(at105.tax).toBeLessThan(at21.tax)
  })

  it('computes tax per line with mixed rates on gross prices', () => {
    const result = computeSaleTotalsWithLineTax([
      { quantity: 1, unitPrice: 1210, taxRate: 0.21 },
      { quantity: 1, unitPrice: 1105, taxRate: 0.105 },
    ])
    expect(result.total).toBe(2315)
    expect(result.tax).toBe(315)
    expect(result.subtotal).toBe(2000)
  })

  it('rejects discount greater than subtotal', () => {
    expect(() => computeSaleTotals([{ quantity: 1, unitPrice: 500 }], 600)).toThrow(
      'Descuento inválido',
    )
  })

  it('validates cash payment and change', () => {
    expect(validateCashPayment(5000, 3000)).toBe(true)
    expect(validateCashPayment(1000, 3000)).toBe(false)
    expect(computeChange(5000, 3000)).toBe(2000)
  })
})
