import { formatCurrency } from '../../lib/formatCurrency'
import { getStoredUser, type CashSession, type TodaySummary } from '../../api'

type Props = {
  session: CashSession
  today: TodaySummary | null
}

export function PosSessionBar({ session, today }: Props) {
  const user = getStoredUser()
  const openedAt = new Date(session.openedAt).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <header className="pos-session-bar card">
      <div className="pos-session-meta">
        <span className="pos-session-badge">Caja abierta</span>
        <span className="muted">desde {openedAt}</span>
        <span className="muted">· Cajero: {user?.name ?? session.user.name}</span>
      </div>
      {today && (
        <div className="pos-session-stats">
          <span>
            Hoy: <strong>{today.salesCount}</strong> ventas
          </span>
          <span>
            Total: <strong>{formatCurrency(Number(today.totalAmount))}</strong>
          </span>
        </div>
      )}
    </header>
  )
}
