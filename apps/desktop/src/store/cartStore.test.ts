import { describe, expect, it, beforeEach } from 'vitest'
import {
  grossFromCatalog,
  productSalePrice,
  taxFromGross,
} from '../lib/taxPrice'
import { cartStore } from './cartStore'

const product = {
  id: 'p1',
  name: 'Demo',
  price: '1000',
  stockQuantity: 10,
  sku: 'D1',
  taxRate: 0.21,
}

const salePrice = productSalePrice(product.price)

describe('cartStore discount resolver', () => {
  beforeEach(() => {
    cartStore.clearCart()
    cartStore.addItem(product, 2)
  })

  it('applies percent discount to subtotal before global', () => {
    cartStore.setDiscountMode('percent')
    cartStore.setDiscountValue(10)
    expect(cartStore.getSubtotalBeforeGlobal()).toBe(salePrice * 2)
    expect(cartStore.getGlobalDiscountAmount()).toBe(salePrice * 2 * 0.1)
    expect(cartStore.getSubtotal()).toBe(salePrice * 2 * 0.9)
  })

  it('caps amount discount at subtotal before global', () => {
    cartStore.setDiscountMode('amount')
    cartStore.setDiscountValue(5000)
    expect(cartStore.getGlobalDiscountAmount()).toBe(salePrice * 2)
    expect(cartStore.getSubtotal()).toBe(0)
  })

  it('clears discount value when switching modes', () => {
    cartStore.setDiscountMode('percent')
    cartStore.setDiscountValue(15)
    cartStore.setDiscountMode('amount')
    expect(cartStore.getState().discountValue).toBe(0)
    expect(cartStore.getGlobalDiscountAmount()).toBe(0)
  })

  it('applies line discount to unit price and combines with global discount', () => {
    cartStore.updateDiscount('p1', 10)
    expect(cartStore.getState().items[0]?.unitPrice).toBe(salePrice * 0.9)
    expect(cartStore.getState().items[0]?.listUnitPrice).toBe(salePrice)
    expect(cartStore.getSubtotalBeforeGlobal()).toBe(salePrice * 2 * 0.9)
    cartStore.setDiscountMode('percent')
    cartStore.setDiscountValue(5)
    expect(cartStore.getTotalDiscountAmount()).toBeCloseTo(
      salePrice * 2 * 0.1 + salePrice * 2 * 0.9 * 0.05,
    )
  })

  it('uses overridden gross unit price without changing catalog product', () => {
    cartStore.updateUnitPrice('p1', 850)
    expect(cartStore.getState().items[0]?.unitPrice).toBe(850)
    expect(cartStore.getState().items[0]?.product.price).toBe('1000')
    expect(cartStore.getSubtotalBeforeGlobal()).toBe(1700)
  })
})

describe('cartStore tax', () => {
  beforeEach(() => {
    cartStore.clearCart()
    cartStore.addItem(product, 1)
  })

  it('loads catalog sale price with IVA as unit price', () => {
    expect(cartStore.getState().items[0]?.unitPrice).toBe(salePrice)
    expect(cartStore.getState().items[0]?.listUnitPrice).toBe(salePrice)
    expect(cartStore.getState().items[0]?.taxRate).toBe(product.taxRate)
    expect(cartStore.getTax()).toBe(taxFromGross(salePrice, product.taxRate))
    expect(cartStore.getTotalWithTax()).toBe(salePrice)
  })

  it('recalculates list and unit price when line tax changes and price was not overridden', () => {
    const at105 = grossFromCatalog(product.price, product.taxRate, 0.105)
    cartStore.updateTaxRate('p1', 0.105)
    expect(cartStore.getState().items[0]?.taxRate).toBe(0.105)
    expect(cartStore.getState().items[0]?.listUnitPrice).toBeCloseTo(at105, 2)
    expect(cartStore.getState().items[0]?.unitPrice).toBeCloseTo(at105, 2)
    expect(cartStore.getTax()).toBeCloseTo(taxFromGross(at105, 0.105), 2)
  })

  it('recalculates unit price when line discount changes', () => {
    cartStore.updateDiscount('p1', 20)
    expect(cartStore.getState().items[0]?.unitPrice).toBe(800)
    expect(cartStore.getTax()).toBe(taxFromGross(800, product.taxRate))
    expect(cartStore.getTotalWithTax()).toBe(800)
  })

  it('sums tax from lines with different line rates', () => {
    const reduced = { ...product, id: 'p2', name: 'Reducido', taxRate: 0.105, price: '1000' }
    cartStore.addItem(reduced, 1)
    expect(cartStore.getTax()).toBe(
      taxFromGross(salePrice, 0.21) + taxFromGross(1000, 0.105),
    )
    expect(cartStore.getTotalWithTax()).toBe(salePrice + 1000)
  })

  it('resets discount fields on clearCart', () => {
    cartStore.setDiscountValue(10)
    cartStore.clearCart()
    expect(cartStore.getState().discountValue).toBe(0)
    expect(cartStore.getState().discountMode).toBe('percent')
  })
})
