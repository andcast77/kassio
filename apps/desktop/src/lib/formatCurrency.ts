export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(value)
}
