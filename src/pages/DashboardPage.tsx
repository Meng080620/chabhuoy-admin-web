import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '@/store/auth'
import { useDashboardSummary } from '@/features/dashboard/useDashboardSummary'
import { useOrders } from '@/features/orders/useOrders'
import { buildMonthlySeries } from '@/features/dashboard/revenueSeries'
import type { DashboardSummary } from '@/types/api'
import { MetricCard, type Trend } from '@/components/ui/MetricCard'
import { MonthlyVolumeChart } from '@/components/ui/MonthlyVolumeChart'
import { RecentOrdersList } from '@/components/ui/RecentOrdersList'
import {
  CartIcon,
  RevenueIcon,
  AvgIcon,
  VendorIcon,
  BoxIcon,
  CustomerIcon,
  CheckIcon,
} from '@/components/ui/icons'
import { Spinner } from '@/components/ui/Spinner'
import { formatCurrency, formatNumber } from '@/utils/format'
import { apiErrorMessage } from '@/lib/api'

export function DashboardPage() {
  const user = useUser()
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  const { data: summary, isLoading, error } = useDashboardSummary()
  // One wide order fetch feeds both the 12-month volume series and the recent feed.
  // Orders are newest-first, so the most recent months are fully captured in page 1.
  const { data: orders } = useOrders({ page: 1, perPage: 100 })

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Welcome back, {firstName}!
        </h1>
        <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
          <CalendarIcon />
          Last 12 months
        </span>
      </header>

      {isLoading ? (
        <Spinner label="Loading dashboard…" />
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {apiErrorMessage(error, 'Could not load the dashboard.')}
        </p>
      ) : summary ? (
        (() => {
          // `revenue.captured` excludes pending/cancelled orders, so AOV divides
          // by the matching order count rather than the raw `orders.total`.
          const capturedOrders =
            summary.orders.by_status.paid +
            summary.orders.by_status.shipped +
            summary.orders.by_status.delivered
          const aov = capturedOrders > 0 ? Number(summary.revenue.captured) / capturedOrders : 0

          const orderRows = orders?.data ?? []
          const monthly = buildMonthlySeries(orderRows, new Date(), 12)

          // Month-over-month volume change — a real trend, not a placeholder.
          const last = monthly.at(-1)?.volume ?? 0
          const prev = monthly.at(-2)?.volume ?? 0
          const revenueTrend: Trend | undefined =
            prev > 0
              ? {
                  label: `${last >= prev ? '+' : ''}${Math.round(((last - prev) / prev) * 100)}%`,
                  direction: last >= prev ? 'up' : 'down',
                }
              : undefined

          return (
            <>
              <AttentionStrip summary={summary} />

              {/* Hero: monthly volume chart + KPI rail */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <MonthlyVolumeChart data={monthly} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <MetricCard
                    tone="green"
                    icon={<RevenueIcon />}
                    label="Gross revenue"
                    value={formatCurrency(summary.revenue.captured)}
                    hint={`Today: ${formatCurrency(summary.revenue.today)}`}
                    trend={revenueTrend}
                  />
                  <MetricCard
                    tone="blue"
                    icon={<CartIcon />}
                    label="Orders"
                    value={formatNumber(summary.orders.total)}
                    hint={`${formatNumber(summary.orders.by_status.pending)} pending`}
                  />
                  <MetricCard
                    tone="amber"
                    icon={<CustomerIcon />}
                    label="Customers"
                    value={formatNumber(summary.customers.total)}
                    hint={`${formatNumber(summary.customers.new_this_week)} new this week`}
                  />
                  <MetricCard
                    tone="brand"
                    icon={<AvgIcon />}
                    label="Avg. order value"
                    value={formatCurrency(aov)}
                  />
                </div>
              </div>

              {/* Recent orders + top products */}
              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
                  <div className="flex items-center justify-between px-5 py-4">
                    <div>
                      <h2 className="text-base font-semibold text-ink">Recent orders</h2>
                      <p className="text-xs text-muted">Latest activity across the store.</p>
                    </div>
                    <Link to="/admin/orders" className="text-xs font-medium text-brand-700 hover:underline">
                      View all
                    </Link>
                  </div>
                  <div className="border-t border-slate-100">
                    <RecentOrdersList orders={orderRows.slice(0, 6)} />
                  </div>
                </section>

                <TopProductsCard products={summary.catalog.top_products} />
              </div>
            </>
          )
        })()
      ) : null}
    </div>
  )
}

interface AttentionItemDef {
  key: string
  label: string
  value: string
  caption: string
  to: string
  icon: ReactNode
  needsAction: boolean
}

/**
 * Turns the dashboard from purely retrospective (revenue/orders trend) into
 * actionable: three real operational queues, each a real number that means
 * "go do something," not decoration. Collapses to a calm all-clear state
 * rather than showing three green zeroes.
 */
function AttentionStrip({ summary }: { summary: DashboardSummary }) {
  const items: AttentionItemDef[] = [
    {
      key: 'pending',
      label: 'Pending orders',
      value: formatNumber(summary.orders.by_status.pending),
      caption: 'awaiting fulfillment',
      to: '/admin/orders',
      icon: <CartIcon className="size-4" />,
      needsAction: summary.orders.by_status.pending > 0,
    },
    {
      key: 'payouts',
      label: 'Payouts owed',
      value: formatCurrency(summary.payouts.pending_amount),
      caption: `${formatNumber(summary.payouts.pending_count)} vendor${summary.payouts.pending_count === 1 ? '' : 's'}`,
      to: '/admin/payouts',
      icon: <VendorIcon className="size-4" />,
      needsAction: summary.payouts.pending_count > 0,
    },
    {
      key: 'stock',
      label: 'Low stock',
      value: formatNumber(summary.catalog.low_stock_count),
      caption: 'below threshold',
      to: '/admin/products',
      icon: <BoxIcon className="size-4" />,
      needsAction: summary.catalog.low_stock_count > 0,
    },
  ]

  if (items.every((item) => !item.needsAction)) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
        <CheckIcon className="size-5 shrink-0" />
        <p>
          <span className="font-semibold">All clear.</span> No pending orders, payouts, or low
          stock right now.
        </p>
      </div>
    )
  }

  return (
    <div className="mb-6 grid grid-cols-1 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {items.map((item) => (
        <Link
          key={item.key}
          to={item.to}
          className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50"
        >
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
              item.needsAction ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'
            }`}
          >
            {item.icon}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted">{item.label}</p>
            <p className="text-lg font-semibold text-ink">{item.value}</p>
            <p className="text-xs text-muted">{item.caption}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}

/** Ranked by revenue — a real ranking (contract sorts top 5 desc), so the position itself is information. */
function TopProductsCard({ products }: { products: DashboardSummary['catalog']['top_products'] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="px-5 py-4">
        <h2 className="text-base font-semibold text-ink">Top products</h2>
        <p className="text-xs text-muted">Ranked by revenue, last 12 months.</p>
      </div>
      {products.length === 0 ? (
        <p className="border-t border-slate-100 px-5 py-6 text-sm text-muted">No sales yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 border-t border-slate-100">
          {products.map((product, i) => (
            <li key={product.id}>
              <Link
                to={`/products/${product.id}`}
                className="flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50"
              >
                <span className="w-5 shrink-0 text-sm font-semibold text-muted">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{product.name}</p>
                  <p className="text-xs text-muted">{product.units} sold</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-ink">
                  {formatCurrency(product.revenue)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-4 text-muted" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 9h18M8 3v3M16 3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
