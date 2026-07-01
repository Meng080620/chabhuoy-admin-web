import { useState } from 'react'
import { VENDOR_STATUSES, type VendorStatus } from '@/types/api'
import { useVendors, useUpdateVendorStatus } from '@/features/vendors/useVendors'
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

export function VendorsPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching, error } = useVendors({
    status: filter === 'all' ? undefined : filter,
    page,
    perPage: 15,
  })
  const updateStatus = useUpdateVendorStatus()

  const selectFilter = (next: Filter) => {
    setFilter(next)
    setPage(1)
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Vendors</h1>
        <p className="text-sm text-muted">Approve, suspend, or reactivate marketplace vendors.</p>
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

      {updateStatus.error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {apiErrorMessage(updateStatus.error, 'Could not update the vendor.')}
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
