import { useEffect, useState } from 'react'
import { DiscountPercentSpinbox } from '../DiscountPercentSpinbox'
import { IvaPercentSpinbox } from '../IvaPercentSpinbox'
import { NavIcon } from '../../layout/nav-icons'
import { cartStore, useCartStore } from '../../store/cartStore'
import { formatCurrency } from '../../lib/formatCurrency'

type Props = {
  ticketNumber?: number | null
  onNotify?: (message: { type: 'ok' | 'error'; text: string }) => void
}

type LineQuantityProps = {
  productId: string
  productName: string
  stockQuantity: number
  quantity: number
  onNotify?: Props['onNotify']
}

function TicketLineQuantity({
  productId,
  productName,
  stockQuantity,
  quantity,
  onNotify,
}: LineQuantityProps) {
  const [draft, setDraft] = useState<string | null>(null)

  useEffect(() => {
    setDraft(null)
  }, [quantity])

  function commit(raw: string) {
    setDraft(null)
    const trimmed = raw.trim()
    if (trimmed === '') {
      cartStore.removeItem(productId)
      return
    }
    const qty = parseInt(trimmed, 10)
    if (!Number.isFinite(qty) || qty <= 0) {
      cartStore.removeItem(productId)
      return
    }
    const ok = cartStore.updateQuantity(productId, qty)
    if (!ok) {
      onNotify?.({
        type: 'error',
        text: `Stock máximo: ${stockQuantity}`,
      })
    }
  }

  function step(delta: number) {
    setDraft(null)
    const next = quantity + delta
    if (next < 1) return
    const ok = cartStore.updateQuantity(productId, next)
    if (!ok) {
      onNotify?.({
        type: 'error',
        text: `Stock máximo: ${stockQuantity}`,
      })
    }
  }

  return (
    <div className="pos-qty-spinbox">
      <input
        type="text"
        inputMode="numeric"
        className="pos-qty-input"
        aria-label={`Cantidad de ${productName}`}
        value={draft ?? String(quantity)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
      />
      <div className="pos-qty-spinners">
        <button
          type="button"
          className="pos-qty-spin"
          aria-label={`Aumentar cantidad de ${productName}`}
          onClick={() => step(1)}
        >
          ▲
        </button>
        <button
          type="button"
          className="pos-qty-spin"
          aria-label={`Disminuir cantidad de ${productName}`}
          disabled={quantity <= 1}
          onClick={() => step(-1)}
        >
          ▼
        </button>
      </div>
    </div>
  )
}

type LineUnitPriceProps = {
  productId: string
  productName: string
  unitPrice: number
  catalogPrice: number
}

function TicketLineUnitPrice({
  productId,
  productName,
  unitPrice,
  catalogPrice,
}: LineUnitPriceProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const isOverride = Math.abs(unitPrice - catalogPrice) > 0.001

  useEffect(() => {
    setDraft(null)
  }, [unitPrice])

  function formatDraft(price: number) {
    return Number.isInteger(price) ? String(price) : price.toFixed(2)
  }

  function commit(raw: string) {
    const trimmed = raw.trim().replace(',', '.')
    if (trimmed === '') {
      cartStore.updateUnitPrice(productId, catalogPrice)
      setDraft(formatDraft(catalogPrice))
      return
    }
    const price = parseFloat(trimmed)
    if (!Number.isFinite(price) || price < 0) {
      cartStore.updateUnitPrice(productId, catalogPrice)
      setDraft(formatDraft(catalogPrice))
      return
    }
    setDraft(null)
    cartStore.updateUnitPrice(productId, price)
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      className={`pos-unit-price-input${isOverride ? ' pos-unit-price-override' : ''}`}
      aria-label={`Precio unitario de ${productName}`}
      title={isOverride ? `Precio de catálogo: ${formatDraft(catalogPrice)}` : undefined}
      value={draft ?? formatDraft(unitPrice)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
      }}
    />
  )
}

type LineIvaProps = {
  productId: string
  productName: string
  taxRate: number
  catalogTaxRate: number
}

