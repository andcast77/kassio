import { useSyncExternalStore } from 'react'

export type CartProduct = {
  id: string
  name: string
  price: string
  stockQuantity: number
  sku: string | null
}

export type CartItem = {
  product: CartProduct
  quantity: number
  discount: number
}

type CartState = {
  items: CartItem[]
  customerId: string | null
  discount: number
}

type Listener = () => void

let state: CartState = { items: [], customerId: null, discount: 0 }
const listeners = new Set<Listener>()

function emit() {
  for (const listener of listeners) listener()
}

function setState(partial: Partial<CartState>) {
  state = { ...state, ...partial }
  emit()
}

function fullSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0)
}

function subtotalBeforeGlobal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    const price = Number(item.product.price)
    return sum + price * item.quantity * (1 - (item.discount || 0) / 100)
  }, 0)
}

export const cartStore = {
  getState: () => state,
  subscribe: (listener: Listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  addItem: (product: CartProduct, quantity = 1) => {
    const existing = state.items.find((item) => item.product.id === product.id)
    if (existing) {
      setState({
        items: state.items.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        ),
      })
    } else {
      setState({
        items: [...state.items, { product, quantity, discount: 0 }],
      })
    }
  },

  removeItem: (productId: string) => {
    setState({ items: state.items.filter((item) => item.product.id !== productId) })
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      cartStore.removeItem(productId)
      return
    }
    setState({
      items: state.items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item,
      ),
    })
  },

  updateDiscount: (productId: string, discount: number) => {
    const pct = Math.max(0, Math.min(100, discount))
    setState({
      items: state.items.map((item) =>
        item.product.id === productId ? { ...item, discount: pct } : item,
      ),
    })
  },

  setGlobalDiscount: (discount: number) => {
    setState({ discount: Math.max(0, Math.min(100, discount)) })
  },

  setCustomer: (customerId: string | null) => {
    setState({ customerId })
  },

  clearCart: () => {
    setState({ items: [], customerId: null, discount: 0 })
  },

  getFullSubtotal: () => fullSubtotal(state.items),
  getSubtotalBeforeGlobal: () => subtotalBeforeGlobal(state.items),
  getGlobalDiscountAmount: () => {
    const before = subtotalBeforeGlobal(state.items)
    return before * (state.discount / 100)
  },
  getSubtotal: () => {
    const before = subtotalBeforeGlobal(state.items)
    return before * (1 - state.discount / 100)
  },
  getTotalDiscountAmount: () => {
    return fullSubtotal(state.items) - cartStore.getSubtotal()
  },
  getItemDiscountAmount: (item: CartItem) => {
    const price = Number(item.product.price)
    return price * item.quantity * ((item.discount || 0) / 100)
  },
}

export function useCartStore<T>(selector: (s: typeof cartStore) => T): T {
  return useSyncExternalStore(
    cartStore.subscribe,
    () => selector(cartStore),
    () => selector(cartStore),
  )
}
