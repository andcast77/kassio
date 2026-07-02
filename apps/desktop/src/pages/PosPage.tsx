import { useEffect, useRef, useState } from 'react'
import { fetchBusiness, fetchCurrentCashSession, fetchSalesToday, type CashSession, type Sale, type TodaySummary } from '../api'
import { cartStore, useCartStore } from '../store/cartStore'
import { CustomerSelector } from '../components/pos/CustomerSelector'
import { PaymentModal } from '../components/pos/PaymentModal'
import { PosSessionBar } from '../components/pos/PosSessionBar'
import { ProductPanel } from '../components/pos/ProductPanel'
import { ReceiptModal } from '../components/pos/ReceiptModal'
import { ShoppingCart } from '../components/pos/ShoppingCart'
import { TotalsPanel } from '../components/pos/TotalsPanel'

type Toast = { type: 'ok' | 'error'; text: string }

export function PosPage() {
  const [loading, setLoading] = useState(true)
  const [taxRate, setTaxRate] = useState(0)
  const [today, setToday] = useState<TodaySummary | null>(null)
  const [session, setSession] = useState<CashSession | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  const [productRefreshKey, setProductRefreshKey] = useState(0)
  const [toast, setToast] = useState<Toast | null>(null)
  const [error, setError] = useState<string | null>(null)

  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const itemsCount = useCartStore((s) => s.getState().items.length)

  useEffect(() => {
    void loadInitial()
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'

      if (e.key === 'F2') {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
        return
      }

      if (e.key === 'F4' && !paymentOpen && !receiptOpen && itemsCount > 0) {
        e.preventDefault()
        setPaymentOpen(true)
        return
      }

      if (e.key === 'Escape') {
        if (paymentOpen) setPaymentOpen(false)
        else if (receiptOpen) handleReceiptClose()
        return
      }

      if (e.key === 'Enter' && paymentOpen && !typing) {
        const form = document.querySelector('.pos-payment-modal') as HTMLFormElement | null
        form?.requestSubmit()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [paymentOpen, receiptOpen, itemsCount])

  async function loadInitial() {
    setLoading(true)
    const [sessionRes, businessRes, todayRes] = await Promise.all([
      fetchCurrentCashSession(),
      fetchBusiness(),
      fetchSalesToday(),
    ])
    if (sessionRes.success) setSession(sessionRes.data.session)
    if (businessRes.success) setTaxRate(Number(businessRes.data.business.taxRate))
    if (todayRes.success) setToday(todayRes.data.summary)
    setLoading(false)
  }

  async function refreshToday() {
    const todayRes = await fetchSalesToday()
    if (todayRes.success) setToday(todayRes.data.summary)
  }

  function handleNotify(message: Toast) {
    setToast(message)
    window.setTimeout(() => setToast(null), 3500)
  }

  function handleCheckout() {
    setError(null)
    setPaymentOpen(true)
  }

  function handlePaymentSuccess(sale: Sale) {
    setPaymentOpen(false)
    setLastSale(sale)
    setReceiptOpen(true)
    setProductRefreshKey((k) => k + 1)
    void refreshToday()
  }

  function handleReceiptClose() {
    setReceiptOpen(false)
    setLastSale(null)
    window.setTimeout(() => {
      searchInputRef.current?.focus()
    }, 50)
  }

  function handlePrintAndContinue() {
    if (lastSale) {
      import('../components/pos/TicketPrint').then(({ printTicket }) => {
        printTicket(lastSale)
      })
    }
    handleReceiptClose()
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
      <PosSessionBar session={session} today={today} />

      {toast && (
        <div className={`pos-toast pos-toast-${toast.type}`} role="status">
          {toast.text}
        </div>
      )}

      <div className="pos-grid">
        <section className="pos-panel-left card">
          <ProductPanel
            refreshKey={productRefreshKey}
            onNotify={handleNotify}
            onSearchRef={(el) => {
              searchInputRef.current = el
            }}
          />
        </section>

        <div className="pos-panel-right">
          <CustomerSelector onNotify={handleNotify} />
          <ShoppingCart onNotify={handleNotify} />
          <TotalsPanel onCheckout={handleCheckout} taxRate={taxRate} />
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <PaymentModal
        open={paymentOpen}
        taxRate={taxRate}
        onClose={() => setPaymentOpen(false)}
        onSuccess={handlePaymentSuccess}
        onError={setError}
      />

      <ReceiptModal
        open={receiptOpen}
        sale={lastSale}
        onClose={handleReceiptClose}
        onPrintAndContinue={handlePrintAndContinue}
      />
    </div>
  )
}
