import { useEffect, useState } from 'react'
import { createSale, type Sale } from '../../api'
import { cartStore, useCartStore } from '../../store/cartStore'
import { formatCurrency } from '../../lib/formatCurrency'

type PaymentMethod = Sale['paymentMethod']

type Props = {
  open: boolean
  onClose: () => void
  onSuccess: (sale: Sale, paidAmount?: number) => void
  onError: (message: string) => void
}

export function PaymentModal({ open, onClose, onSuccess, onError }: Props) {
  const items = useCartStore((s) => s.getState().items)
  const customerId = useCartStore((s) => s.getState().customerId)
  const total = useCartStore((s) => s.getSubtotal())
  const discountAmount = useCartStore((s) => s.getTotalDiscountAmount())

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [paidAmount, setPaidAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (open) setPaidAmount(total.toFixed(2))
  }, [open, total])

  if (!open) return null

  const change =
    paymentMethod === 'CASH' && paidAmount ? Math.max(0, parseFloat(paidAmount) - total) : 0

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
    })

    setProcessing(false)
    if (!res.success) {
      onError(res.message || 'Error al crear la venta')
      return
    }

    cartStore.clearCart()
    onSuccess(res.data.sale, paymentMethod === 'CASH' ? paid : undefined)
    setPaidAmount('')
    setNotes('')
    setPaymentMethod('CASH')
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <form className="modal card pos-payment-modal" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <h2>Cobrar {formatCurrency(total)}</h2>

        <label>
          Medio de pago
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          >
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
              min={total}
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              required
            />
          </label>
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
            Cancelar
          </button>
          <button type="submit" disabled={processing}>
            {processing ? 'Procesando…' : 'Confirmar venta'}
          </button>
        </div>
      </form>
    </div>
  )
}
