import { useEffect, useState } from 'react'
import { fetchCurrentCashSession, type CashSession, type Sale } from '../api'
import { CustomerSelector } from '../components/pos/CustomerSelector'
import { PaymentModal } from '../components/pos/PaymentModal'
import { ProductPanel } from '../components/pos/ProductPanel'
import { ReceiptModal } from '../components/pos/ReceiptModal'
import { ShoppingCart } from '../components/pos/ShoppingCart'
import { TotalsPanel } from '../components/pos/TotalsPanel'

type Toast = { type: 'ok' | 'error'; text: string }

export function PosPage() {
  const [session, setSession] = useState<CashSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  const [lastPaid, setLastPaid] = useState<number | undefined>()
  const [toast, setToast] = useState<Toast | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void loadSession()
  }, [])

  async function loadSession() {
    setLoading(true)
    const res = await fetchCurrentCashSession()
    if (res.success) setSession(res.data.session)
    setLoading(false)
  }

  function handleNotify(message: Toast) {
    setToast(message)
    window.setTimeout(() => setToast(null), 3500)
  }

  function handleCheckout() {
    setError(null)
    setPaymentOpen(true)
  }

  function handlePaymentSuccess(sale: Sale, paidAmount?: number) {
    setPaymentOpen(false)
    setLastSale(sale)
    setLastPaid(paidAmount)
    setReceiptOpen(true)
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
    <div className="pos-page">
      {toast && (
        <div className={`pos-toast pos-toast-${toast.type}`} role="status">
          {toast.text}
        </div>
      )}

      <div className="pos-grid">
        <section className="pos-panel-left card">
          <ProductPanel onNotify={handleNotify} />
        </section>

        <div className="pos-panel-right">
          <CustomerSelector onNotify={handleNotify} />
          <ShoppingCart />
          <TotalsPanel onCheckout={handleCheckout} taxRate={0} />
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSuccess={handlePaymentSuccess}
        onError={setError}
      />

      <ReceiptModal
        open={receiptOpen}
        sale={lastSale}
        paidAmount={lastPaid}
        onClose={() => {
          setReceiptOpen(false)
          setLastSale(null)
          setLastPaid(undefined)
        }}
      />
    </div>
  )
}
