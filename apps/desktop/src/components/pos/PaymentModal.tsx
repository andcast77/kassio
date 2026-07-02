import { useEffect, useState } from 'react'
import { createSale, type Sale } from '../../api'
import { paymentMethodLabel } from '../../lib/paymentLabels'
import { cartStore, useCartStore } from '../../store/cartStore'
import { formatCurrency } from '../../lib/formatCurrency'

type PaymentMethod = Sale['paymentMethod']

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'CARD', 'TRANSFER', 'OTHER']

type Props = {
  open: boolean
  taxRate: number
  onClose: () => void
  onSuccess: (sale: Sale) => void
  onError: (message: string) => void
}

export function PaymentModal({ open, taxRate, onClose, onSuccess, onError }: Props) {
  const items = useCartStore((s) => s.getState().items)
  const customerId = useCartStore((s) => s.getState().customerId)
  const subtotalBeforeGlobal = useCartStore((s) => s.getSubtotalBeforeGlobal())
  const discountAmount = useCartStore((s) => s.getTotalDiscountAmount())
  const tax = useCartStore((s) => s.getTax(taxRate))
  const total = useCartStore((s) => s.getTotalWithTax(taxRate))

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [paidAmount, setPaidAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (open) setPaidAmount(total.toFixed(2))
  }, [open, total])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const change =
    paymentMethod === 'CASH' && paidAmount ? Math.max(0, parseFloat(paidAmount) - total) : 0

  function setQuickCash(amount: number) {
    setPaidAmount(amount.toFixed(2))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) return

    setProcessing(true)
    const paid = paymentMethod === 'CASH' ? parseFloat(paidAmount) : total

    const res = await createSale({
      items: items.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
      paymentMethod,
      discount: discountAmount > 0 ? discountAmount : undefined,
      paidAmount: paymentMethod === 'CASH' ? paid : undefined,
      customerId,
      notes: notes.trim() || undefined,
    })

    setProcessing(false)
    if (!res.success) {
      onError(res.message || 'Error al crear la venta')
      return
    }

    cartStore.clearCart({ keepCustomer: true })
    onSuccess(res.data.sale)
    setPaidAmount('')
    setNotes('')
    setPaymentMethod('CASH')
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <form className="modal card pos-payment-modal" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <h2>Cobrar {formatCurrency(total)}</h2>

        <div className="pos-payment-breakdown">
          <div className="ticket-row">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotalBeforeGlobal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="ticket-row pos-discount-line">
              <span>Descuentos</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          {taxRate > 0 && (
            <div className="ticket-row">
              <span>IVA ({taxRate * 100}%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
          )}
          <div className="ticket-row ticket-total">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <fieldset className="pos-payment-methods">
          <legend>Medio de pago</legend>
          <div className="pos-payment-method-btns">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method}
                type="button"
                className={`pos-payment-method-btn${paymentMethod === method ? ' active' : ''}`}
                onClick={() => setPaymentMethod(method)}
              >
                {paymentMethodLabel(method)}
              </button>
            ))}
          </div>
        </fieldset>

        {paymentMethod === 'CASH' && (
          <>
            <label>
              Monto recibido
              <input
                type="number"
                min={total}
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                required
              />
            </label>
            <div className="pos-quick-cash">
              <button type="button" className="ghost" onClick={() => setQuickCash(total)}>
                Exacto
              </button>
              <button type="button" className="ghost" onClick={() => setQuickCash(total + 1000)}>
                +$1.000
              </button>
              <button type="button" className="ghost" onClick={() => setQuickCash(total + 2000)}>
                +$2.000
              </button>
              <button type="button" className="ghost" onClick={() => setQuickCash(total + 5000)}>
                +$5.000
              </button>
            </div>
          </>
        )}

        {paymentMethod === 'CASH' && paidAmount && (
          <p className="ok">Vuelto: {formatCurrency(change)}</p>
        )}

        <label>
          Notas (opcional)
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>

        <div className="row">
          <button type="button" className="ghost" onClick={onClose}>
            Cancelar (Esc)
          </button>
          <button type="submit" disabled={processing}>
            {processing ? 'Procesando…' : 'Confirmar venta (Enter)'}
          </button>
        </div>
      </form>
    </div>
  )
}
