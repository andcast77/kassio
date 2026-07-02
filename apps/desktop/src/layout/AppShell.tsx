import type { ReactNode } from 'react'
import type { AuthUser } from '../api'
import { Sidebar } from './Sidebar'
import { pageTitle, type AppPage } from './routes'

export type { AppPage } from './routes'

type Props = {
  user: AuthUser
  page: AppPage
  onNavigate: (page: AppPage) => void
  onLogout: () => void
  children: ReactNode
}

export function AppShell({ user, page, onNavigate, onLogout, children }: Props) {
  return (
    <div className="app-layout">
      <Sidebar page={page} user={user} onNavigate={onNavigate} onLogout={onLogout} />
      <div className="app-main">
        <header className="app-main-header">
          <h1>{pageTitle(page)}</h1>
        </header>
        <main className="app-main-content">{children}</main>
      </div>
    </div>
  )
}
