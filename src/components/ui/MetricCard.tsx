import type { ReactNode } from 'react'

type Tone = 'brand' | 'green' | 'blue' | 'amber'

const TONES: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-600',
  green: 'bg-green-50 text-green-600',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
}

export interface Trend {
  /** Pre-formatted label, e.g. "+8%". */
  label: string
  direction: 'up' | 'down'
}

interface MetricCardProps {
  label: string
  value: string
  icon: ReactNode
  tone?: Tone
  hint?: string
  /** Optional change badge shown beside the value (e.g. month-over-month). */
  trend?: Trend
}

/**
 * KPI tile in the Shopr style — a tinted icon chip beside the label/value, with
 * an optional trend badge. Used across the dashboard's metric strip.
 */
export function MetricCard({ label, value, icon, tone = 'brand', hint, trend }: MetricCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-muted">{label}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <p className="text-2xl font-semibold tracking-tight text-ink">{value}</p>
          {trend ? (
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                trend.direction === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {trend.label}
            </span>
          ) : null}
        </div>
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>
    </div>
  )
}
