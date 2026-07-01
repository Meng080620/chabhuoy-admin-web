import { useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useNavigate, useSearchParams } from 'react-router-dom'
import { useIsAuthenticated, useUser } from '@/store/auth'
import { useLogout } from '@/features/auth/useAuth'
import { useCartCount } from '@/features/cart/useCart'
import { FOOTER_COLUMNS, NAV_LINKS } from '@/features/catalog/demo'

/**
 * Public shell for the storefront. Unlike AdminLayout this is ungated — anyone
 * can browse. Auth only matters for the buy actions (cart, checkout, orders).
 * The header carries the global product search, which drives `/?q=` on the
 * homepage; the footer is the rich marketplace footer (link columns, app, pay).
 */
export function StorefrontLayout() {
  const isAuthenticated = useIsAuthenticated()
  const user = useUser()
  const logout = useLogout()
  const cartCount = useCartCount()

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">
          <Link to="/" className="leading-tight">
            <span className="block text-lg font-bold text-ink">Chabhuoy</span>
            <span className="block text-xs text-muted">Marketplace</span>
          </Link>

          <SearchBox />

          <div className="ml-auto hidden items-center gap-2 text-xs leading-tight text-slate-600 lg:flex">
            <PinIcon className="size-4 text-slate-400" />
            <span>
              <span className="block text-[10px] text-muted">Delivering to</span>
              <span className="font-medium text-ink">Phnom Penh</span>
            </span>
          </div>

          <nav className="ml-auto flex items-center gap-4 text-sm lg:ml-0">
            <NavLink
              to="/cart"
              className={({ isActive }) =>
                `relative font-medium ${isActive ? 'text-brand-700' : 'text-slate-600 hover:text-ink'}`
              }
            >
              Cart
              {cartCount > 0 ? (
                <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white">
                  {cartCount}
                </span>
              ) : null}
            </NavLink>

            {isAuthenticated ? (
              <>
                <NavLink
                  to="/orders"
                  className={({ isActive }) =>
                    `font-medium ${isActive ? 'text-brand-700' : 'text-slate-600 hover:text-ink'}`
                  }
                >
                  Orders
                </NavLink>
                <span className="hidden text-slate-400 sm:inline">·</span>
                <span className="hidden text-slate-600 sm:inline">{user?.name}</span>
                <button
                  type="button"
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {logout.isPending ? 'Signing out…' : 'Sign out'}
                </button>
              </>
            ) : (
              <Link
                to="/account"
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>

        {/* Category nav strip */}
        <div className="border-t border-slate-100">
          <div className="mx-auto flex max-w-7xl items-center gap-5 overflow-x-auto px-6 py-2 text-sm">
            <span className="flex shrink-0 items-center gap-1.5 font-semibold text-ink">
              <GridIcon className="size-4" /> All Categories
            </span>
            {NAV_LINKS.map((link) => (
              <Link
                key={link}
                to={`/?q=${encodeURIComponent(link)}`}
                className="shrink-0 whitespace-nowrap text-slate-600 hover:text-brand-700"
              >
                {link}
              </Link>
            ))}
            <span className="ml-auto shrink-0 font-semibold text-brand-700">Best Deals</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <Outlet />
      </main>

      <StorefrontFooter />
    </div>
  )
}

/** Header search — submits to the homepage as `/?q=term`, clears on empty. */
function SearchBox() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [term, setTerm] = useState(params.get('q') ?? '')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const q = term.trim()
    navigate(q ? `/?q=${encodeURIComponent(q)}` : '/')
  }

  return (
    <form onSubmit={onSubmit} role="search" className="hidden min-w-0 flex-1 sm:block">
      <div className="relative mx-auto max-w-xl">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search products…"
          aria-label="Search products"
          className="w-full rounded-full border border-slate-300 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
        />
      </div>
    </form>
  )
}

function StorefrontFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold text-ink">{col.heading}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link to="/" className="text-sm text-muted hover:text-ink hover:underline">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Chabhuoy Marketplace. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-xs font-medium text-muted">
            <Link to="/" className="hover:text-ink hover:underline">
              Privacy policy
            </Link>
            <Link to="/" className="hover:text-ink hover:underline">
              Terms of use
            </Link>
            <Link to="/" className="hover:text-ink hover:underline">
              Warranty
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M21 21l-4.3-4.3M11 19a8 8 0 110-16 8 8 0 010 16z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      {[
        [4, 4],
        [14, 4],
        [4, 14],
        [14, 14],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="6" height="6" rx="1.5" fill="currentColor" />
      ))}
    </svg>
  )
}
