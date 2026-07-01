import type { Order, OrderStatus } from '@/types/api'

export interface RevenuePoint {
  /** Short weekday label for the x-axis (e.g. "Mon"). */
  label: string
  /** ISO date key (YYYY-MM-DD) — stable React key. */
  date: string
  /** Summed realized revenue for that day. */
  value: number
}

/**
 * Statuses that count as realized revenue — mirrors the backend's `total_spent`
 * semantics (pending + cancelled excluded). Keep in sync with the report.
 */
const REVENUE_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  'paid',
  'shipped',
  'delivered',
])

/** UTC YYYY-MM-DD key for a date — buckets are calendar days. */
function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/**
 * Bucket paid/shipped/delivered orders into a per-day revenue series for the
 * last `days` calendar days (inclusive of `now`), oldest → newest.
 *
 * Accurate for the window as long as a week's orders fit in the fetched page:
 * the admin index is newest-first by `placed_at`, so the last 7 days live at the
 * top. At higher volume, prefer a server-side timeseries endpoint (flagged in
 * API_CONTRACT.md). `now` is injectable so the bucketing is deterministically
 * testable.
 */
export function buildRevenueSeries(orders: Order[], now: Date, days = 7): RevenuePoint[] {
  // Seed an empty bucket per day so gaps render as zero, not missing points.
  const buckets = new Map<string, RevenuePoint>()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - i)
    buckets.set(dayKey(d), {
      label: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      date: dayKey(d),
      value: 0,
    })
  }

  for (const order of orders) {
    if (!order.placed_at || !REVENUE_STATUSES.has(order.status)) continue
    const key = dayKey(new Date(order.placed_at))
    const bucket = buckets.get(key)
    if (bucket) bucket.value += Number(order.total)
  }

  return [...buckets.values()]
}

export interface MonthlyPoint {
  /** Short month label for the x-axis (e.g. "Jun"). */
  label: string
  /** Calendar-month key (YYYY-MM) — stable React key. */
  key: string
  /** Summed realized revenue for the month. */
  volume: number
  /** Number of realized orders in the month (drives the avg). */
  count: number
  /** Average order value: `volume / count`, or 0 when the month has no orders. */
  avg: number
}

/** UTC YYYY-MM key for a date — buckets are calendar months. */
function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

/**
 * Bucket paid/shipped/delivered orders into a per-month series for the trailing
 * `months` calendar months (inclusive of `now`'s month), oldest → newest. Feeds
 * the dashboard's volume chart, which toggles between summed volume and average
 * order value — so each bucket carries both `volume` and `count`.
 *
 * Same caveat as {@link buildRevenueSeries}: only as complete as the orders page
 * handed in. A full year rarely fits one page, so older months read low until a
 * server-side monthly timeseries lands (flagged in API_CONTRACT.md). `now` is
 * injectable so the bucketing is deterministically testable.
 */
export function buildMonthlySeries(orders: Order[], now: Date, months = 12): MonthlyPoint[] {
  // Seed an empty bucket per month so gaps render as zero, not missing bars.
  const buckets = new Map<string, MonthlyPoint>()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    buckets.set(monthKey(d), {
      label: d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
      key: monthKey(d),
      volume: 0,
      count: 0,
      avg: 0,
    })
  }

  for (const order of orders) {
    if (!order.placed_at || !REVENUE_STATUSES.has(order.status)) continue
    const bucket = buckets.get(monthKey(new Date(order.placed_at)))
    if (bucket) {
      bucket.volume += Number(order.total)
      bucket.count += 1
    }
  }

  for (const bucket of buckets.values()) {
    bucket.avg = bucket.count > 0 ? bucket.volume / bucket.count : 0
  }

  return [...buckets.values()]
}
