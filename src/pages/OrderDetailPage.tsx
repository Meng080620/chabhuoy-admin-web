import { AxiosError } from 'axios'
import { Link, useParams } from 'react-router-dom'
import { useMyOrder } from '@/features/orders/useMyOrders'
import { OrderStatusBadge } from '@/components/ui/OrderStatusBadge'
import { Spinner } from '@/components/ui/Spinner'
import { formatCurrency, formatDate } from '@/utils/format'
import { apiErrorMessage } from '@/lib/api'

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const { data: order, isLoading, error } = useMyOrder(orderId)

  if (isLoading) return <Spinner label="Loading order…" />

  const notFound = error instanceof AxiosError && error.response?.status === 404
  if (error || !order) {
    return (
      <div className="max-w-lg">
        <p className="text-sm text-red-700" role="alert">
          {notFound ? 'Order not found.' : apiErrorMessage(error, 'Could not load this order.')}
        </p>
        <Link to="/orders" className="mt-4 inline-block text-sm font-medium text-brand-700">
          ← Back to orders
        </Link>
      </div>
    )
  }

  const items = order.items ?? []

  return (
    <div className="max-w-2xl">
      <Link to="/orders" className="text-sm font-medium text-brand-700">
        ← Back to orders
      </Link>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-ink">Order confirmed</h1>
            <p className="mt-1 font-mono text-xs text-muted">#{order.id}</p>
            <p className="mt-1 text-sm text-slate-600">{formatDate(order.placed_at)}</p>
          </div>
          <OrderStatusBadge status={order.status} label={order.status_label} />
        </div>

        <div className="mt-6 divide-y divide-slate-100 border-t border-slate-100">
          {items.map((item, idx) => (
            <div key={`${item.product_name}-${idx}`} className="flex justify-between gap-4 py-3 text-sm">
              <span className="min-w-0 truncate text-slate-700">
                {item.product_name} × {item.quantity}
              </span>
              <span className="text-ink">{formatCurrency(item.line_total)}</span>
            </div>
          ))}
        </div>

        <div className="mt-2 flex justify-between border-t border-slate-100 pt-4">
          <span className="font-medium text-ink">Total</span>
          <span className="text-lg font-semibold text-ink">{formatCurrency(order.total)}</span>
        </div>

        {order.shipping ? (
          <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm">
            <p className="mb-1 font-medium text-ink">Shipping to</p>
            <p className="text-slate-600">{order.shipping.recipient_name}</p>
            <p className="text-slate-600">
              {order.shipping.line1}
              {order.shipping.line2 ? `, ${order.shipping.line2}` : ''}, {order.shipping.city}{' '}
              {order.shipping.postal_code}, {order.shipping.country}
            </p>
          </div>
        ) : null}

        {order.shipments && order.shipments.length > 0 ? (
          <div className="mt-6">
            <p className="mb-2 font-medium text-ink">Tracking</p>
            {/* A multi-vendor order ships as separate parcels — each gets its own row. */}
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
              {order.shipments.map((shipment, idx) => (
                <li key={`${shipment.vendor?.id ?? 'parcel'}-${idx}`} className="p-4 text-sm">
                  {shipment.vendor ? (
                    <p className="font-medium text-ink">Shipped by {shipment.vendor.name}</p>
                  ) : null}
                  <p className="text-slate-600">
                    {shipment.carrier ?? <span className="text-muted">Carrier not set</span>}
                  </p>
                  {shipment.tracking_number ? (
                    <p className="font-mono text-xs text-slate-600">{shipment.tracking_number}</p>
                  ) : (
                    <p className="text-xs text-muted">No tracking number yet.</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}
