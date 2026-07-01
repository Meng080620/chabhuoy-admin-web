/**
 * The API serializes money as decimal strings (e.g. "1234.50"). Coerce and
 * format once here so pages never do ad-hoc Number() casts.
 */
export function formatCurrency(value: string | number | null | undefined): string {
  const n = typeof value === 'string' ? Number(value) : (value ?? 0)
  if (!Number.isFinite(n)) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(n)
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat('en-US').format(value ?? 0)
}

/**
 * The API serializes timestamps as ISO-8601 with microseconds
 * (e.g. "2026-06-29T12:02:18.000000Z"). `new Date()` parses these leniently
 * (it truncates sub-millisecond precision). Nullable on legacy rows → em dash.
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
