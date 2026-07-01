type Accent = 'brand' | 'green' | 'blue' | 'amber'

interface StatCardProps {
  label: string
  value: string
  hint?: string
  /** Optional colored top stripe to differentiate KPIs at a glance. */
  accent?: Accent
}

const ACCENTS: Record<Accent, string> = {
  brand: 'before:bg-brand-500',
  green: 'before:bg-green-500',
  blue: 'before:bg-blue-500',
  amber: 'before:bg-amber-500',
}

export function StatCard({ label, value, hint, accent }: StatCardProps) {
  const accentClass = accent
    ? `relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-1 ${ACCENTS[accent]}`
    : ''

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${accentClass}`}>
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  )
}
