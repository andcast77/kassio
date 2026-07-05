import { useEffect, useState } from 'react'
import {
  fetchReportDaily,
  fetchReportInventory,
  fetchReportStats,
  fetchTopProducts,
  type ReportPeriod,
  type SalesStats,
  type TopProduct,
} from '../api'

type DailyPoint = { date: string; sales: number; revenue: string }

export function DashboardPage() {
  const [period, setPeriod] = useState<ReportPeriod>('today')
  const [stats, setStats] = useState<SalesStats | null>(null)
  const [daily, setDaily] = useState<DailyPoint[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [inventory, setInventory] = useState<{ totalProducts: number; inventoryRetailValue: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const chartDays = period === 'today' ? 7 : period === 'week' ? 30 : 90

  useEffect(() => {
    void load()
  }, [period])

  async function load() {
    setLoading(true)
    const [s, d, t, i] = await Promise.all([
      fetchReportStats(period),
      fetchReportDaily(chartDays),
      fetchTopProducts(period, 10),
      fetchReportInventory(),
    ])
    if (s.success) setStats(s.data.stats)
    if (d.success) setDaily(d.data.daily)
    if (t.success) setTopProducts(t.data.products)
    if (i.success) setInventory(i.data.inventory)
    setLoading(false)
  }

  const maxRevenue = Math.max(...daily.map((d) => Number(d.revenue)), 1)

  return (
    <div className="dashboard">
      <div className="dashboard-toolbar">
        <h2>Dashboard</h2>
        <div className="period-tabs">
            {(['today', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                type="button"
                className={period === p ? 'period-active' : 'ghost'}
                onClick={() => setPeriod(p)}
              >
                {p === 'today' ? 'Hoy' : p === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
        </div>
      </div>

      {loading ? (
        <p className="muted">Cargando métricas…</p>
      ) : (
        <>
          <div className="stats-grid">
            <article className="stat-card">
              <p className="stat-label">Ventas totales</p>
              <p className="stat-value">{stats?.salesCount ?? 0}</p>
              <p className="stat-sub">${stats?.totalRevenue ?? '0'}</p>
            </article>
            <article className="stat-card">
              <p className="stat-label">Ingresos</p>
              <p className="stat-value">${stats?.totalRevenue ?? '0'}</p>
              <p className="stat-sub">Prom: ${stats?.averageSale ?? '0'}</p>
            </article>
            <article className="stat-card">
              <p className="stat-label">Descuentos</p>
              <p className="stat-value stat-negative">-${stats?.totalDiscount ?? '0'}</p>
              <p className="stat-sub">Total aplicado</p>
            </article>
            <article className="stat-card">
              <p className="stat-label">Inventario</p>
              <p className="stat-value">${inventory?.inventoryRetailValue ?? '0'}</p>
              <p className="stat-sub">{inventory?.totalProducts ?? 0} productos activos</p>
            </article>
          </div>

          <section className="card">
            <h3>Ventas diarias ({chartDays} días)</h3>
            <div className="bar-chart">
              {daily.map((point) => (
                <div key={point.date} className="bar-col" title={`${point.date}: $${point.revenue}`}>
                  <div
                    className="bar-fill"
                    style={{ height: `${Math.max(4, (Number(point.revenue) / maxRevenue) * 100)}%` }}
                  />
                  <span className="bar-label">{point.date.slice(5)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h3>Productos más vendidos</h3>
            {topProducts.length === 0 ? (
              <p className="muted">Sin ventas en el período.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Ventas</th>
                    <th>Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p) => (
                    <tr key={p.productId}>
                      <td>{p.productName}</td>
                      <td>{p.quantity}</td>
                      <td>{p.salesCount}</td>
                      <td>${p.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  )
}
