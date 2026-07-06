import { useState } from 'react'
import { VENDOR_STATUSES, type VendorStatus } from '@/types/api'
import { useVendors, useUpdateVendorStatus, useUpdateVendorCommission } from '@/features/vendors/useVendors'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { formatCurrency } from '@/utils/format'
import { apiErrorMessage } from '@/lib/api'

type Filter = VendorStatus | 'all'
const FILTERS: Filter[] = ['all', ...VENDOR_STATUSES]

/** Status transitions an admin can apply from each current status. */
const ACTIONS: Record<VendorStatus, Array<{ label: string; to: VendorStatus }>> = {
  pending: [
    { label: 'Approve', to: 'active' },
    { label: 'Suspend', to: 'suspended' },
  ],
  active: [{ label: 'Suspend', to: 'suspended' }],
  suspended: [{ label: 'Reactivate', to: 'active' }],
}

interface CommissionCellProps {
  vendorId: string
  rate: string | number | null | undefined
  isSaving: boolean
  onSave: (rate: number) => void
}

/** Inline take-rate editor — only saves when the value actually changed and is a valid 0-100 rate. */
function CommissionCell({ vendorId, rate, isSaving, onSave }: CommissionCellProps) {
  const [input, setInput] = useState(rate == null ? '' : String(rate))

  const parsed = Number(input)
  const isValid = input.trim() !== '' && Number.isFinite(parsed) && parsed >= 0 && parsed <= 100
  // Compare numerically, not as strings — the server echoes "15.00" back for a "15" we sent.
  const isDirty = isValid ? parsed !== Number(rate ?? NaN) : input.trim() !== ''

  return (
    <div className="flex items-center justify-end gap-1.5">
      <input
        type="number"
        min={0}
        max={100}
        step="0.01"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isSaving}
        aria-label={`Commission rate for vendor ${vendorId}`}
        className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:opacity-50"
      />
      <span className="text-xs text-muted">%</span>
      <button
        type="button"
        disabled={isSaving || !isValid || !isDirty}
        onClick={() => onSave(parsed)}
        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {isSaving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}

export function VendorsPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching, error } = useVendors({
    status: filter === 'all' ? undefined : filter,
    page,
    perPage: 15,
  })
  const updateStatus = useUpdateVendorStatus()
  const updateCommission = useUpdateVendorCommission()

  const selectFilter = (next: Filter) => {
    setFilter(next)
    setPage(1)
  }

  const mutationError = updateStatus.error ?? updateCommission.error

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Vendors</h1>
        <p className="text-sm text-muted">
          Approve, suspend, or reactivate marketplace vendors, and set each vendor's take rate.
        </p>
      </header>

      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => selectFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${
              filter === f ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {mutationError ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {apiErrorMessage(mutationError, 'Could not update the vendor.')}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="px-4 py-6">
            <Spinner label="Loading vendors…" />
          </div>
        ) : error ? (
          <p className="px-4 py-6 text-sm text-red-700" role="alert">
            {apiErrorMessage(error, 'Could not load vendors.')}
          </p>
        ) : data && data.data.length > 0 ? (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Vendor</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Payout balance</th>
                  <th className="px-4 py-2 text-right font-medium">Commission</th>
                  <th className="px-4 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((vendor) => {
                  // Only the row whose mutation is in flight should freeze;
                  // other vendors stay actionable. TanStack v5 exposes the
                  // in-flight payload via `variables` while `isPending`.
                  const isMutatingRow =
                    updateStatus.isPending && updateStatus.variables?.id === vendor.id

                  return (
                    <tr key={vendor.id}>
                      <td className="px-4 py-3 font-medium text-ink">{vendor.name}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={vendor.status} />
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatCurrency(vendor.payout_balance)}
                      </td>
                      <td className="px-4 py-3">
                        <CommissionCell
                          vendorId={vendor.id}
                          rate={vendor.commission_rate}
                          isSaving={
                            updateCommission.isPending && updateCommission.variables?.id === vendor.id
                          }
                          onSave={(rate) => updateCommission.mutate({ id: vendor.id, rate })}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {ACTIONS[vendor.status].map((action) => (
                            <button
                              key={action.to}
                              type="button"
                              disabled={isMutatingRow}
                              onClick={() =>
                                updateStatus.mutate({ id: vendor.id, status: action.to })
                              }
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <Pagination meta={data.meta} onPage={setPage} isFetching={isFetching} />
          </>
        ) : (
          <p className="px-4 py-6 text-sm text-muted">No vendors match this filter.</p>
        )}
      </div>
    </div>
  )
}
