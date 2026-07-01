import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useIsAuthenticated, setRememberMe } from '@/store/auth'
import { useLogin, NotAdminError } from '@/features/auth/useAuth'
import { apiErrorMessage } from '@/lib/api'

interface LocationState {
  from?: string
}

export function LoginPage() {
  const isAuthenticated = useIsAuthenticated()
  const navigate = useNavigate()
  const location = useLocation()
  const login = useLogin()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    // Decide where the token persists *before* the login writes it.
    setRememberMe(remember)
    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          const from = (location.state as LocationState | null)?.from ?? '/admin'
          navigate(from, { replace: true })
        },
      },
    )
  }

  const errorMessage = login.error
    ? login.error instanceof NotAdminError
      ? login.error.message
      : apiErrorMessage(login.error, 'Unable to sign in')
    : null

  const field =
    'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

  return (
    <div className="flex min-h-screen bg-slate-100 p-0 lg:items-center lg:justify-center lg:p-6">
      <div className="grid w-full overflow-hidden bg-white shadow-sm lg:max-w-5xl lg:grid-cols-2 lg:rounded-3xl lg:border lg:border-slate-200">
        {/* Left — form */}
        <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
          <div className="mx-auto w-full max-w-sm">
            <div className="flex items-center gap-2">
              <BrandMark className="size-7 text-brand-600" />
              <span className="text-lg font-bold text-ink">Chabhuoy</span>
            </div>

            <h1 className="mt-10 text-2xl font-bold text-ink">Log in to your account</h1>
            <p className="mt-1 text-sm text-muted">Please enter your details.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={field}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={field}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-100"
                  />
                  Keep me signed in
                </label>
                <Link to="/account" className="text-sm font-medium text-brand-700 hover:underline">
                  Forgot password?
                </Link>
              </div>

              {errorMessage ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={login.isPending}
                className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {login.isPending ? 'Signing in…' : 'Log in'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-slate-200" />
              OR
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <Link
              to="/"
              className="flex w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Continue to storefront
            </Link>

            <p className="mt-10 text-center text-xs text-muted">
              Admin access only. Customers can{' '}
              <Link to="/account" className="font-medium text-brand-700 hover:underline">
                sign in here
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Right — brand panel (hidden on small screens) */}
        <div className="relative hidden overflow-hidden bg-brand-600 lg:block">
          {/* Decorative concentric rings */}
          <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-12 top-12 size-96 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute right-24 top-48 size-96 rounded-full border border-white/10" />

          <div className="relative flex h-full flex-col justify-between p-12 text-white">
            <div className="flex items-center gap-2">
              <BrandMark className="size-6 text-white" />
              <span className="font-semibold">Chabhuoy Admin</span>
            </div>

            <div>
              <h2 className="max-w-xs text-3xl font-bold leading-tight">
                Run your marketplace from one place.
              </h2>
              <p className="mt-3 max-w-xs text-sm text-white/80">
                Orders, vendors, products, and revenue — every moving part of the store,
                in a single console.
              </p>

              <dl className="mt-10 grid grid-cols-2 gap-4">
                <Stat label="Vendors managed" value="Multi-vendor" />
                <Stat label="Order oversight" value="Real-time" />
              </dl>
            </div>

            <p className="text-xs text-white/60">© {new Date().getFullYear()} Chabhuoy Marketplace</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/5 p-4">
      <dd className="text-lg font-semibold">{value}</dd>
      <dt className="mt-0.5 text-xs text-white/70">{label}</dt>
    </div>
  )
}

function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 7l8-4 8 4-8 4-8-4z" fill="currentColor" opacity="0.9" />
      <path d="M4 12l8 4 8-4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4 17l8 4 8-4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}
