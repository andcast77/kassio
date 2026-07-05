import { useEffect, useState } from 'react'
import { fetchSalesToday, fetchSales, voidSale, type Sale, type TodaySummary } from '../api'
import { printTicket } from '../components/pos/TicketPrint'

export function SalesHistoryPage() {
  const [summary, setSummary] = useState<TodaySummary | null>(null)
  const [sales, setSales] = useState<Sale[]>([])
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const [sumRes, listRes] = await Promise.all([
      fetchSalesToday(),
      fetchSales({ startDate: today.toISOString(), limit: 50 }),
    ])
    if (sumRes.success) setSummary(sumRes.data.summary)
    if (listRes.success) setSales(listRes.data.sales)
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleVoid(id: string) {
    if (!confirm('¿Anular esta venta? Se restaurará el stock.')) return
    setError(null)
    const res = await voidSale(id)
    if (!res.success) {
      setError(res.message)
      return
    }
    await load()
  }

  return (
    <div className="stack-lg">
      <section className="card stats-row">
        <div>
          <p className="eyebrow">Hoy</p>
          <strong>{summary?.salesCount ?? 0} ventas</strong>
        </div>
        <div>
          <p className="eyebrow">Total del día</p>
          <strong>${summary?.totalAmount ?? '0'}</strong>
        </div>
      </section>

      {error && <p className="error">{error}</p>}

      <section className="card">
        <h2>Ventas de hoy</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Hora</th>
              <th>Cajero</th>
              <th>Total</th>
              <th>Pago</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td>
                  #{sale.ticketNumber}
                  {sale.voucherFormatted && (
                    <span className="muted"> · {sale.voucherFormatted}</span>
                  )}
                </td>
                <td>{new Date(sale.createdAt).toLocaleTimeString('es-AR')}</td>
                <td>{sale.user?.name ?? '—'}</td>
                <td>${sale.total}</td>
                <td>{sale.paymentMethod}</td>
                <td>{sale.status}</td>
                <td className="row-actions">
                  <button type="button" className="ghost" onClick={() => printTicket(sale)}>Ticket</button>
                  {sale.status === 'COMPLETED' && (
                    <button type="button" className="ghost" onClick={() => handleVoid(sale.id)}>Anular</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
