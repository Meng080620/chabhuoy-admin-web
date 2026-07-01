import { useId } from 'react'
import { formatRatingCount } from '@/features/catalog/demo'

interface StarRatingProps {
  /** 0–5, halves allowed (e.g. 4.5). */
  stars: number
  count: number
}

/**
 * Compact five-star rating with a review count. Pure SVG so it has no image
 * dependency and renders identically in tests. `aria-label` carries the value
 * for screen readers; the star glyphs are decorative.
 */
export function StarRating({ stars, count }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1" aria-label={`${stars} out of 5 stars, ${count} reviews`}>
      <div className="flex" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, stars - i)) // 0, partial, or 1
          return <Star key={i} fill={fill} />
        })}
      </div>
      <span className="text-xs text-muted">({formatRatingCount(count)})</span>
    </div>
  )
}

function Star({ fill }: { fill: number }) {
  // useId (not a `s-${pct}` string) so same-percentage stars in one rating —
  // or multiple StarRatings on one page — never collide on the DOM id that
  // `url(#…)` resolves against.
  const gradientId = useId()
  const pct = `${Math.round(fill * 100)}%`
  return (
    <svg viewBox="0 0 20 20" className="size-3.5" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId}>
          <stop offset={pct} stopColor="#f59e0b" />
          <stop offset={pct} stopColor="#e2e8f0" />
        </linearGradient>
      </defs>
      <path
        d="M10 1.6l2.47 5 5.53.8-4 3.9.94 5.5L10 14.2l-4.94 2.6.94-5.5-4-3.9 5.53-.8z"
        fill={`url(#${gradientId})`}
      />
    </svg>
  )
}
