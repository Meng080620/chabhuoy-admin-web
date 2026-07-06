import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDeliveryEarnings } from '@/features/delivery/useDeliveryLedgers'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { formatCurrency, formatDate } from '@/utils/format'
import { apiErrorMessage } from '@/lib/api'

export function DeliveryEarningsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching, error } = useDeliveryEarnings({ page, perPage: 20 })

  return (
    <div>
      <header className="mb-6">
        <Link to="/admin/riders" className="text-sm text-brand-700 hover:underline">
          ← Riders
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink">Rider earnings ledger</h1>
        <p className="text-sm text-muted">Every wallet disbursement paid out to a rider, newest first.</p>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="px-4 py-6">
            <Spinner label="Loading earnings…" />
          </div>
        ) : error ? (
          <p className="px-4 py-6 text-sm text-red-700" role="alert">
            {apiErrorMessage(error, 'Could not load the earnings ledger.')}
          </p>
        ) : data && data.data.length > 0 ? (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Rider</th>
                  <th className="px-4 py-2 text-right font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Reference</th>
                  <th className="px-4 py-2 font-medium">Settled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((earning) => (
                  <tr key={earning.id}>
                    <td className="px-4 py-3 font-medium text-ink">
                      {earning.delivery_man?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {formatCurrency(earning.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium capitalize text-emerald-700">
                        {earning.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{earning.reference ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(earning.processed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination meta={data.meta} onPage={setPage} isFetching={isFetching} />
          </>
        ) : (
          <p className="px-4 py-6 text-sm text-muted">No riders have been paid out yet.</p>
        )}
      </div>
    </div>
  )
}
