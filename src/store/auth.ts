import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { User } from '@/types/api'

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
}

/**
 * "Keep me signed in" toggle. When off, the session lives in sessionStorage and
 * dies with the tab; when on (default), it persists in localStorage. Set this
 * from the login form *before* `setAuth` so the first write lands in the right
 * place. Module-level (not store state) because the persist storage adapter is
 * created once and needs a stable place to read the current choice.
 */
let rememberSession = true
export function setRememberMe(remember: boolean): void {
  rememberSession = remember
}

const hasSession = () => typeof sessionStorage !== 'undefined'

/**
 * Persistence that honours the remember toggle: reads from whichever storage
 * holds the session (session first, then local), and writes to the chosen one
 * while clearing the other so a stale token can't linger in both.
 */
const authStorage = createJSONStorage<unknown>(() => ({
  getItem: (name) => (hasSession() ? sessionStorage.getItem(name) : null) ?? localStorage.getItem(name),
  setItem: (name, value) => {
    const useSession = rememberSession === false && hasSession()
    const target = useSession ? sessionStorage : localStorage
    const other = useSession ? localStorage : (hasSession() ? sessionStorage : null)
    other?.removeItem(name)
    target.setItem(name, value)
  },
  removeItem: (name) => {
    if (hasSession()) sessionStorage.removeItem(name)
    localStorage.removeItem(name)
  },
}))

/**
 * Persisted auth slice. The token lives here (not a bare localStorage key) so
 * the axios interceptor (`getState().token`) and the React tree observe the
 * exact same value — no drift between "what we send" and "what we render".
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
    }),
    { name: 'chabhuoy-admin-auth', storage: authStorage },
  ),
)

// Selector hooks — subscribe to a slice, never the whole store.
export const useUser = () => useAuthStore((s) => s.user)
export const useIsAuthenticated = () => useAuthStore((s) => !!s.token)
export const useIsAdmin = () => useAuthStore((s) => s.user?.role === 'admin')
