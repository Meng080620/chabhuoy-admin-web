import { AxiosError } from 'axios'
import { Link, useParams } from 'react-router-dom'
import { useProduct } from '@/features/products/useProducts'
import { useSetCartItem } from '@/features/cart/useCart'
import type { Product } from '@/types/api'
import { useIsAuthenticated } from '@/store/auth'
import { Spinner } from '@/components/ui/Spinner'
import { formatCurrency, formatNumber } from '@/utils/format'
import { apiErrorMessage } from '@/lib/api'

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>()
  const { data: product, isLoading, error } = useProduct(productId)

  if (isLoading) {
    return <Spinner label="Loading product…" />
  }

  // The API 404s inactive products and suspended vendors' listings — treat that
  // as "not found" rather than a generic error.
  const notFound = error instanceof AxiosError && error.response?.status === 404
  if (error || !product) {
    return (
      <div className="max-w-lg">
        <p className="text-sm text-red-700" role="alert">
          {notFound
            ? 'This product is no longer available.'
            : apiErrorMessage(error, 'Could not load this product.')}
        </p>
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-brand-700">
          ← Back to shop
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <Link to="/" className="text-sm font-medium text-brand-700">
        ← Back to shop
      </Link>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {product.category ? (
          <p className="text-xs uppercase tracking-wide text-muted">
            {product.category.name}
          </p>
        ) : null}
        <h1 className="mt-1 text-2xl font-bold text-ink">{product.name}</h1>
        {product.vendor ? (
          <p className="mt-1 text-sm text-muted">Sold by {product.vendor.name}</p>
        ) : null}

        <p className="mt-4 text-3xl font-semibold text-ink">
          {formatCurrency(product.price)}
        </p>
        <p className="mt-1 text-sm text-muted">
          {product.in_stock
            ? `${formatNumber(product.stock)} in stock`
            : 'Currently out of stock'}
        </p>

        {product.description ? (
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {product.description}
          </p>
        ) : null}

        <div className="mt-6">
          <BuyButton product={product} />
        </div>
      </div>
    </div>
  )
}

/**
 * Buy call-to-action. The server cart is auth-gated, so a signed-out shopper is
 * routed to sign in first. Add-to-cart sends the product **uuid** (corrected
 * contract); it's optimistic, so the header badge moves on click.
 */
function BuyButton({ product }: { product: Product }) {
  const isAuthenticated = useIsAuthenticated()
  const setCartItem = useSetCartItem()

  if (!product.in_stock) {
    return (
      <button
        type="button"
        disabled
        className="w-full rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400 sm:w-auto"
      >
        Out of stock
      </button>
    )
  }

  if (!isAuthenticated) {
    return (
      <Link
        to="/account"
        state={{ from: `/products/${product.id}` }}
        className="inline-block w-full rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-700 sm:w-auto"
      >
        Sign in to buy
      </Link>
    )
  }

  return (
    <div>
      <button
        type="button"
        disabled={setCartItem.isPending}
        onClick={() =>
          setCartItem.mutate({
            productId: product.id,
            quantity: 1,
            product: { name: product.name, unit_price: product.price },
          })
        }
        className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60 sm:w-auto"
      >
        {setCartItem.isPending ? 'Adding…' : 'Add to cart'}
      </button>
      {setCartItem.isSuccess ? (
        <p className="mt-2 text-sm text-green-700" role="status">
          Added to cart. <Link to="/cart" className="font-medium underline">View cart</Link>
        </p>
      ) : setCartItem.isError ? (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {apiErrorMessage(setCartItem.error, 'Could not add to cart.')}
        </p>
      ) : null}
    </div>
  )
}
