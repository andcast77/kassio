import { useCallback, useMemo, useState } from 'react'
import type { Product } from '../api'

export type CartLine = {
  product: Pick<Product, 'id' | 'name' | 'price' | 'stockQuantity' | 'sku'>
  quantity: number
}

export function useCart() {
  const [items, setItems] = useState<CartLine[]>([])
  const [discount, setDiscount] = useState(0)

  const addItem = useCallback((product: CartLine['product'], quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((line) => line.product.id === product.id)
      if (existing) {
        return prev.map((line) =>
          line.product.id === product.id
            ? { ...line, quantity: line.quantity + quantity }
            : line,
        )
      }
      return [...prev, { product, quantity }]
    })
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((line) => line.product.id !== productId))
      return
    }
    setItems((prev) =>
      prev.map((line) => (line.product.id === productId ? { ...line, quantity } : line)),
    )
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((line) => line.product.id !== productId))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    setDiscount(0)
  }, [])

  const subtotal = useMemo(
    () => items.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0),
    [items],
  )

  const total = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount])

  return {
    items,
    discount,
    setDiscount,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    total,
  }
}
