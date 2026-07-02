import { cartStore, useCartStore } from '../../store/cartStore'
import { formatCurrency } from '../../lib/formatCurrency'

type Props = {
  onCheckout: () => void
  taxRate?: number
}

export function TotalsPanel({ onCheckout, taxRate = 0 }: Props) {
  const items = useCartStore((s) => s.getState().items)
  const discountPct = useCartStore((s) => s.getState().discount)
  const subtotalBeforeGlobal = useCartStore((s) => s.getSubtotalBeforeGlobal())
  const globalDiscountAmount = useCartStore((s) => s.getGlobalDiscountAmount())
  const subtotal = useCartStore((s) => s.getSubtotal())
  const tax = subtotal * taxRate
  const total = subtotal + tax
  const canCheckout = items.length > 0 && total > 0

  return (
    <section className="pos-totals card">
      <h2>Totales</h2>

      <label>
        Descuento global (%)
        <input
          type="number"
          min={0}
          max={100}
          step={0.1}
          placeholder="0"
          value={discountPct === 0 ? '' : String(discountPct)}
          onChange={(e) => cartStore.setGlobalDiscount(parseFloat(e.target.value) || 0)}
        />
      </label>

      <div className="pos-totals-lines">
        <div className="ticket-row">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotalBeforeGlobal)}</span>
        </div>
        {globalDiscountAmount > 0 && (
          <div className="ticket-row pos-discount-line">
            <span>Descuento ({discountPct}%)</span>
            <span>-{formatCurrency(globalDiscountAmount)}</span>
          </div>
        )}
        {taxRate > 0 && (
          <div className="ticket-row">
            <span>Impuesto ({taxRate * 100}%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
        )}
        <div className="ticket-row ticket-total">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <button type="button" className="pos-checkout-btn" disabled={!canCheckout} onClick={onCheckout}>
        Procesar pago
      </button>
    </section>
  )
}
