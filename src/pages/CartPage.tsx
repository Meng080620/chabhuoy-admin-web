import { Link } from 'react-router-dom'
import { useCart, useRemoveCartItem, useSetCartItem } from '@/features/cart/useCart'
import type { CartItem } from '@/types/api'
import { Spinner } from '@/components/ui/Spinner'
import { formatCurrency } from '@/utils/format'
import { apiErrorMessage } from '@/lib/api'

export function CartPage() {
  const { data, isLoading, error } = useCart()

  if (isLoading) return <Spinner label="Loading cart…" />
  if (error) {
    return (
      <p className="text-sm text-red-700" role="alert">
        {apiErrorMessage(error, 'Could not load your cart.')}
      </p>
    )
  }

  const items = data?.items ?? []
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.unit_price) * item.quantity,
    0,
  )

  if (items.length === 0) {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold text-ink">Your cart</h1>
        <p className="mt-2 text-sm text-muted">Your cart is empty.</p>
        <Link
          to="/"
          className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Browse products
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-ink">Your cart</h1>

      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {items.map((item) => (
          <CartRow key={item.product_id} item={item} />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4">
        <div>
          <p className="text-sm text-muted">Subtotal</p>
          <p className="text-xl font-semibold text-ink">{formatCurrency(subtotal)}</p>
        </div>
        <Link
          to="/checkout"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Proceed to checkout
        </Link>
      </div>
    </div>
  )
}

function CartRow({ item }: { item: CartItem }) {
  const setCartItem = useSetCartItem()
  const removeCartItem = useRemoveCartItem()
  const busy = setCartItem.isPending || removeCartItem.isPending

  const setQty = (quantity: number) =>
    setCartItem.mutate({ productId: item.product_id, quantity })

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="truncate font-medium text-ink">{item.name}</p>
        <p className="text-sm text-muted">{formatCurrency(item.unit_price)} each</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border border-slate-200">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={busy || item.quantity <= 1}
            onClick={() => setQty(item.quantity - 1)}
            className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            −
          </button>
          <span className="min-w-8 text-center text-sm font-medium">{item.quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={busy || item.quantity >= 99}
            onClick={() => setQty(item.quantity + 1)}
            className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            +
          </button>
        </div>

        <span className="w-20 text-right font-semibold text-ink">
          {formatCurrency(Number(item.unit_price) * item.quantity)}
        </span>

        <button
          type="button"
          disabled={busy}
          onClick={() => removeCartItem.mutate(item.product_id)}
          className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-40"
        >
          Remove
        </button>
      </div>
    </div>
  )
}
