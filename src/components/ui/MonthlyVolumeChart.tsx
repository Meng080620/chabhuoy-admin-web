import { useState } from 'react'
import type { MonthlyPoint } from '@/features/dashboard/revenueSeries'
import { formatCurrency } from '@/utils/format'

type Metric = 'volume' | 'avg'

interface MonthlyVolumeChartProps {
  data: MonthlyPoint[]
  /** Plot height in px (excludes the x-axis labels). */
  height?: number
}

const METRICS: { id: Metric; label: string }[] = [
  { id: 'volume', label: 'Total Volume' },
  { id: 'avg', label: 'Avg. Value' },
]

/** Compact axis label: 1500 → "$2K", 150000 → "$150K", 500 → "$500". */
function axisLabel(value: number): string {
  if (value >= 1000) {
    const k = value / 1000
    return `$${Number.isInteger(k) ? k : k.toFixed(1)}K`
  }
  return `$${Math.round(value)}`
}

/**
 * Build a "nice" linear scale: a rounded ceiling and evenly spaced gridlines
 * (1/2/5 × 10ⁿ steps) so the axis reads $0/$50K/$100K/$150K instead of raw maxima.
 */
function niceScale(max: number, targetTicks = 4): { max: number; lines: number[] } {
  if (max <= 0) return { max: 0, lines: [0] }
  const rawStep = max / (targetTicks - 1)
  const mag = 10 ** Math.floor(Math.log10(rawStep))
  const norm = rawStep / mag
  const niceStep = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag
  const niceMax = Math.ceil(max / niceStep) * niceStep
  const lines: number[] = []
  for (let v = 0; v <= niceMax + niceStep / 1000; v += niceStep) lines.push(v)
  return { max: niceMax, lines }
}

/**
 * Monthly volume bar chart — the dashboard's hero. Toggles between summed volume
 * and average order value; bars sit grey until hovered/focused, when the active
 * bar turns brand-blue and a tooltip surfaces the exact figure. Pure CSS bars
 * (no charting dep), keyboard-reachable one bar at a time.
 */
export function MonthlyVolumeChart({ data, height = 260 }: MonthlyVolumeChartProps) {
  const [metric, setMetric] = useState<Metric>('volume')
  const [hovered, setHovered] = useState<number | null>(null)

  const valueOf = (p: MonthlyPoint) => (metric === 'volume' ? p.volume : p.avg)
  const max = data.reduce((m, p) => Math.max(m, valueOf(p)), 0)
  const scale = niceScale(max)

  // With no hover, spotlight the peak month so the chart reads "alive" on load.
  const peak = data.reduce((best, p, i) => (valueOf(p) > valueOf(data[best]!) ? i : best), 0)
  const active = hovered ?? peak

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Metric toggle — segmented control */}
      <div className="inline-flex rounded-lg bg-slate-100 p-0.5" role="tablist" aria-label="Chart metric">
        {METRICS.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={metric === m.id}
            onClick={() => setMetric(m.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              metric === m.id ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        {/* Y-axis labels, top → bottom */}
        <div
          className="flex shrink-0 flex-col justify-between text-right text-xs text-muted"
          style={{ height }}
          aria-hidden="true"
        >
          {[...scale.lines].reverse().map((v) => (
            <span key={v}>{axisLabel(v)}</span>
          ))}
        </div>

        {/* Plot */}
        <div className="relative flex-1">
          {/* Gridlines */}
          <div className="absolute inset-0 flex flex-col justify-between" aria-hidden="true" style={{ height }}>
            {[...scale.lines].reverse().map((v) => (
              <span key={v} className="border-t border-dashed border-slate-100" />
            ))}
          </div>

          {/* Bars */}
          <div className="relative flex items-end gap-2" style={{ height }}>
            {data.map((p, i) => {
              const value = valueOf(p)
              const pct = scale.max > 0 ? (value / scale.max) * 100 : 0
              const isActive = i === active
              return (
                <button
                  key={p.key}
                  type="button"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                  className="group relative flex h-full flex-1 items-end outline-none"
                  aria-label={`${p.label}: ${formatCurrency(value)}`}
                >
                  {/* Tooltip */}
                  {isActive && value > 0 ? (
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-left shadow-md">
                      <p className="text-xs text-muted">{metric === 'volume' ? 'Volume' : 'Avg. value'}</p>
                      <p className="text-sm font-semibold text-ink">{formatCurrency(value)}</p>
                    </div>
                  ) : null}

                  <span
                    className={`w-full rounded-md transition-colors ${
                      isActive ? 'bg-brand-500' : 'bg-slate-200 group-hover:bg-slate-300'
                    }`}
                    // Floor at 2px so zero/near-zero months stay visible as a baseline tick.
                    style={{ height: `${Math.max(pct, value > 0 ? 1 : 0.8)}%`, minHeight: 2 }}
                  />
                </button>
              )
            })}
          </div>

          {/* X-axis labels */}
          <div className="mt-2 flex gap-2">
            {data.map((p) => (
              <span key={p.key} className="flex-1 text-center text-xs text-muted">
                {p.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
