import { useEffect, useMemo, useState } from 'react'
import {
  createSale,
  fetchCurrentCashSession,
  fetchProducts,
  type CashSession,
  type Product,
  type Sale,
} from '../api'
import { useCart } from '../hooks/useCart'
import { printTicket, TicketPrint } from '../components/pos/TicketPrint'

type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER'

export function PosPage() {
  const cart = useCart()
  const [session, setSession] = useState<CashSession | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPay, setShowPay] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [paidAmount, setPaidAmount] = useState('')
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  const [lastPaid, setLastPaid] = useState<number | undefined>()
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    void loadProducts()
  }, [search])

  async function load() {
    setLoading(true)
    const sessionRes = await fetchCurrentCashSession()
    if (sessionRes.success) setSession(sessionRes.data.session)
    setLoading(false)
  }

  async function loadProducts() {
    const res = await fetchProducts(search)
    if (res.success) setProducts(res.data.products.filter((p) => p.active))
  }

  const filtered = useMemo(() => products, [products])

  function handleAdd(product: Product) {
    if (product.stockQuantity <= 0) {
      setError('Sin stock')
      return
    }
    const inCart = cart.items.find((l) => l.product.id === product.id)
    const qty = (inCart?.quantity ?? 0) + 1
    if (qty > product.stockQuantity) {
      setError(`Stock máximo: ${product.stockQuantity}`)
      return
    }
    setError(null)
    cart.addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        stockQuantity: product.stockQuantity,
        sku: product.sku,
      },
      1,
    )
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    setProcessing(true)
    setError(null)

    const paid = paymentMethod === 'CASH' ? Number(paidAmount) : cart.total
    const res = await createSale({
      items: cart.items.map((line) => ({
        productId: line.product.id,
        quantity: line.quantity,
      })),
      paymentMethod,
      discount: cart.discount,
      paidAmount: paymentMethod === 'CASH' ? paid : undefined,
    })

    setProcessing(false)
    if (!res.success) {
      setError(res.message)
      return
    }

    setLastSale(res.data.sale)
    setLastPaid(paymentMethod === 'CASH' ? paid : undefined)
    cart.clearCart()
    setShowPay(false)
    setPaidAmount('')
    await loadProducts()
  }

  if (loading) {
    return <p className="muted">Cargando punto de venta…</p>
  }

  if (!session) {
    return (
      <section className="card">
        <h2>Caja cerrada</h2>
        <p className="muted">Abrí la caja desde la sección Caja antes de vender.</p>
      </section>
    )
  }

  return (
    <div className="pos-layout">
      <section className="pos-products card">
        <div className="row">
          <label className="grow">
            Buscar producto
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nombre, SKU o código de barras"
            />
          </label>
        </div>
        <div className="product-grid">
          {filtered.map((product) => (
            <button
              key={product.id}
              type="button"
              className="product-card"
              disabled={product.stockQuantity <= 0}
              onClick={() => handleAdd(product)}
            >
              <strong>{product.name}</strong>
              <span>${product.price}</span>
              <span className="muted">Stock {product.stockQuantity}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="pos-cart card">
        <h2>Carrito</h2>
        {cart.items.length === 0 ? (
          <p className="muted">Agregá productos desde la grilla.</p>
        ) : (
          <ul className="cart-list">
            {cart.items.map((line) => (
              <li key={line.product.id} className="cart-line">
                <div>
                  <strong>{line.product.name}</strong>
                  <span className="muted">${line.product.price} c/u</span>
                </div>
                <div className="cart-line-actions">
                  <button type="button" className="ghost" onClick={() => cart.updateQuantity(line.product.id, line.quantity - 1)}>−</button>
                  <span>{line.quantity}</span>
                  <button type="button" className="ghost" onClick={() => cart.updateQuantity(line.product.id, line.quantity + 1)}>+</button>
                  <button type="button" className="ghost" onClick={() => cart.removeItem(line.product.id)}>✕</button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="cart-totals">
          <div className="ticket-row">
            <span>Subtotal</span>
            <span>${cart.subtotal.toFixed(2)}</span>
          </div>
          <label>
            Descuento ($)
            <input
              type="number"
              min="0"
              step="0.01"
              value={cart.discount || ''}
              onChange={(e) => cart.setDiscount(Number(e.target.value) || 0)}
            />
          </label>
          <div className="ticket-row ticket-total">
            <span>Total</span>
            <span>${cart.total.toFixed(2)}</span>
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        <button
          type="button"
          disabled={cart.items.length === 0}
          onClick={() => {
            setShowPay(true)
            setPaidAmount(cart.total.toFixed(2))
          }}
        >
          Cobrar
        </button>
      </section>

      {showPay && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowPay(false)}>
          <form className="modal card" onSubmit={handleCheckout} onClick={(e) => e.stopPropagation()}>
            <h2>Cobrar ${cart.total.toFixed(2)}</h2>
            <label>
              Medio de pago
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                <option value="CASH">Efectivo</option>
                <option value="CARD">Tarjeta</option>
                <option value="TRANSFER">Transferencia</option>
                <option value="OTHER">Otro</option>
              </select>
            </label>
            {paymentMethod === 'CASH' && (
              <label>
                Monto recibido
                <input
                  type="number"
                  min={cart.total}
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  required
                />
              </label>
            )}
            {paymentMethod === 'CASH' && paidAmount && (
              <p className="ok">
                Vuelto: ${Math.max(0, Number(paidAmount) - cart.total).toFixed(2)}
              </p>
            )}
            <div className="row">
              <button type="button" className="ghost" onClick={() => setShowPay(false)}>Cancelar</button>
              <button type="submit" disabled={processing}>{processing ? 'Procesando…' : 'Confirmar venta'}</button>
            </div>
          </form>
        </div>
      )}

      {lastSale && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal card ticket-modal">
            <TicketPrint sale={lastSale} paidAmount={lastPaid} />
            <div className="row">
              <button type="button" onClick={() => printTicket(lastSale, lastPaid)}>Imprimir</button>
              <button type="button" className="ghost" onClick={() => setLastSale(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
