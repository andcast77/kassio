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
  const body = (await res.json()) as ApiEnvelope<T>
  return body
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
