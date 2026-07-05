import { useCartStore } from '../../store/cartStore'
import { formatCurrency } from '../../lib/formatCurrency'

type Props = {
  onCheckout: () => void
}

export function CheckoutStrip({ onCheckout }: Props) {
  const items = useCartStore((s) => s.getState().items)
  const total = useCartStore((s) => s.getTotalWithTax())
  const canCheckout = items.length > 0 && total > 0

  return (
    <section className="pos-checkout-strip card">
      <div className="pos-checkout-main">
        <div className="ticket-row ticket-total">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <button
          type="button"
          className="pos-checkout-btn"
          disabled={!canCheckout}
          onClick={onCheckout}
        >
          Cobrar (F4)
        </button>
      </div>
    </section>
  )
}
