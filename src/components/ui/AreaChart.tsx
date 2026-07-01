import { useId } from 'react'
import { formatCurrency } from '@/utils/format'

export interface AreaPoint {
  label: string
  value: number
}

interface AreaChartProps {
  data: AreaPoint[]
  /** Height in px; width is fluid via viewBox. */
  height?: number
}

const VIEW_W = 720
const PAD_X = 8
const PAD_TOP = 28 // headroom for the peak label
const PAD_BOTTOM = 22 // room for x-axis labels

/**
 * Lightweight area chart — pure SVG, no charting dependency. Renders a smooth-ish
 * gradient area with a marker on the peak point. Scales to its container width via
 * a fixed viewBox; height is fixed. Built for the dashboard's revenue series.
 */
export function AreaChart({ data, height = 240 }: AreaChartProps) {
  const gradientId = useId()
  const plotH = height - PAD_TOP - PAD_BOTTOM
  const max = data.reduce((m, d) => Math.max(m, d.value), 0)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-muted" style={{ height }}>
        No revenue data.
      </div>
    )
  }

  const stepX = (VIEW_W - PAD_X * 2) / Math.max(data.length - 1, 1)
  const x = (i: number) => PAD_X + i * stepX
  // Flat line at the baseline when max is 0, instead of NaN.
  const y = (v: number) => PAD_TOP + (max > 0 ? plotH - (v / max) * plotH : plotH)

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.value)}`).join(' ')
  const areaPath = `${linePath} L ${x(data.length - 1)} ${PAD_TOP + plotH} L ${x(0)} ${PAD_TOP + plotH} Z`

  // Peak point gets the marker + value bubble (mirrors the reference).
  const peakIdx = data.reduce((best, d, i) => (d.value > data[best]!.value ? i : best), 0)
  const peak = data[peakIdx]!

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${height}`} className="w-full" role="img" aria-label="Revenue over time" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke="var(--color-brand-500)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

      {max > 0 ? (
        <>
          <circle cx={x(peakIdx)} cy={y(peak.value)} r="4.5" fill="white" stroke="var(--color-brand-500)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          <g transform={`translate(${x(peakIdx)}, ${y(peak.value) - 14})`}>
            <rect x="-34" y="-16" width="68" height="20" rx="6" fill="var(--color-brand-600)" />
            <text x="0" y="-2" textAnchor="middle" fontSize="11" fontWeight="600" fill="white">
              {formatCurrency(peak.value)}
            </text>
          </g>
        </>
      ) : null}

      {data.map((d, i) => (
        <text key={d.label + i} x={x(i)} y={height - 6} textAnchor="middle" fontSize="11" fill="var(--color-muted)">
          {d.label}
        </text>
      ))}
    </svg>
  )
}
