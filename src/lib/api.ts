import axios, { AxiosError } from 'axios'
import { useAuthStore } from '@/store/auth'

/**
 * Single axios instance for the whole app. In dev, baseURL is `/api` and Vite
 * proxies to Laravel (no CORS). In prod, set VITE_API_URL to the API origin.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

// Attach the bearer token from the auth store on every request.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401 the token is dead (expired/revoked). Clear it so ProtectedRoute
// bounces the user to /login. Skip the login call itself — a bad-credentials
// 401 there is a form error, not a session expiry.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status
    const url = error.config?.url ?? ''
    if (status === 401 && !url.includes('/login')) {
      useAuthStore.getState().clearAuth()
    }
    return Promise.reject(error)
  },
)

/**
 * Normalize a Laravel validation/error payload into a single message.
 * Laravel returns `{ message, errors: { field: [msg] } }` on 422.
 */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined
    const firstFieldError = data?.errors
      ? Object.values(data.errors)[0]?.[0]
      : undefined
    return firstFieldError ?? data?.message ?? error.message ?? fallback
  }
  return fallback
}
