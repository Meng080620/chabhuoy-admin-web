import { AxiosError } from 'axios'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useProduct, useProducts } from '@/features/products/useProducts'
import { useSetCartItem } from '@/features/cart/useCart'
import type { Product } from '@/types/api'
import { useIsAuthenticated } from '@/store/auth'
import { Spinner } from '@/components/ui/Spinner'
import { formatCurrency, formatNumber } from '@/utils/format'
import { apiErrorMessage } from '@/lib/api'
import { demoRating } from '@/features/catalog/demo'
import { StarRating } from '@/components/storefront/StarRating'
import {
  ProductImage,
  StorefrontProductCard,
} from '@/components/storefront/StorefrontProductCard'

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
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-kram-700">
          ← Back to shop
        </Link>
      </div>
    )
  }

  const rating = demoRating(product.id)

  return (
    <div className="max-w-5xl">
      <Link to="/" className="text-sm font-medium text-kram-700">
        ← Back to shop
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-xl bg-plaster-100">
          <ProductImage product={product} />
        </div>

        <div>
          {product.category ? (
            <p className="text-xs uppercase tracking-wide text-night-600">{product.category.name}</p>
          ) : null}
          <h1 className="mt-1 font-display text-2xl font-bold text-night-900">{product.name}</h1>
          {product.vendor ? (
            <p className="mt-1 text-sm text-night-600">Sold by {product.vendor.name}</p>
          ) : null}

          <div className="mt-2">
            <StarRating stars={rating.stars} count={rating.count} />
          </div>

          <p className="mt-4 text-3xl font-semibold text-night-900">{formatCurrency(product.price)}</p>
          <p className="mt-1 text-sm text-night-600">
            {product.in_stock
              ? `${formatNumber(product.stock)} in stock`
              : 'Currently out of stock'}
          </p>

          {product.description ? (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-night-700">
              {product.description}
            </p>
          ) : null}

          <div className="mt-6">
            {/* key resets the quantity to 1 when navigating between products
                (related-product links change the route param without remounting). */}
            <BuyButton key={product.id} product={product} />
          </div>
        </div>
      </div>

      <RelatedProducts excludeId={product.id} />
    </div>
  )
}

/**
 * "You may also like" — the catalog has no category filter param yet (see
 * API_CONTRACT.md), so this pulls a general page of products rather than
 * true category matches. Honest about what it is: other real catalog items,
 * not a fabricated recommendation engine.
 */
function RelatedProducts({ excludeId }: { excludeId: string }) {
  const { data } = useProducts({ page: 1, perPage: 5 })
  const related = (data?.data ?? []).filter((p) => p.id !== excludeId).slice(0, 4)

  if (related.length === 0) return null

  return (
    <section className="mt-12">
      <h2 className="mb-4 font-display text-lg font-bold text-night-900">You may also like</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {related.map((p) => (
          <StorefrontProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
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
  const [quantity, setQuantity] = useState(1)

  if (!product.in_stock) {
    return (
      <button
        type="button"
        disabled
        className="w-full rounded-lg bg-plaster-100 px-4 py-2.5 text-sm font-semibold text-night-400 sm:w-auto"
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
        className="inline-block w-full rounded-lg bg-kram-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-kram-700 sm:w-auto"
      >
        Sign in to buy
      </Link>
    )
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <div className="flex items-center rounded-lg border border-slate-200">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex size-9 items-center justify-center text-lg font-medium text-slate-600 disabled:opacity-40"
          >
            −
          </button>
          <span
            aria-label="Quantity"
            aria-live="polite"
            className="w-10 text-center text-sm font-semibold text-ink"
          >
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={quantity >= product.stock}
            onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
            className="flex size-9 items-center justify-center text-lg font-medium text-slate-600 disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>
      <button
        type="button"
        disabled={setCartItem.isPending}
        onClick={() =>
          setCartItem.mutate({
            productId: product.id,
            quantity,
            product: { name: product.name, unit_price: product.price },
          })
        }
        className="w-full rounded-lg bg-kram-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-kram-700 disabled:opacity-60 sm:w-auto"
      >
        {setCartItem.isPending ? 'Adding…' : 'Add to cart'}
      </button>
      {setCartItem.isSuccess ? (
        <p className="mt-2 text-sm text-lotus-700" role="status">
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
