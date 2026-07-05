import type { NavIconName } from './nav-icons'

export type AppPage =
  | 'dashboard'
  | 'caja'
  | 'vender'
  | 'ventas'
  | 'productos'
  | 'categorias'
  | 'compras'
  | 'clientes'

export type NavItem = { id: AppPage; label: string; icon: NavIconName }
export type NavGroup = { title: string; items: NavItem[] }

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Principal',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
      { id: 'vender', label: 'Punto de Venta', icon: 'pos' },
      { id: 'caja', label: 'Caja', icon: 'cash' },
    ],
  },
  {
    title: 'Gestión',
    items: [
      { id: 'productos', label: 'Productos', icon: 'products' },
      { id: 'categorias', label: 'Categorías', icon: 'categories' },
      { id: 'clientes', label: 'Clientes', icon: 'customers' },
      { id: 'compras', label: 'Compras', icon: 'purchases' },
      { id: 'ventas', label: 'Ventas', icon: 'sales' },
    ],
  },
]

export function pageTitle(page: AppPage): string {
  for (const group of NAV_GROUPS) {
    const item = group.items.find((i) => i.id === page)
    if (item) return item.label
  }
  return 'Kassio'
}
