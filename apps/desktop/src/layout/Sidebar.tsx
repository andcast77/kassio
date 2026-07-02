import type { AppPage } from './routes'
import type { AuthUser } from '../api'
import { NAV_GROUPS } from './routes'

type Props = {
  page: AppPage
  user: AuthUser
  onNavigate: (page: AppPage) => void
  onLogout: () => void
}

export function Sidebar({ page, user, onNavigate, onLogout }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">K</span>
        <div>
          <strong>Kassio</strong>
          <p className="muted">Punto de venta</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="sidebar-group">
            <p className="sidebar-group-title">{group.title}</p>
            <ul>
              {group.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={page === item.id ? 'sidebar-link sidebar-link-active' : 'sidebar-link'}
                    onClick={() => onNavigate(item.id)}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <footer className="sidebar-footer">
        <div>
          <strong>{user.name}</strong>
          <p className="muted">{user.email}</p>
          <p className="muted">{user.role === 'ADMIN' ? 'Administrador' : 'Cajero'}</p>
        </div>
        <button type="button" className="ghost sidebar-logout" onClick={onLogout}>
          Salir
        </button>
      </footer>
    </aside>
  )
}
