import { useEffect, useState } from 'react'
import {
  clearSession,
  closeCashSession,
  fetchCurrentCashSession,
  getStoredUser,
  login,
  logout,
  openCashSession,
  type AuthUser,
  type CashSession,
} from './api'

export function App() {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())
  const [session, setSession] = useState<CashSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState('cajero@kassio.local')
  const [password, setPassword] = useState('Cajero123!')
  const [openingFloat, setOpeningFloat] = useState('0')
  const [countedCash, setCountedCash] = useState('0')
  const [closeNotes, setCloseNotes] = useState('')

  useEffect(() => {
    if (!user) return
    void refreshSession()
  }, [user])

  async function refreshSession() {
    setError(null)
    const res = await fetchCurrentCashSession()
    if (!res.success) {
      setError(res.message || 'No se pudo cargar la caja')
      return
    }
    setSession(res.data.session)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await login(email, password)
    setLoading(false)
    if (!res.success) {
      setError(res.message || 'Credenciales inválidas')
      return
    }
    setUser(res.data.user)
  }

  async function handleLogout() {
    await logout()
    setUser(null)
    setSession(null)
    clearSession()
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

  if (!user) {
    return (
      <div className="page">
        <div className="card login-card">
          <p className="eyebrow">Kassio</p>
          <h1>Iniciar sesión</h1>
          <form onSubmit={handleLogin} className="stack">
            <label>
              Correo
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <p className="eyebrow">Kassio</p>
          <h1>Caja</h1>
        </div>
        <div className="user-box">
          <span>{user.name}</span>
          <span className="muted">{user.email}</span>
          <button type="button" className="ghost" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </header>

      <main className="grid">
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
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(e.target.value)}
                  required
                />
              </label>
              <button type="submit" disabled={loading}>
                {loading ? 'Abriendo…' : 'Abrir caja'}
              </button>
            </form>
          </section>
        ) : (
          <section className="card">
            <h2>Cerrar caja</h2>
            <form onSubmit={handleCloseCash} className="stack">
              <label>
                Efectivo contado
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  required
                />
              </label>
              <label>
                Notas
                <textarea value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} rows={3} />
              </label>
              <button type="submit" disabled={loading}>
                {loading ? 'Cerrando…' : 'Cerrar caja'}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  )
}
