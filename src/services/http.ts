import axios from 'axios'
import type { AxiosError } from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.QCLI_API_URL || 'http://127.0.0.1:8000',
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
  timeout: 20000
})

let csrfRequest: Promise<void> | undefined
export function initCsrf(): Promise<void> {
  csrfRequest ??= http.get(`${import.meta.env.QCLI_AUTH_PREFIX || '/api/v1/auth'}/csrf`)
    .then(() => undefined)
    .finally(() => { csrfRequest = undefined })
  return csrfRequest
}

export async function csrfPost<T>(url: string, payload?: unknown): Promise<T> {
  await initCsrf()
  const { data } = await http.post<T>(url, payload ?? {})
  return data
}

export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const error = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>
    const fields = error.response?.data?.errors
    const first = fields && Object.values(fields).flat()[0]
    if (first) return first
    if (error.response?.status === 419) return 'Session expired. Please refresh and try again.'
    if (error.response?.status === 429) return 'Too many requests. Please wait and retry.'
    return error.response?.data?.message || error.message || 'Request failed.'
  }
  return err instanceof Error ? err.message : 'An unexpected error occurred.'
}
