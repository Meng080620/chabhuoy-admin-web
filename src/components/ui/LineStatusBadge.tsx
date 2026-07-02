import type { FulfillmentStatus } from '@/types/api'

const STYLES: Record<FulfillmentStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  shipped: 'bg-violet-100 text-violet-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  // Distinct from cancelled (red): a return is a completed round-trip, not a
  // never-shipped line, so it reads as orange rather than a hard error colour.
  returned: 'bg-orange-100 text-orange-700',
}

const LABELS: Record<FulfillmentStatus, string> = {
  pending: 'Pending',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
}

/**
 * Per-line fulfillment status pill. Unlike the order-level badge, the API sends
 * only the raw enum value for a line (no `status_label`), so the label is derived
 * here. Both maps are keyed on the exhaustive `FulfillmentStatus` union, so a new
 * backend status fails the TS build until it is given a colour and a label.
 */
export function LineStatusBadge({ status }: { status: FulfillmentStatus }) {
  return (
    <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  )
}
