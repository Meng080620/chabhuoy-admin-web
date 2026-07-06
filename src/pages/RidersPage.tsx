import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DELIVERY_MAN_STATUSES, type DeliveryManStatus } from '@/types/api'
import {
  useDeliveryMen,
  useUpdateDeliveryManStatus,
  useDisburseDeliveryEarning,
} from '@/features/delivery/useDeliveryMen'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { formatCurrency } from '@/utils/format'
import { apiErrorMessage } from '@/lib/api'

type Filter = DeliveryManStatus | 'all'
const FILTERS: Filter[] = ['all', ...DELIVERY_MAN_STATUSES]

/** Status transitions an admin can apply from each current status. */
const ACTIONS: Record<DeliveryManStatus, Array<{ label: string; to: DeliveryManStatus }>> = {
  pending: [
    { label: 'Approve', to: 'active' },
    { label: 'Suspend', to: 'suspended' },
  ],
  active: [{ label: 'Suspend', to: 'suspended' }],
  suspended: [{ label: 'Reactivate', to: 'active' }],
}

export function RidersPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Debounce the search box so we don't fire a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(input.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(id)
  }, [input])

  const { data, isLoading, isFetching, error } = useDeliveryMen({
    status: filter === 'all' ? undefined : filter,
    search,
    page,
    perPage: 15,
  })
  const updateStatus = useUpdateDeliveryManStatus()
  const disburse = useDisburseDeliveryEarning()

  const selectFilter = (next: Filter) => {
    setFilter(next)
    setPage(1)
  }

  const mutationError = updateStatus.error ?? disburse.error

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Riders</h1>
        <p className="text-sm text-muted">
          Approve, suspend, and pay out delivery riders. Wallet is what the platform owes; cash in
          hand is COD they still owe back.
        </p>
        <div className="mt-2 flex gap-4 text-sm">
          <Link to="/admin/riders/earnings" className="text-brand-700 hover:underline">
            Earnings ledger →
          </Link>
          <Link to="/admin/riders/cash-settlements" className="text-brand-700 hover:underline">
            Cash settlements →
          </Link>
        </div>
      </header>

      <div className="mb-4">
        <input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search by name…"
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

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
          {apiErrorMessage(mutationError, 'Could not update the rider.')}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="px-4 py-6">
            <Spinner label="Loading riders…" />
          </div>
        ) : error ? (
          <p className="px-4 py-6 text-sm text-red-700" role="alert">
            {apiErrorMessage(error, 'Could not load riders.')}
          </p>
        ) : data && data.data.length > 0 ? (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Rider</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Wallet</th>
                  <th className="px-4 py-2 text-right font-medium">Cash in hand</th>
                  <th className="px-4 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((rider) => {
                  // Only the row whose mutation is in flight should freeze.
                  const isPayingOut = disburse.isPending && disburse.variables === rider.id
                  const isMutatingRow =
                    (updateStatus.isPending && updateStatus.variables?.id === rider.id) || isPayingOut
                  const canPayOut = Number(rider.wallet_balance ?? 0) > 0

                  return (
                    <tr key={rider.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            role="img"
                            aria-label={rider.is_online ? 'Online' : 'Offline'}
                            className={`inline-block size-2 shrink-0 rounded-full ${
                              rider.is_online ? 'bg-green-500' : 'bg-slate-300'
                            }`}
                          />
                          <div>
                            <p className="font-medium text-ink">{rider.name}</p>
                            {rider.vehicle_type ? (
                              <p className="text-xs capitalize text-muted">{rider.vehicle_type}</p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={rider.status} />
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatCurrency(rider.wallet_balance)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatCurrency(rider.cash_in_hand)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {ACTIONS[rider.status].map((action) => (
                            <button
                              key={action.to}
                              type="button"
                              disabled={isMutatingRow}
                              onClick={() =>
                                updateStatus.mutate({ id: rider.id, status: action.to })
                              }
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                              {action.label}
                            </button>
                          ))}
                          <button
                            type="button"
                            disabled={isMutatingRow || !canPayOut}
                            onClick={() => disburse.mutate(rider.id)}
                            title={canPayOut ? undefined : 'Nothing owed'}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {isPayingOut ? 'Paying out…' : 'Pay out'}
                          </button>
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
          <p className="px-4 py-6 text-sm text-muted">No riders match this filter or search.</p>
        )}
      </div>
    </div>
  )
}
