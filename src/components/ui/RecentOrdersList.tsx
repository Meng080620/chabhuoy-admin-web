import { Link } from 'react-router-dom'
import type { Order } from '@/types/api'
import { OrderStatusBadge } from '@/components/ui/OrderStatusBadge'
import { formatCurrency, formatDate } from '@/utils/format'

/** Compact recent-orders feed for the dashboard. Rows deep-link to the admin order. */
export function RecentOrdersList({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return <p className="px-4 py-6 text-sm text-muted">No orders yet.</p>
  }

  return (
    <ul className="divide-y divide-slate-100">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            to="/admin/orders"
            className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-50"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">
                {order.customer?.name ?? `#${order.id.slice(0, 8)}`}
              </p>
              <p className="text-xs text-muted">{formatDate(order.placed_at)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <OrderStatusBadge status={order.status} label={order.status_label} />
              <span className="w-20 text-right text-sm font-semibold text-ink">
                {formatCurrency(order.total)}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
