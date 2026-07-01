import { useState } from 'react'
import { ORDER_STATUSES, type Order, type OrderStatus } from '@/types/api'
import { useOrders, useCancelOrder } from '@/features/orders/useOrders'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { formatCurrency } from '@/utils/format'
import { apiErrorMessage } from '@/lib/api'

type Filter = OrderStatus | 'all'
const FILTERS: Filter[] = ['all', ...ORDER_STATUSES]

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-brand-100 text-brand-700',
  shipped: 'bg-violet-100 text-violet-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

// Only Pending/Paid orders can be cancelled — the API rejects the rest with 422,
// so we don't even offer the action for shipped/delivered/cancelled.
const CANCELLABLE: ReadonlySet<OrderStatus> = new Set<OrderStatus>(['pending', 'paid'])

function shortId(id: string): string {
  return id.slice(0, 8)
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function OrdersPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching, error } = useOrders({
    status: filter === 'all' ? undefined : filter,
    page,
    perPage: 15,
  })
  const cancelOrder = useCancelOrder()

  const selectFilter = (next: Filter) => {
    setFilter(next)
    setPage(1)
  }

  const onCancel = (order: Order) => {
    if (window.confirm(`Cancel order ${shortId(order.id)}? Held stock is returned to inventory.`)) {
      cancelOrder.mutate(order.id)
    }
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Orders</h1>
        <p className="text-sm text-muted">Every order on the platform. Cancel to refund held stock.</p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
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

      {cancelOrder.error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {apiErrorMessage(cancelOrder.error, 'Could not cancel the order.')}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="px-4 py-6">
            <Spinner label="Loading orders…" />
          </div>
        ) : error ? (
          <p className="px-4 py-6 text-sm text-red-700" role="alert">
            {apiErrorMessage(error, 'Could not load orders.')}
          </p>
        ) : data && data.data.length > 0 ? (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Order</th>
                  <th className="px-4 py-2 font-medium">Customer</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Total</th>
                  <th className="px-4 py-2 font-medium">Placed</th>
                  <th className="px-4 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((order) => {
                  const isCancelling = cancelOrder.isPending && cancelOrder.variables === order.id
                  return (
                    <tr key={order.id}>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{shortId(order.id)}</td>
                      <td className="px-4 py-3 text-ink">
                        {order.customer?.name ?? '—'}
                        {order.customer ? (
                          <span className="block text-xs text-muted">{order.customer.email}</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[order.status]}`}
                        >
                          {order.status_label || order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-ink">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(order.placed_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          {CANCELLABLE.has(order.status) ? (
                            <button
                              type="button"
                              disabled={isCancelling}
                              onClick={() => onCancel(order)}
                              className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              {isCancelling ? 'Cancelling…' : 'Cancel'}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
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
          <p className="px-4 py-6 text-sm text-muted">No orders match this filter.</p>
        )}
      </div>
    </div>
  )
}
