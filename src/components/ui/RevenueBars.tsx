import { formatCurrency } from '@/utils/format'

export interface RevenueBar {
  /** Stable key + label fallback. */
  id: string
  label: string
  value: number
}

/**
 * Horizontal proportional bar chart — bars sized against the largest value.
 * Pure CSS (no charting dependency): one view doesn't justify ~100kB of recharts,
 * and a flex/width treatment is fully themeable with the brand tokens.
 */
export function RevenueBars({ data }: { data: RevenueBar[] }) {
  const max = data.reduce((m, d) => Math.max(m, d.value), 0)

  return (
    <ul className="space-y-3">
      {data.map((d, i) => {
        // Guard the zero-revenue case so every bar isn't full width.
        const pct = max > 0 ? Math.max((d.value / max) * 100, 2) : 0
        return (
          <li key={d.id}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="min-w-0 truncate font-medium text-ink">
                <span className="mr-2 text-muted">{i + 1}.</span>
                {d.label}
              </span>
              <span className="shrink-0 font-semibold text-ink">{formatCurrency(d.value)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
