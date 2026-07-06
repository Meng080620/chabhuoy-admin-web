import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMyOrders } from '@/features/orders/useMyOrders'
import { OrderStatusBadge } from '@/components/ui/OrderStatusBadge'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { formatCurrency, formatDate } from '@/utils/format'
import { apiErrorMessage } from '@/lib/api'

export function MyOrdersPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching, error } = useMyOrders(page)

  if (isLoading) return <Spinner label="Loading your orders…" />
  if (error) {
    return (
      <p className="text-sm text-red-700" role="alert">
        {apiErrorMessage(error, 'Could not load your orders.')}
      </p>
    )
  }

  const orders = data?.data ?? []

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 font-display text-2xl font-bold text-night-900">Your orders</h1>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-plaster-200 bg-white px-5 py-8 text-center">
          <p className="text-sm text-night-600">You haven’t placed any orders yet.</p>
          <Link to="/" className="mt-3 inline-block text-sm font-medium text-kram-700">
            Start shopping
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  to={`/orders/${order.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-plaster-200 bg-white px-5 py-4 transition hover:border-kram-600/40 hover:shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-night-600">#{order.id.slice(0, 8)}</p>
                    <p className="mt-1 text-sm text-night-600">{formatDate(order.placed_at)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <OrderStatusBadge status={order.status} label={order.status_label} />
                    <span className="font-semibold text-night-900">{formatCurrency(order.total)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {data ? (
            <div className="mt-4 rounded-xl border border-plaster-200 bg-white">
              <Pagination meta={data.meta} onPage={setPage} isFetching={isFetching} />
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
