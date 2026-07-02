import { useState } from 'react'
import {
  clearSession,
  getStoredUser,
  login,
  logout,
  type AuthUser,
} from './api'
import { AppShell, type AppPage } from './layout/AppShell'
import { CashPage } from './pages/CashPage'
import { ProductsPage } from './pages/ProductsPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { PurchasesPage } from './pages/PurchasesPage'
import { PosPage } from './pages/PosPage'
import { SalesHistoryPage } from './pages/SalesHistoryPage'
import { DashboardPage } from './pages/DashboardPage'

export function App() {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())
  const [page, setPage] = useState<AppPage>('dashboard')
  const [email, setEmail] = useState('cajero@kassio.local')
  const [password, setPassword] = useState('Cajero123!')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    clearSession()
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
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <AppShell user={user} page={page} onNavigate={setPage} onLogout={handleLogout}>
      {page === 'dashboard' && <DashboardPage />}
      {page === 'caja' && <CashPage />}
      {page === 'vender' && <PosPage />}
      {page === 'ventas' && <SalesHistoryPage />}
      {page === 'productos' && <ProductsPage />}
      {page === 'categorias' && <CategoriesPage />}
      {page === 'compras' && <PurchasesPage />}
    </AppShell>
  )
}
