import type { ReactNode } from 'react'

export type NavIconName =
  | 'dashboard'
  | 'pos'
  | 'cash'
  | 'products'
  | 'categories'
  | 'customers'
  | 'purchases'
  | 'sales'
  | 'logout'
  | 'chevron-left'
  | 'chevron-right'
  | 'trash'

type Props = {
  name: NavIconName
}

function IconSvg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      {children}
    </svg>
  )
}

export function NavIcon({ name }: Props) {
  switch (name) {
    case 'dashboard':
      return (
        <IconSvg>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </IconSvg>
      )
    case 'pos':
      return (
        <IconSvg>
          <path d="M6 6h15l-1.5 9H7.5L6 6z" />
          <path d="M6 6 5 3H2" />
          <circle cx="9" cy="20" r="1.25" fill="currentColor" stroke="none" />
          <circle cx="18" cy="20" r="1.25" fill="currentColor" stroke="none" />
        </IconSvg>
      )
    case 'cash':
      return (
        <IconSvg>
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M6 10h.01M18 14h.01" />
        </IconSvg>
      )
    case 'products':
      return (
        <IconSvg>
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z" />
          <path d="M3.3 7.7 12 12.5l8.7-4.8M12 22V12.5" />
        </IconSvg>
      )
    case 'categories':
      return (
        <IconSvg>
          <path d="M4 6h16M4 12h10M4 18h14" />
          <circle cx="19" cy="12" r="1.25" fill="currentColor" stroke="none" />
          <circle cx="19" cy="18" r="1.25" fill="currentColor" stroke="none" />
        </IconSvg>
      )
    case 'customers':
      return (
        <IconSvg>
          <circle cx="9" cy="8" r="3.25" />
          <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
          <path d="M16 8.5a2.75 2.75 0 0 1 0 5.5M19.5 20a4.5 4.5 0 0 0-3.5-4.4" />
        </IconSvg>
      )
    case 'purchases':
      return (
        <IconSvg>
          <path d="M3 7h11v10H3z" />
          <path d="M14 10h4l3 3v4h-7V10z" />
          <circle cx="7.5" cy="19" r="1.25" fill="currentColor" stroke="none" />
          <circle cx="17.5" cy="19" r="1.25" fill="currentColor" stroke="none" />
        </IconSvg>
      )
    case 'sales':
      return (
        <IconSvg>
          <path d="M7 3h10l2 4H5l2-4z" />
          <path d="M5 7h14v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7z" />
          <path d="M9 11h6M9 15h4" />
        </IconSvg>
      )
    case 'logout':
      return (
        <IconSvg>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5M21 12H9" />
        </IconSvg>
      )
    case 'chevron-left':
      return (
        <IconSvg>
          <path d="M15 6l-6 6 6 6" />
        </IconSvg>
      )
    case 'chevron-right':
      return (
        <IconSvg>
          <path d="M9 6l6 6-6 6" />
        </IconSvg>
      )
    case 'trash':
      return (
        <IconSvg>
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <path d="M10 11v6M14 11v6" />
        </IconSvg>
      )
  }
}
