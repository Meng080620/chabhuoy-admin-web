import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCustomers } from '@/features/customers/useCustomers'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { formatCurrency, formatDate } from '@/utils/format'
import { apiErrorMessage } from '@/lib/api'

export function CustomersPage() {
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

  const { data, isLoading, isFetching, error } = useCustomers({ search, page, perPage: 20 })

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Customers</h1>
        <p className="text-sm text-muted">
          Every customer's lifetime activity — spend counts only realised (paid+) orders.
        </p>
      </header>

      <div className="mb-4">
        <input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="px-4 py-6">
            <Spinner label="Loading customers…" />
          </div>
        ) : error ? (
          <p className="px-4 py-6 text-sm text-red-700" role="alert">
            {apiErrorMessage(error, 'Could not load customers.')}
          </p>
        ) : data && data.data.length > 0 ? (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Customer</th>
                  <th className="px-4 py-2 text-right font-medium">Orders</th>
                  <th className="px-4 py-2 text-right font-medium">Total spent</th>
                  <th className="px-4 py-2 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/customers/${customer.id}`}
                        className="font-medium text-brand-700 hover:underline"
                      >
                        {customer.name}
                      </Link>
                      <p className="text-xs text-muted">{customer.email}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{customer.orders_count}</td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {formatCurrency(customer.total_spent)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(customer.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination meta={data.meta} onPage={setPage} isFetching={isFetching} />
          </>
        ) : (
          <p className="px-4 py-6 text-sm text-muted">No customers match this search.</p>
        )}
      </div>
    </div>
  )
}
