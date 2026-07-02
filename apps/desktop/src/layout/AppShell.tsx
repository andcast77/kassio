import type { ReactNode } from 'react'
import type { AuthUser } from '../api'

export type AppPage = 'caja' | 'vender' | 'ventas' | 'productos' | 'categorias' | 'compras'

type Props = {
  user: AuthUser
  page: AppPage
  onNavigate: (page: AppPage) => void
  onLogout: () => void
  children: ReactNode
}

const NAV: { id: AppPage; label: string }[] = [
  { id: 'caja', label: 'Caja' },
  { id: 'vender', label: 'Vender' },
  { id: 'ventas', label: 'Ventas' },
  { id: 'productos', label: 'Productos' },
  { id: 'categorias', label: 'Categorías' },
  { id: 'compras', label: 'Compras' },
]

export function AppShell({ user, page, onNavigate, onLogout, children }: Props) {
  return (
    <div className="shell">
      <header className="shell-header">
        <div>
          <p className="eyebrow">Kassio</p>
          <h1>{NAV.find((n) => n.id === page)?.label ?? 'Kassio'}</h1>
        </div>
        <div className="user-box">
          <span>{user.name}</span>
          <span className="muted">{user.email}</span>
          <button type="button" className="ghost" onClick={onLogout}>
            Salir
          </button>
        </div>
      </header>

      <nav className="shell-nav">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === page ? 'nav-active' : 'ghost'}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="shell-main">{children}</main>
    </div>
  )
}
