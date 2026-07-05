import { describe, expect, it } from 'vitest'
import { clampIvaPercent, formatIvaPercentInput, roundIvaPercent } from './IvaPercentSpinbox'

describe('IvaPercentSpinbox helpers', () => {
  it('formats decimal rates as percentage text', () => {
    expect(formatIvaPercentInput(0.21)).toBe('21')
    expect(formatIvaPercentInput(0.105)).toBe('10.5')
    expect(formatIvaPercentInput(0)).toBe('0')
  })

  it('rounds and clamps percent values', () => {
    expect(roundIvaPercent(10.555)).toBe(10.56)
    expect(clampIvaPercent(-5)).toBe(0)
    expect(clampIvaPercent(150)).toBe(100)
  })
})
