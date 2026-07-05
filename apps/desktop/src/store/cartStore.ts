import { useSyncExternalStore } from 'react'
import { grossFromCatalog, productSalePrice, taxFromGross } from '../lib/taxPrice'

export type CartProduct = {
  id: string
  name: string
  price: string
  stockQuantity: number
  sku: string | null
  taxRate: number
}

export type CartItem = {
  product: CartProduct
  quantity: number
  /** Descuento de línea (%); se aplica sobre listUnitPrice. */
  discount: number
  /** Precio de lista con IVA (antes del descuento de línea). */
  listUnitPrice: number
  /** Precio unitario efectivo con IVA y descuento aplicado. */
  unitPrice: number
  /** Alícuota IVA de esta línea; copiada del producto al agregar, editable solo en el ticket. */
  taxRate: number
}

export type DiscountMode = 'percent' | 'amount'

type CartState = {
  items: CartItem[]
  customerId: string | null
  discountMode: DiscountMode
  discountValue: number
}

type Listener = () => void

let state: CartState = {
  items: [],
  customerId: null,
  discountMode: 'percent',
  discountValue: 0,
}
const listeners = new Set<Listener>()

function emit() {
  for (const listener of listeners) listener()
}

function setState(partial: Partial<CartState>) {
  state = { ...state, ...partial }
  emit()
}

function unitPriceFromList(listUnitPrice: number, discountPct: number): number {
  return listUnitPrice * (1 - discountPct / 100)
}

function subtotalBeforeGlobal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
}

function globalDiscountAmount(items: CartItem[], mode: DiscountMode, value: number): number {
  const before = subtotalBeforeGlobal(items)
  if (value <= 0 || before <= 0) return 0
  if (mode === 'percent') return before * (Math.min(100, value) / 100)
  return Math.min(before, value)
}

function lineGrossAfterGlobalDiscount(
  item: CartItem,
  items: CartItem[],
  mode: DiscountMode,
  value: number,
): number {
  const lineBeforeGlobal = item.unitPrice * item.quantity
  const before = subtotalBeforeGlobal(items)
  const globalDisc = globalDiscountAmount(items, mode, value)
  if (before <= 0) return 0
  const share = lineBeforeGlobal / before
  return lineBeforeGlobal - globalDisc * share
}

