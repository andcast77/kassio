export type ApiSuccess<T> = {
  success: true
  data: T
  message: string
  code?: string
}

export type ApiError = {
  success: false
  data: null
  message: string
  code?: string
}

export function ok<T>(data: T, message = ''): ApiSuccess<T> {
  return { success: true, data, message }
}

export function fail(message: string, code?: string): ApiError {
  return { success: false, data: null, message, code }
}
