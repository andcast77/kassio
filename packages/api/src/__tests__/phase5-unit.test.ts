import { describe, expect, it } from 'vitest'
import {
  computeChange,
  computeSaleTotals,
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
    expect(result.total).toBe(3000)
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