function TicketLineIva({ productId, productName, taxRate, catalogTaxRate }: LineIvaProps) {
  const isOverride = Math.abs(taxRate - catalogTaxRate) > 0.0001

  return (
    <IvaPercentSpinbox
      className={isOverride ? 'iva-percent-override' : undefined}
      value={taxRate}
      resetRate={catalogTaxRate}
      onChange={(rate) => cartStore.updateTaxRate(productId, rate)}
      ariaLabel={`IVA de ${productName}`}
    />
  )
}

type LineDiscountProps = {
  productId: string
  productName: string
  discount: number
}

function TicketLineDiscount({ productId, productName, discount }: LineDiscountProps) {
  return (
    <DiscountPercentSpinbox
      className={discount > 0 ? 'discount-percent-active' : undefined}
      value={discount}
      onChange={(pct) => cartStore.updateDiscount(productId, pct)}
      ariaLabel={`Descuento de ${productName}`}
    />
  )
}

function ticketLabel(ticketNumber?: number | null) {
  if (ticketNumber == null) return null
  return <span className="pos-ticket-number">#{ticketNumber}</span>
}

export function ShoppingCart({ ticketNumber, onNotify }: Props) {
  const items = useCartStore((s) => s.getState().items)

  function handleClear() {
    if (items.length === 0) return
    if (!window.confirm('¿Cancelar el ticket?')) return
    cartStore.clearCart()
    onNotify?.({ type: 'ok', text: 'Ticket cancelado' })
  }

  if (items.length === 0) {
    return (
      <section className="pos-cart card">
        <h2>
          Ticket
          {ticketLabel(ticketNumber)}
        </h2>
        <p className="muted pos-cart-empty">Sin ítems</p>
      </section>
    )
  }

  return (
    <section className="pos-cart card">
      <div className="pos-cart-head">
        <h2>
          Ticket
          {ticketLabel(ticketNumber)}
        </h2>
        <button type="button" className="ghost pos-clear-cart" onClick={handleClear}>
          Cancelar
        </button>
      </div>

      <div className="pos-cart-table-wrap">
        <div className="pos-cart-header">
          <span>Producto</span>
          <span>Cant.</span>
          <span>IVA %</span>
          <span>Desc. %</span>
          <span>P. unit.</span>
          <span>Subtotal</span>
          <span />
        </div>
        {items.map((item) => {
          const unitPrice = item.unitPrice
          const discount = item.discount || 0
          const lineSubtotal = unitPrice * item.quantity
          const expectedUnitPrice = cartStore.expectedUnitPrice(item)
          return (
            <div key={item.product.id} className="pos-cart-row">
              <span className="pos-cart-product">
                {item.product.sku ? (
                  <span className="pos-cart-sku-caption muted">{item.product.sku}</span>
                ) : null}
                <span className="pos-cart-name">{item.product.name}</span>
              </span>
              <span className="pos-cart-qty">
                <TicketLineQuantity
                  productId={item.product.id}
                  productName={item.product.name}
                  stockQuantity={item.product.stockQuantity}
                  quantity={item.quantity}
                  onNotify={onNotify}
                />
              </span>
              <span className="pos-cart-tax">
                <TicketLineIva
                  productId={item.product.id}
                  productName={item.product.name}
                  taxRate={item.taxRate}
                  catalogTaxRate={item.product.taxRate}
                />
              </span>
              <span className="pos-cart-discount">
                <TicketLineDiscount
                  productId={item.product.id}
                  productName={item.product.name}
                  discount={discount}
                />
              </span>
              <span className="pos-cart-unit-price">
                <TicketLineUnitPrice
                  productId={item.product.id}
                  productName={item.product.name}
                  unitPrice={unitPrice}
                  catalogPrice={expectedUnitPrice}
                />
              </span>
              <span className="pos-cart-subtotal">{formatCurrency(lineSubtotal)}</span>
              <span className="pos-cart-actions">
                <button
                  type="button"
                  className="pos-remove-btn"
                  onClick={() => cartStore.removeItem(item.product.id)}
                  aria-label="Quitar"
                >
                  <NavIcon name="trash" />
                </button>
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
