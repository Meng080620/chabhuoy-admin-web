import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDeliveryCashSettlements } from '@/features/delivery/useDeliveryLedgers'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { formatCurrency, formatDate } from '@/utils/format'
import { apiErrorMessage } from '@/lib/api'

export function DeliveryCashSettlementsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching, error } = useDeliveryCashSettlements({ page, perPage: 20 })

  return (
    <div>
      <header className="mb-6">
        <Link to="/admin/riders" className="text-sm text-brand-700 hover:underline">
          ← Riders
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink">Rider cash settlements</h1>
        <p className="text-sm text-muted">
          COD cash riders have handed back to the platform, newest first. Riders initiate these
          themselves — this ledger is read-only.
        </p>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="px-4 py-6">
            <Spinner label="Loading cash settlements…" />
          </div>
        ) : error ? (
          <p className="px-4 py-6 text-sm text-red-700" role="alert">
            {apiErrorMessage(error, 'Could not load the cash-settlement ledger.')}
          </p>
        ) : data && data.data.length > 0 ? (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Rider</th>
                  <th className="px-4 py-2 text-right font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Settled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((settlement) => (
                  <tr key={settlement.id}>
                    <td className="px-4 py-3 font-medium text-ink">
                      {settlement.delivery_man?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {formatCurrency(settlement.amount)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(settlement.settled_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination meta={data.meta} onPage={setPage} isFetching={isFetching} />
          </>
        ) : (
          <p className="px-4 py-6 text-sm text-muted">No riders have settled cash yet.</p>
        )}
      </div>
    </div>
  )
}
