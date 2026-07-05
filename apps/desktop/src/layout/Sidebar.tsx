import type { AppPage } from './routes'
import type { AuthUser } from '../api'
import { NAV_GROUPS } from './routes'
import { NavIcon } from './nav-icons'

type Props = {
  page: AppPage
  user: AuthUser
  collapsed: boolean
  onToggleCollapse: () => void
  onNavigate: (page: AppPage) => void
  onLogout: () => void
}

export function Sidebar({ page, user, collapsed, onToggleCollapse, onNavigate, onLogout }: Props) {
  const userInitial = user.name.trim().charAt(0).toUpperCase() || '?'

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div className="sidebar-brand">
          <span className="sidebar-logo">K</span>
          {!collapsed && (
            <div className="sidebar-brand-text">
              <strong>Kassio</strong>
              <p className="muted">Punto de venta</p>
            </div>
          )}
        </div>
        <button
          type="button"
          className="ghost sidebar-collapse-btn"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
          title={collapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          <NavIcon name={collapsed ? 'chevron-right' : 'chevron-left'} />
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Navegación principal">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="sidebar-group">
            {!collapsed && <p className="sidebar-group-title">{group.title}</p>}
            <ul>
              {group.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={page === item.id ? 'sidebar-link sidebar-link-active' : 'sidebar-link'}
                    onClick={() => onNavigate(item.id)}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="sidebar-link-icon">
                      <NavIcon name={item.icon} />
                    </span>
                    {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
                    {collapsed && <span className="sr-only">{item.label}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <footer className="sidebar-footer">
        {collapsed ? (
          <>
            <span className="sidebar-user-avatar" title={user.name} aria-hidden>
              {userInitial}
            </span>
            <button
              type="button"
              className="ghost sidebar-logout sidebar-logout-compact"
              onClick={onLogout}
              title="Salir"
              aria-label="Salir"
            >
              <span className="sidebar-link-icon">
                <NavIcon name="logout" />
              </span>
            </button>
          </>
        ) : (
          <>
            <div>
              <strong>{user.name}</strong>
              <p className="muted">{user.email}</p>
              <p className="muted">{user.role === 'ADMIN' ? 'Administrador' : 'Cajero'}</p>
            </div>
            <button type="button" className="ghost sidebar-logout" onClick={onLogout}>
              <span className="sidebar-link-icon">
                <NavIcon name="logout" />
              </span>
              <span>Salir</span>
            </button>
          </>
        )}
      </footer>
    </aside>
  )
}
