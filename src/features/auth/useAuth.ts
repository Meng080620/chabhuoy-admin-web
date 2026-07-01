import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { queryClient } from '@/query/queryClient'
import { login, logout, register, type LoginCredentials } from './authService'

/** Raised when a non-admin authenticates against the admin panel. */
export class NotAdminError extends Error {
  constructor() {
    super('This account does not have admin access.')
    this.name = 'NotAdminError'
  }
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const result = await login(credentials)
      // Gate the admin panel client-side. The API also enforces this on every
      // admin/* route, so this is UX, not the security boundary.
      if (result.user.role !== 'admin') {
        throw new NotAdminError()
      }
      return result
    },
    onSuccess: ({ user, token }) => {
      setAuth(user, token)
    },
  })
}

/**
 * Storefront sign-in — unlike `useLogin`, no role gate: customers, vendors, and
 * admins may all authenticate to shop. Role-specific areas guard themselves.
 */
export function useStorefrontLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: ({ user, token }) => {
      setAuth(user, token)
    },
  })
}

/** Storefront registration — creates a customer and signs them straight in. */
export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth)

  return useMutation({
    mutationFn: register,
    onSuccess: ({ user, token }) => {
      setAuth(user, token)
    },
  })
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth)

  return useMutation({
    mutationFn: logout,
    // Clear locally regardless of the network result — a failed logout call
    // must never strand the user in an authenticated-looking UI.
    onSettled: () => {
      clearAuth()
      queryClient.clear()
    },
  })
}
