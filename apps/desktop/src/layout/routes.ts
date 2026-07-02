export type AppPage =
  | 'dashboard'
  | 'caja'
  | 'vender'
  | 'ventas'
  | 'productos'
  | 'categorias'
  | 'compras'
  | 'clientes'

export type NavItem = { id: AppPage; label: string }
export type NavGroup = { title: string; items: NavItem[] }

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Principal',
    items: [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'vender', label: 'Punto de Venta' },
      { id: 'caja', label: 'Caja' },
    ],
  },
  {
    title: 'Gestión',
    items: [
      { id: 'productos', label: 'Productos' },
      { id: 'categorias', label: 'Categorías' },
      { id: 'clientes', label: 'Clientes' },
      { id: 'compras', label: 'Compras' },
      { id: 'ventas', label: 'Ventas' },
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
