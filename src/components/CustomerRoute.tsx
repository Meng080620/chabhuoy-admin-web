import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useIsAuthenticated } from '@/store/auth'

/**
 * Gate for the storefront's buy area (cart, checkout, orders). Any authenticated
 * role may pass — shopping isn't admin-only. Signed-out users are sent to the
 * customer sign-in, preserving where they were headed so checkout resumes there.
 */
export function CustomerRoute() {
  const isAuthenticated = useIsAuthenticated()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/account" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
