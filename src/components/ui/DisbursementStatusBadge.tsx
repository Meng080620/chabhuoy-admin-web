import type { DeliveryEarningStatus, PayoutStatus } from '@/types/api'

/** Vendor payouts and rider earnings share the same disbursement lifecycle. */
type DisbursementStatus = PayoutStatus | DeliveryEarningStatus

// Keyed on the exhaustive union, so a new backend status fails the TS build
// until it is given a colour here — no silent fall-through to "success green".
const STYLES: Record<DisbursementStatus, string> = {
  completed: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  failed: 'bg-red-50 text-red-700',
}

/**
 * Status pill for a money disbursement (`pending | completed | failed`). The
 * raw enum is shown (capitalised in CSS) so callers/tests read the backend value
 * verbatim; only the colour is derived. A failed or pending payout must never
 * read as a green success — that was the bug this replaces.
 */
export function DisbursementStatusBadge({ status }: { status: DisbursementStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STYLES[status]}`}
    >
      {status}
    </span>
  )
}