export const cartStore = {
  getState: () => state,
  subscribe: (listener: Listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  catalogGrossPrice: (product: CartProduct, taxRate = product.taxRate) =>
    grossFromCatalog(product.price, product.taxRate, taxRate),

  expectedUnitPrice: (item: CartItem) => unitPriceFromList(item.listUnitPrice, item.discount),

  addItem: (product: CartProduct, quantity = 1) => {
    const existing = state.items.find((item) => item.product.id === product.id)
    const nextQty = (existing?.quantity ?? 0) + quantity
    if (nextQty > product.stockQuantity) return false

    const salePrice = productSalePrice(product.price)

    if (existing) {
      setState({
        items: state.items.map((item) =>
          item.product.id === product.id ? { ...item, quantity: nextQty, product } : item,
        ),
      })
    } else {
      setState({
        items: [
          ...state.items,
          {
            product,
            quantity,
            discount: 0,
            listUnitPrice: salePrice,
            unitPrice: salePrice,
            taxRate: product.taxRate,
          },
        ],
      })
    }
    return true
  },

  removeItem: (productId: string) => {
    setState({ items: state.items.filter((item) => item.product.id !== productId) })
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      cartStore.removeItem(productId)
      return false
    }
    const item = state.items.find((i) => i.product.id === productId)
    if (item && quantity > item.product.stockQuantity) return false
    setState({
      items: state.items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item,
      ),
    })
    return true
  },

  updateDiscount: (productId: string, discount: number) => {
    const pct = Math.max(0, Math.min(100, discount))
    setState({
      items: state.items.map((item) => {
        if (item.product.id !== productId) return item
        return {
          ...item,
          discount: pct,
          unitPrice: unitPriceFromList(item.listUnitPrice, pct),
        }
      }),
    })
  },

  updateUnitPrice: (productId: string, unitPrice: number) => {
    if (!Number.isFinite(unitPrice) || unitPrice < 0) return false
    setState({
      items: state.items.map((item) => {
        if (item.product.id !== productId) return item
        const discount =
          item.listUnitPrice > 0
            ? Math.max(0, Math.min(100, (1 - unitPrice / item.listUnitPrice) * 100))
            : 0
        return { ...item, unitPrice, discount }
      }),
    })
    return true
  },

  updateTaxRate: (productId: string, taxRate: number) => {
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 1) return false
    setState({
      items: state.items.map((item) => {
        if (item.product.id !== productId) return item
        const expectedGross = grossFromCatalog(item.product.price, item.product.taxRate, item.taxRate)
        const expectedUnit = unitPriceFromList(expectedGross, item.discount)
        const unitPricePinned = Math.abs(item.unitPrice - expectedUnit) > 0.001
        const listUnitPrice = unitPricePinned
          ? item.listUnitPrice
          : grossFromCatalog(item.product.price, item.product.taxRate, taxRate)
        return {
          ...item,
          taxRate,
          listUnitPrice,
          unitPrice: unitPriceFromList(listUnitPrice, item.discount),
        }
      }),
    })
    return true
  },

  setDiscountMode: (mode: DiscountMode) => {
    if (mode === state.discountMode) return
    setState({ discountMode: mode, discountValue: 0 })
  },

  setDiscountValue: (value: number) => {
    setState({ discountValue: Math.max(0, value) })
  },

  setCustomer: (customerId: string | null) => {
    setState({ customerId })
  },

  clearCart: (options?: { keepCustomer?: boolean }) => {
    setState({
      items: [],
      customerId: options?.keepCustomer ? state.customerId : null,
      discountMode: 'percent',
      discountValue: 0,
    })
  },

  syncProductStocks: (stockById: Record<string, number>) => {
    setState({
      items: state.items.map((item) => {
        const stock = stockById[item.product.id]
        if (stock === undefined) return item
        return { ...item, product: { ...item.product, stockQuantity: stock } }
      }),
    })
  },

  getLineGrossAfterGlobal: (item: CartItem) =>
    lineGrossAfterGlobalDiscount(item, state.items, state.discountMode, state.discountValue),

  getLineTax: (item: CartItem) =>
    taxFromGross(
      lineGrossAfterGlobalDiscount(item, state.items, state.discountMode, state.discountValue),
      item.taxRate,
    ),

  getFullSubtotal: () =>
    state.items.reduce((sum, item) => sum + item.listUnitPrice * item.quantity, 0),
  getSubtotalBeforeGlobal: () => subtotalBeforeGlobal(state.items),
  getGlobalDiscountAmount: () =>
    globalDiscountAmount(state.items, state.discountMode, state.discountValue),
  getSubtotal: () => {
    const before = subtotalBeforeGlobal(state.items)
    return before - globalDiscountAmount(state.items, state.discountMode, state.discountValue)
  },
  getTax: () => state.items.reduce((sum, item) => sum + cartStore.getLineTax(item), 0),
  getNetSubtotal: () => cartStore.getSubtotal() - cartStore.getTax(),
  getTotalWithTax: () => cartStore.getSubtotal(),
  getTotalDiscountAmount: () => cartStore.getFullSubtotal() - cartStore.getSubtotal(),
  getItemDiscountAmount: (item: CartItem) => {
    return (item.listUnitPrice - item.unitPrice) * item.quantity
  },
}

export function useCartStore<T>(selector: (s: typeof cartStore) => T): T {
  return useSyncExternalStore(
    cartStore.subscribe,
    () => selector(cartStore),
    () => selector(cartStore),
  )
}
