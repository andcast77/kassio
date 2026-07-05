import { useEffect, useState, type ReactNode } from 'react'
import type { AuthUser } from '../api'
import { Sidebar } from './Sidebar'
import type { AppPage } from './routes'

export type { AppPage } from './routes'

const SIDEBAR_COLLAPSED_KEY = 'kassio_sidebar_collapsed'

type Props = {
  user: AuthUser
  page: AppPage
  onNavigate: (page: AppPage) => void
  onLogout: () => void
  children: ReactNode
}

export function AppShell({ user, page, onNavigate, onLogout, children }: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1',
  )

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? '1' : '0')
  }, [sidebarCollapsed])

  return (
    <div className={`app-layout${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <Sidebar
        page={page}
        user={user}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
      <div className="app-main">
        <main className="app-main-content">{children}</main>
      </div>
    </div>
  )
}
