import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { User } from '@/types/api'
import { useAuthStore } from '@/store/auth'
import * as authService from './authService'
import { NotAdminError, useLogin } from './useAuth'

vi.mock('./authService')

const ADMIN: User = {
  id: 1,
  name: 'Admin',
  email: 'admin@chabhuoy.test',
  role: 'admin',
  created_at: '2026-01-01T00:00:00Z',
}
const CUSTOMER: User = { ...ADMIN, id: 2, name: 'Cust', email: 'cust@x.test', role: 'customer' }

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useLogin — admin gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: null, token: null })
  })

  it('blocks a non-admin with valid credentials and leaves the store empty', async () => {
    vi.mocked(authService.login).mockResolvedValue({ user: CUSTOMER, token: 'tok' })

    const { result } = renderHook(() => useLogin(), { wrapper })

    await expect(
      result.current.mutateAsync({ email: CUSTOMER.email, password: 'pw' }),
    ).rejects.toBeInstanceOf(NotAdminError)

    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
  })

  it('stores the user and token for a valid admin login', async () => {
    vi.mocked(authService.login).mockResolvedValue({ user: ADMIN, token: 'tok-123' })

    const { result } = renderHook(() => useLogin(), { wrapper })

    await result.current.mutateAsync({ email: ADMIN.email, password: 'pw' })

    await waitFor(() => {
      const state = useAuthStore.getState()
      expect(state.token).toBe('tok-123')
      expect(state.user?.role).toBe('admin')
    })
  })
})
