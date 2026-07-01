import { useEffect, useRef, type ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useUser } from '@/store/auth'
import { useLogout } from '@/features/auth/useAuth'
import {
  HomeIcon,
  VendorIcon,
  OrdersIcon,
  BoxIcon,
  SearchIcon,
  ImageIcon,
  TagIcon,
  CustomerIcon,
  BanknoteIcon,
} from '@/components/ui/icons'

interface NavItem {
  to: string
  label: string
  end: boolean
  icon: ReactNode
}

interface NavGroup {
  /** Section heading; omitted for the top-level group. */
  title?: string
  items: NavItem[]
}

const ICON = 'size-[18px] shrink-0'

// Real routes only — no dead links. Grouped to mirror the reference sidebar.
const NAV: NavGroup[] = [
  {
    items: [{ to: '/admin', label: 'Dashboard', end: true, icon: <HomeIcon className={ICON} /> }],
  },
  {
    title: 'Management',
    items: [
      { to: '/admin/vendors', label: 'Vendors', end: false, icon: <VendorIcon className={ICON} /> },
      { to: '/admin/orders', label: 'Orders', end: false, icon: <OrdersIcon className={ICON} /> },
      { to: '/admin/products', label: 'Products', end: false, icon: <BoxIcon className={ICON} /> },
      { to: '/admin/categories', label: 'Categories', end: false, icon: <TagIcon className={ICON} /> },
      { to: '/admin/customers', label: 'Customers', end: false, icon: <CustomerIcon className={ICON} /> },
      { to: '/admin/payouts', label: 'Payouts', end: false, icon: <BanknoteIcon className={ICON} /> },
    ],
  },
  {
    title: 'Storefront',
    items: [
      { to: '/admin/banners', label: 'Banners', end: false, icon: <ImageIcon className={ICON} /> },
      { to: '/admin/brand-stores', label: 'Brand stores', end: false, icon: <BoxIcon className={ICON} /> },
    ],
  },
]

export function AdminLayout() {
  const user = useUser()
  const logout = useLogout()
  const searchRef = useRef<HTMLInputElement>(null)

  // "/" focuses search (mirrors the reference's shortcut hint) — but never while
  // the user is already typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/') return
      const el = document.activeElement
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      if (typing) return
      e.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="px-5 py-5">
          <p className="text-lg font-bold text-ink">Chabhuoy</p>
          <p className="text-xs text-muted">Admin Console</p>
        </div>

        {/* Search with keyboard-shortcut affordance */}
        <div className="px-3 pb-2">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              ref={searchRef}
              type="search"
              placeholder="Search…"
              aria-label="Search"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-9 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 text-xs text-muted">
              /
            </kbd>
          </div>
        </div>

        <nav className="flex-1 space-y-5 px-3 py-3">
          {NAV.map((group, gi) => (
            <div key={group.title ?? `group-${gi}`} className="space-y-1">
              {group.title ? (
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                  {group.title}
                </p>
              ) : null}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                    }`
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 px-4 py-4">
          <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
          <p className="truncate text-xs text-muted">{user?.email}</p>
          <button
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {logout.isPending ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-50 px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}
