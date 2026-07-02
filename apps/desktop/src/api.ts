const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3000'

export type ApiEnvelope<T> = {
  success: boolean
  data: T
  message: string
  code?: string
}

export type AuthUser = {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'CASHIER'
}

export type CashSession = {
  id: string
  status: 'OPEN' | 'CLOSED'
  openingFloat: string
  expectedCash: string | null
  countedCash: string | null
  openedAt: string
  closedAt: string | null
  notes: string | null
  user: { id: string; name: string; email: string }
}

function getToken(): string | null {
  return localStorage.getItem('kassio_token')
}

export function clearSession() {
  localStorage.removeItem('kassio_token')
  localStorage.removeItem('kassio_user')
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem('kassio_user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

async function api<T>(path: string, init: RequestInit = {}): Promise<ApiEnvelope<T>> {
  const token = getToken()
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_URL}${path}`, { ...init, headers })
  if (res.status === 204) {
    return { success: true, data: null as T, message: '' }
  }
  return (await res.json()) as ApiEnvelope<T>
}

export type Product = {
  id: string
  name: string
  sku: string | null
  barcode: string | null
  price: string
  cost: string | null
  stockQuantity: number
  active: boolean
  categoryId: string | null
  category: { id: string; name: string } | null
}

export type Category = {
  id: string
  name: string
  active: boolean
  _count?: { products: number }
}

export type Supplier = { id: string; name: string; taxId: string | null; email: string | null; phone: string | null }

export type Customer = {
  id: string
  name: string
  email: string | null
  phone: string | null
  taxId: string | null
  address: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
  createdAt?: string
  updatedAt?: string
}

export type ProductPagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export async function fetchProducts(search = '') {
  const q = new URLSearchParams({ limit: '100' })
  if (search) q.set('search', search)
  return api<{ products: Product[]; pagination: ProductPagination }>(`/api/v1/products?${q}`)
}

export async function fetchProductsPage(params: {
  search?: string
  categoryId?: string
  page?: number
  limit?: number
  active?: boolean
}) {
  const q = new URLSearchParams({ limit: String(params.limit ?? 100) })
  if (params.page) q.set('page', String(params.page))
  if (params.search) q.set('search', params.search)
  if (params.categoryId) q.set('categoryId', params.categoryId)
  if (params.active !== undefined) q.set('active', String(params.active))
  return api<{ products: Product[]; pagination: ProductPagination }>(`/api/v1/products?${q}`)
}

export async function fetchCustomers(search = '') {
  const q = new URLSearchParams({ limit: '100' })
  if (search) q.set('search', search)
  return api<{ customers: Customer[]; pagination: ProductPagination }>(`/api/v1/customers?${q}`)
}

export async function fetchCustomersPage(params: { search?: string; page?: number; limit?: number }) {
  const q = new URLSearchParams({ limit: String(params.limit ?? 20) })
  if (params.page) q.set('page', String(params.page))
  if (params.search) q.set('search', params.search)
  return api<{ customers: Customer[]; pagination: ProductPagination }>(`/api/v1/customers?${q}`)
}

export async function createCustomer(body: {
  name: string
  email?: string | null
  phone?: string | null
  taxId?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  country?: string | null
}) {
  return api<{ customer: Customer }>('/api/v1/customers', { method: 'POST', body: JSON.stringify(body) })
}

export async function updateCustomer(
  id: string,
  body: Partial<{
    name: string
    email: string | null
    phone: string | null
    taxId: string | null
    address: string | null
    city: string | null
    state: string | null
    postalCode: string | null
    country: string | null
  }>,
) {
  return api<{ customer: Customer }>(`/api/v1/customers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function deleteCustomer(id: string) {
  return api<null>(`/api/v1/customers/${id}`, { method: 'DELETE' })
}

export async function createProduct(body: Record<string, unknown>) {
  return api<{ product: Product }>('/api/v1/products', { method: 'POST', body: JSON.stringify(body) })
}

export async function updateProduct(id: string, body: Record<string, unknown>) {
  return api<{ product: Product }>(`/api/v1/products/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
}

export async function fetchCategories() {
  return api<{ categories: Category[] }>('/api/v1/categories')
}

export async function createCategory(name: string) {
  return api<{ category: Category }>('/api/v1/categories', { method: 'POST', body: JSON.stringify({ name }) })
}

export async function fetchSuppliers() {
  return api<{ suppliers: Supplier[]; pagination: unknown }>('/api/v1/suppliers?limit=100')
}

export async function createSupplier(body: { name: string; taxId?: string }) {
  return api<{ supplier: Supplier }>('/api/v1/suppliers', { method: 'POST', body: JSON.stringify(body) })
}

export async function createPurchase(body: {
  supplierId: string
  notes?: string
  items: Array<{ productId: string; quantity: number; unitCost: number }>
}) {
  return api<{ purchase: unknown }>('/api/v1/purchases', { method: 'POST', body: JSON.stringify(body) })
}

export type Business = {
  id: string
  name: string
  taxId: string | null
  taxRate: string
  address: string | null
  phone: string | null
}

export async function fetchBusiness() {
  return api<{ business: Business }>('/api/v1/business')
}

export type SaleItem = {
  id: string
  productId: string
  quantity: number
  unitPrice: string
  lineTotal: string
  product?: { id: string; name: string; sku: string | null }
}

export type Sale = {
  id: string
  ticketNumber: number
  status: 'COMPLETED' | 'VOIDED' | 'REFUNDED'
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER'
  subtotal: string
  discount: string
  tax: string
  total: string
  paidAmount: string | null
  change: string | null
  notes: string | null
  createdAt: string
  user?: { id: string; name: string; email: string }
  customer?: { id: string; name: string; taxId?: string | null } | null
  items?: SaleItem[]
}

export type TodaySummary = {
  date: string
  salesCount: number
  totalAmount: string
}

export async function createSale(body: {
  items: Array<{ productId: string; quantity: number }>
  paymentMethod: Sale['paymentMethod']
  discount?: number
  paidAmount?: number
  customerId?: string | null
  notes?: string | null
}) {
  return api<{ sale: Sale }>('/api/v1/sales', { method: 'POST', body: JSON.stringify(body) })
}

export async function fetchSales(params?: { startDate?: string; endDate?: string; limit?: number }) {
  const q = new URLSearchParams()
  if (params?.startDate) q.set('startDate', params.startDate)
  if (params?.endDate) q.set('endDate', params.endDate)
  if (params?.limit) q.set('limit', String(params.limit))
  const query = q.toString()
  return api<{ sales: Sale[]; pagination: unknown }>(`/api/v1/sales${query ? `?${query}` : ''}`)
}

export async function fetchSalesToday() {
  return api<{ summary: TodaySummary }>('/api/v1/sales/today')
}

export async function voidSale(id: string) {
  return api<{ sale: Sale }>(`/api/v1/sales/${id}/void`, { method: 'POST' })
}

export type ReportPeriod = 'today' | 'week' | 'month'

export type SalesStats = {
  salesCount: number
  totalRevenue: string
  totalDiscount: string
  averageSale: string
  totalTax: string
}

export type TopProduct = {
  productId: string
  productName: string
  quantity: number
  revenue: string
  salesCount: number
}

export async function fetchReportStats(period: ReportPeriod = 'today') {
  return api<{ stats: SalesStats }>(`/api/v1/reports/stats?period=${period}`)
}

export async function fetchReportDaily(days = 7) {
  return api<{ daily: Array<{ date: string; sales: number; revenue: string }> }>(
    `/api/v1/reports/daily?days=${days}`,
  )
}

export async function fetchTopProducts(period: ReportPeriod = 'week', limit = 10) {
  return api<{ products: TopProduct[] }>(
    `/api/v1/reports/top-products?period=${period}&limit=${limit}`,
  )
}

export async function fetchReportInventory() {
  return api<{
    inventory: {
      totalProducts: number
      outOfStockProducts: number
      totalStockUnits: number
      inventoryCostValue: string
      inventoryRetailValue: string
    }
  }>('/api/v1/reports/inventory')
}

export async function login(email: string, password: string) {
  const res = await api<{ token: string; user: AuthUser }>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  if (res.success && res.data.token) {
    localStorage.setItem('kassio_token', res.data.token)
    localStorage.setItem('kassio_user', JSON.stringify(res.data.user))
  }

  return res
}

export async function fetchCurrentCashSession() {
  return api<{ session: CashSession | null }>('/api/v1/cash-sessions/current')
}

export async function openCashSession(openingFloat: number) {
  return api<{ session: CashSession }>('/api/v1/cash-sessions/open', {
    method: 'POST',
    body: JSON.stringify({ openingFloat }),
  })
}

export async function closeCashSession(id: string, countedCash: number, notes?: string) {
  return api<{ session: CashSession }>(`/api/v1/cash-sessions/${id}/close`, {
    method: 'POST',
    body: JSON.stringify({ countedCash, notes }),
  })
}

export async function logout() {
  await api<null>('/api/v1/auth/logout', { method: 'POST' })
  clearSession()
}
