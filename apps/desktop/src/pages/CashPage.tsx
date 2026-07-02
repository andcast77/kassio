import { useEffect, useState } from 'react'
import {
  closeCashSession,
  fetchCurrentCashSession,
  openCashSession,
  type CashSession,
} from '../api'

export function CashPage() {
  const [session, setSession] = useState<CashSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openingFloat, setOpeningFloat] = useState('0')
  const [countedCash, setCountedCash] = useState('0')
  const [closeNotes, setCloseNotes] = useState('')

  useEffect(() => {
    void refreshSession()
  }, [])

  async function refreshSession() {
    setError(null)
    const res = await fetchCurrentCashSession()
    if (!res.success) {
      setError(res.message || 'No se pudo cargar la caja')
      return
    }
    setSession(res.data.session)
  }

  async function handleOpenCash(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await openCashSession(Number(openingFloat))
    setLoading(false)
    if (!res.success) {
      setError(res.message)
      return
    }
    setSession(res.data.session)
  }

  async function handleCloseCash(e: React.FormEvent) {
    e.preventDefault()
    if (!session) return
    setLoading(true)
    setError(null)
    const res = await closeCashSession(session.id, Number(countedCash), closeNotes || undefined)
    setLoading(false)
    if (!res.success) {
      setError(res.message)
      return
    }
    setSession(null)
    setCloseNotes('')
  }

  return (
    <div className="grid">
      <section className="card">
        <h2>Estado</h2>
        {session ? (
          <div className="stack">
            <p>
              <strong>Abierta</strong> desde {new Date(session.openedAt).toLocaleString('es-AR')}
            </p>
            <p>Fondo inicial: ${session.openingFloat}</p>
            <p>Cajero: {session.user.name}</p>
          </div>
        ) : (
          <p className="muted">No hay caja abierta.</p>
        )}
        {error && <p className="error">{error}</p>}
      </section>

      {!session ? (
        <section className="card">
          <h2>Abrir caja</h2>
          <form onSubmit={handleOpenCash} className="stack">
            <label>
              Fondo inicial
              <input type="number" min="0" step="0.01" value={openingFloat} onChange={(e) => setOpeningFloat(e.target.value)} required />
            </label>
            <button type="submit" disabled={loading}>{loading ? 'Abriendo…' : 'Abrir caja'}</button>
          </form>
        </section>
      ) : (
        <section className="card">
          <h2>Cerrar caja</h2>
          <form onSubmit={handleCloseCash} className="stack">
            <label>
              Efectivo contado
              <input type="number" min="0" step="0.01" value={countedCash} onChange={(e) => setCountedCash(e.target.value)} required />
            </label>
            <label>
              Notas
              <textarea value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} rows={3} />
            </label>
            <button type="submit" disabled={loading}>{loading ? 'Cerrando…' : 'Cerrar caja'}</button>
          </form>
        </section>
      )}
    </div>
  )
}
