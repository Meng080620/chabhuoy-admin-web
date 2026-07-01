import { AxiosError } from 'axios'
import { Link, useParams } from 'react-router-dom'
import { useCustomer } from '@/features/customers/useCustomers'
import { OrderStatusBadge } from '@/components/ui/OrderStatusBadge'
import { Spinner } from '@/components/ui/Spinner'
import { formatCurrency, formatDate } from '@/utils/format'
import { apiErrorMessage } from '@/lib/api'

export function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>()
  const id = customerId ? Number(customerId) : undefined
  const { data: customer, isLoading, error } = useCustomer(id)

  if (isLoading) return <Spinner label="Loading customer…" />

  const notFound = error instanceof AxiosError && error.response?.status === 404
  if (error || !customer) {
    return (
      <div className="max-w-lg">
        <p className="text-sm text-red-700" role="alert">
          {notFound ? 'Customer not found.' : apiErrorMessage(error, 'Could not load this customer.')}
        </p>
        <Link to="/admin/customers" className="mt-4 inline-block text-sm font-medium text-brand-700">
          ← Back to customers
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <Link to="/admin/customers" className="text-sm font-medium text-brand-700">
        ← Back to customers
      </Link>

      <header className="mt-4 flex items-start justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-ink">{customer.name}</h1>
          <p className="text-sm text-muted">{customer.email}</p>
          <p className="mt-1 text-xs text-muted">Joined {formatDate(customer.created_at)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-muted">Total spent (realised)</p>
          <p className="text-2xl font-bold text-ink">{formatCurrency(customer.total_spent)}</p>
          <p className="text-xs text-muted">{customer.orders_count} order(s) placed</p>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="px-5 py-4">
            <h2 className="text-base font-semibold text-ink">Recent orders</h2>
          </div>
          {customer.recent_orders.length === 0 ? (
            <p className="border-t border-slate-100 px-5 py-6 text-sm text-muted">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {customer.recent_orders.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-muted">#{order.id}</p>
                    <p className="text-xs text-muted">{formatDate(order.placed_at)}</p>
                  </div>
                  <OrderStatusBadge status={order.status} label={order.status_label} />
                  <span className="font-semibold text-ink">{formatCurrency(order.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="px-5 py-4">
            <h2 className="text-base font-semibold text-ink">Addresses</h2>
          </div>
          {customer.addresses.length === 0 ? (
            <p className="border-t border-slate-100 px-5 py-6 text-sm text-muted">No saved addresses.</p>
          ) : (
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {customer.addresses.map((address) => (
                <li key={address.id} className="px-5 py-3 text-sm">
                  <p className="font-medium text-ink">
                    {address.label ?? 'Address'}
                    {address.is_default ? (
                      <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        Default
                      </span>
                    ) : null}
                  </p>
                  <p className="text-slate-600">{address.recipient_name}</p>
                  <p className="text-slate-600">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ''}, {address.city} {address.postal_code},{' '}
                    {address.country}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
