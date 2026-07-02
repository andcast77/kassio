import { cartStore, useCartStore } from '../../store/cartStore'
import { formatCurrency } from '../../lib/formatCurrency'

export function ShoppingCart() {
  const items = useCartStore((s) => s.getState().items)

  if (items.length === 0) {
    return (
      <section className="pos-cart card">
        <h2>Carrito de compra</h2>
        <p className="muted pos-cart-empty">El carrito está vacío</p>
      </section>
    )
  }

  return (
    <section className="pos-cart card">
      <h2>
        Carrito de compra
        <span className="muted pos-cart-count">
          ({items.length} {items.length === 1 ? 'producto' : 'productos'})
        </span>
      </h2>

      <div className="pos-cart-table-wrap">
        <div className="pos-cart-header">
          <span>SKU</span>
          <span>Producto</span>
          <span>Cant.</span>
          <span>P. unit.</span>
          <span>Desc. %</span>
          <span>Subtotal</span>
          <span />
        </div>
        {items.map((item) => {
          const price = Number(item.product.price)
          const lineSubtotal = price * item.quantity * (1 - (item.discount || 0) / 100)
          return (
            <div key={item.product.id} className="pos-cart-row">
              <span className="muted">{item.product.sku ?? '—'}</span>
              <span className="pos-cart-name">{item.product.name}</span>
              <span className="pos-cart-qty">
                <button
                  type="button"
                  className="ghost pos-qty-btn"
                  onClick={() => cartStore.updateQuantity(item.product.id, item.quantity - 1)}
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  className="ghost pos-qty-btn"
                  onClick={() => {
                    if (item.quantity + 1 > item.product.stockQuantity) return
                    cartStore.updateQuantity(item.product.id, item.quantity + 1)
                  }}
                >
                  +
                </button>
              </span>
              <span>{formatCurrency(price)}</span>
              <span>
                <input
                  type="number"
                  className="pos-discount-input"
                  min={0}
                  max={100}
                  step={0.1}
                  value={item.discount || ''}
                  onChange={(e) =>
                    cartStore.updateDiscount(item.product.id, parseFloat(e.target.value) || 0)
                  }
                />
              </span>
              <span>{formatCurrency(lineSubtotal)}</span>
              <button
                type="button"
                className="ghost pos-remove-btn"
                onClick={() => cartStore.removeItem(item.product.id)}
                aria-label="Quitar"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
