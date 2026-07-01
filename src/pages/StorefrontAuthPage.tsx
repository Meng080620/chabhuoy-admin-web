import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useIsAuthenticated } from '@/store/auth'
import { useStorefrontLogin, useRegister } from '@/features/auth/useAuth'
import { apiErrorMessage } from '@/lib/api'

interface LocationState {
  from?: string
}

type Mode = 'login' | 'register'

/**
 * Storefront sign-in / registration. Distinct from the admin `/login` (which
 * rejects non-admins) — any role may shop. On success returns to wherever the
 * shopper was headed (e.g. /checkout), defaulting to the catalogue.
 */
export function StorefrontAuthPage() {
  const isAuthenticated = useIsAuthenticated()
  const navigate = useNavigate()
  const location = useLocation()
  const login = useStorefrontLogin()
  const register = useRegister()

  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')

  const from = (location.state as LocationState | null)?.from ?? '/'

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const active = mode === 'login' ? login : register
  const errorMessage = active.error
    ? apiErrorMessage(active.error, 'Unable to continue')
    : null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const onSuccess = () => navigate(from, { replace: true })
    if (mode === 'login') {
      login.mutate({ email, password }, { onSuccess })
    } else {
      register.mutate(
        { name, email, password, password_confirmation: passwordConfirmation },
        { onSuccess },
      )
    }
  }

  const field =
    'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

  return (
    <div className="mx-auto max-w-sm py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-ink">
          {mode === 'login' ? 'Sign in' : 'Create your account'}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {mode === 'login' ? 'Welcome back to Chabhuoy.' : 'Join Chabhuoy to start shopping.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'register' ? (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Name
              </label>
              <input id="name" type="text" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} className={field} />
            </div>
          ) : null}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={mode === 'register' ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={field}
            />
          </div>

          {mode === 'register' ? (
            <div>
              <label htmlFor="password_confirmation" className="block text-sm font-medium text-slate-700">
                Confirm password
              </label>
              <input id="password_confirmation" type="password" autoComplete="new-password" required value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} className={field} />
            </div>
          ) : null}

          {errorMessage ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={active.isPending}
            className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {active.isPending
              ? mode === 'login'
                ? 'Signing in…'
                : 'Creating account…'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          {mode === 'login' ? (
            <>
              New to Chabhuoy?{' '}
              <button type="button" onClick={() => setMode('register')} className="font-medium text-brand-700 hover:underline">
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => setMode('login')} className="font-medium text-brand-700 hover:underline">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>

      <p className="mt-4 text-center text-xs text-muted">
        <Link to="/" className="hover:underline">
          ← Back to shop
        </Link>
      </p>
    </div>
  )
}
