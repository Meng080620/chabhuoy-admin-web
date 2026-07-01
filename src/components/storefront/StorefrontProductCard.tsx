import { useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '@/types/api'
import { formatCurrency } from '@/utils/format'
import { demoImage, demoRating } from '@/features/catalog/demo'
import { StarRating } from './StarRating'

/** A real Product, optionally carrying a demo-only "was" price. */
type CardProduct = Product & { compareAt?: string | null }

/**
 * Storefront product card — image, wishlist heart, name, rating, price (with an
 * optional strikethrough original). Image + rating are deterministic demo
 * decoration ([[demo]]); name/price/stock/link are real. The heart is a
 * cosmetic local toggle — there's no wishlist endpoint yet, so it never calls
 * the network and `preventDefault`s so it doesn't trigger the card's navigation.
 */
export function StorefrontProductCard({ product }: { product: CardProduct }) {
  const rating = demoRating(product.id)
  const [saved, setSaved] = useState(false)

  const toggleSave = (e: MouseEvent) => {
    e.preventDefault()
    setSaved((s) => !s)
  }

  return (
    <Link
      to={`/products/${product.id}`}
      className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-3 transition hover:border-brand-300 hover:shadow-md"
    >
      <button
        type="button"
        onClick={toggleSave}
        aria-pressed={saved}
        aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
        className="absolute right-4 top-4 z-10 flex size-7 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-sm transition hover:text-rose-500"
      >
        <HeartIcon filled={saved} />
      </button>

      <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
        <img
          src={demoImage(product.id, 400)}
          alt={product.name}
          loading="lazy"
          className="size-full object-cover transition group-hover:scale-105"
        />
        {!product.in_stock ? (
          <span className="absolute left-2 top-2 rounded-md bg-slate-900/80 px-2 py-0.5 text-xs font-medium text-white">
            Sold out
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 line-clamp-2 text-sm font-medium text-ink group-hover:text-brand-700">
        {product.name}
      </h3>

      <div className="mt-1.5">
        <StarRating stars={rating.stars} count={rating.count} />
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-base font-semibold text-ink">{formatCurrency(product.price)}</span>
        {product.compareAt ? (
          <span className="text-xs text-slate-400 line-through">
            {formatCurrency(product.compareAt)}
          </span>
        ) : null}
      </div>
    </Link>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        d="M12 20s-7-4.35-9.5-8.5A4.5 4.5 0 0112 6a4.5 4.5 0 019.5 5.5C19 15.65 12 20 12 20z"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  )
}
