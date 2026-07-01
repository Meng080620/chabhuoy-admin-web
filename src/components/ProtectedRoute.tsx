import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useIsAuthenticated } from '@/store/auth'

/**
 * Gate for the admin area. No token → bounce to /login, preserving the
 * attempted path so we can return there after sign-in. Role is already
 * enforced at login (useLogin) and on every admin/* API call.
 */
export function ProtectedRoute() {
  const isAuthenticated = useIsAuthenticated()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
