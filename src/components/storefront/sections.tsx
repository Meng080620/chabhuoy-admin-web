import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Banner, BrandStore, Product } from '@/types/api'
import {
  demoImage,
  ECO_TILES,
  HERO_PANELS,
  PROMO_TRIO,
  SERVICE_BADGES,
} from '@/features/catalog/demo'
import { BRAND_STORES } from '@/features/catalog/demoCatalog'
import { StorefrontProductCard } from './StorefrontProductCard'

type CardProduct = Product & { compareAt?: string | null }

/**
 * A banner link may be an internal path or an external URL. Route internal
 * ones through the SPA router; send external ones to a real anchor. Falls back
 * to the storefront root when no link is set.
 */
function BannerLink({
  href,
  className,
  testId,
  children,
}: {
  href: string | null
  className?: string
  testId?: string
  children: ReactNode
}) {
  const to = href ?? '/'
  if (/^https?:\/\//.test(to)) {
    return (
      <a href={to} className={className} data-testid={testId} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  }
  return (
    <Link to={to} className={className} data-testid={testId}>
      {children}
    </Link>
  )
}

/** Circular shift so every panel cycles through every slot, never duplicating. */
function rotate<T>(items: readonly T[], offset: number): T[] {
  if (items.length === 0) return []
  const n = ((offset % items.length) + items.length) % items.length
  return [...items.slice(n), ...items.slice(0, n)]
}

/** Section title with an optional "View all" affordance on the right. */
export function SectionHeader({ title, to }: { title: string; to?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      {to ? (
        <Link to={to} className="text-sm font-medium text-brand-700 hover:underline">
          View all →
        </Link>
      ) : null}
    </div>
  )
}

/** A row of product cards (5-up on desktop). */
export function ProductRow({
  title,
  to,
  products,
}: {
  title: string
  to?: string
  products: CardProduct[]
}) {
  if (products.length === 0) return null
  return (
    <section>
      <SectionHeader title={title} to={to} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {products.map((p) => (
          <StorefrontProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}

/** The visual fields a hero/promo panel needs — shared by demo and live data. */
interface PanelView {
  key: string | number
  title: string
  subtitle: string
  cta: string
  gradient: string
  imageUrl: string | null
  href: string | null
}

const GRADIENTS = [
  'from-brand-600 to-brand-800',
  'from-indigo-600 to-purple-700',
  'from-amber-500 to-orange-600',
  'from-emerald-600 to-teal-700',
  'from-rose-500 to-pink-600',
]

/** Map a live Banner to the panel view; gradient cycles for visual variety. */
function bannerToPanel(b: Banner, i: number): PanelView {
  return {
    key: b.id,
    title: b.title,
    subtitle: b.subtitle ?? '',
    cta: b.cta_label ?? 'Shop now',
    gradient: GRADIENTS[i % GRADIENTS.length]!,
    imageUrl: b.image_url,
    href: b.link_url,
  }
}

/** How long the featured slide holds before auto-advancing to the next one. */
const HERO_ROTATE_MS = 6000

/**
 * Multi-panel promotional hero: a large lead panel + a stacked promo column.
 * Renders admin-managed `hero` banners when present; otherwise the demo panels.
 * The whole panel set rotates on a timer (and via the dots), so every banner
 * gets a turn as the big lead slot instead of always sitting in the same spot.
 */
export function HeroPanels({ banners }: { banners?: Banner[] }) {
  const panels: PanelView[] =
    banners && banners.length > 0
      ? banners.map(bannerToPanel)
      : HERO_PANELS.map((p) => ({
          key: p.id,
          title: p.title,
          subtitle: p.subtitle,
          cta: p.cta,
          gradient: p.gradient,
          imageUrl: null,
          href: null,
        }))

  const [offset, setOffset] = useState(0)

  useEffect(() => {
    if (panels.length <= 1) return
    const timer = setInterval(() => {
      setOffset((o) => (o + 1) % panels.length)
    }, HERO_ROTATE_MS)
    return () => clearInterval(timer)
  }, [panels.length])

  const [lead, tall, ...promos] = rotate(panels, offset)
  // Indexed access is `T | undefined` under noUncheckedIndexedAccess; the layout
  // needs both anchor panels, so bail if the source list is somehow too short.
  if (!lead || !tall) return null
  return (
    <section>
      <div className="grid gap-4 lg:grid-cols-3">
        <HeroPanel
          panel={lead}
          testId="hero-lead"
          className="lg:col-span-2 lg:row-span-2 min-h-[220px]"
        />
        <HeroPanel panel={tall} className="min-h-[150px]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {promos.map((pnl) => (
            <HeroPanel key={pnl.key} panel={pnl} className="min-h-[110px]" compact />
          ))}
        </div>
      </div>
      {panels.length > 1 ? (
        <div className="mt-3 flex justify-center gap-1.5">
          {panels.map((pnl, i) => (
            <button
              key={pnl.key}
              type="button"
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === offset}
              onClick={() => setOffset(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === offset ? 'w-5 bg-brand-600' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}

function HeroPanel({
  panel,
  className = '',
  compact = false,
  testId,
}: {
  panel: PanelView
  className?: string
  compact?: boolean
  testId?: string
}) {
  return (
    <BannerLink
      href={panel.href}
      testId={testId}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white ${panel.gradient} ${className}`}
    >
      {panel.imageUrl ? (
        <>
          <img
            src={panel.imageUrl}
            alt=""
            className="absolute inset-0 size-full object-cover transition group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
        </>
      ) : (
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full border border-white/10" />
      )}
      <div className="relative">
        <h3 className={compact ? 'text-base font-bold' : 'text-xl font-bold sm:text-2xl'}>
          {panel.title}
        </h3>
        {panel.subtitle ? <p className="mt-1 text-xs text-white/85">{panel.subtitle}</p> : null}
      </div>
      <span className="relative mt-3 w-fit rounded-full bg-white/95 px-4 py-1.5 text-xs font-semibold text-ink transition group-hover:bg-white">
        {panel.cta}
      </span>
    </BannerLink>
  )
}

/** "Explore popular categories" — round icon tiles in a single scrollable row. */
export function CircularCategoryRow({
  tiles,
}: {
  // `readonly` so both a mutable list and an `as const` demo array satisfy it —
  // the row only reads/maps the tiles, never mutates them.
  tiles: readonly { id: string | number; label: string; seed: string }[]
}) {
  if (tiles.length === 0) return null
  return (
    <section>
      <SectionHeader title="Explore Popular Categories" to="/" />
      <div className="flex gap-4 overflow-x-auto pb-2">
        {tiles.map((t) => (
          <Link key={t.id} to="/" className="group flex w-24 shrink-0 flex-col items-center gap-2">
            <div className="size-20 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
              <img
                src={demoImage(t.seed, 160)}
                alt=""
                loading="lazy"
                className="size-full object-cover transition group-hover:scale-105"
              />
            </div>
            <span className="line-clamp-1 text-center text-xs font-medium text-slate-700">
              {t.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

/**
 * Three-up mid-page promotional banners. Renders admin-managed `promo` banners
 * when present; otherwise the demo trio.
 */
export function PromoTrio({ banners }: { banners?: Banner[] }) {
  const promos: PanelView[] =
    banners && banners.length > 0
      ? banners.map(bannerToPanel)
      : PROMO_TRIO.map((p) => ({
          key: p.id,
          title: p.title,
          subtitle: p.caption,
          cta: p.cta,
          gradient: p.gradient,
          imageUrl: null,
          href: null,
        }))

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {promos.map((promo) => (
        <BannerLink
          key={promo.key}
          href={promo.href}
          className={`group relative flex min-h-[180px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white ${promo.gradient}`}
        >
          {promo.imageUrl ? (
            <>
              <img
                src={promo.imageUrl}
                alt=""
                className="absolute inset-0 size-full object-cover transition group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
            </>
          ) : null}
          <div className="relative">
            <h3 className="max-w-[10rem] text-xl font-bold leading-tight">{promo.title}</h3>
            {promo.subtitle ? <p className="mt-1 text-xs text-white/85">{promo.subtitle}</p> : null}
          </div>
          <span className="relative w-fit rounded-full bg-black/70 px-4 py-1.5 text-xs font-semibold text-white transition group-hover:bg-black/85">
            {promo.cta}
          </span>
        </BannerLink>
      ))}
    </section>
  )
}

/** The visual fields a brand tile needs — shared by demo and live data. */
interface BrandTile {
  key: string | number
  name: string
  caption: string
  logoUrl: string | null
  href: string | null
}

/**
 * "Explore official brand stores". Renders admin-managed brand stores (with
 * uploaded logos) when present; otherwise the demo text-logo tiles.
 */
export function BrandStores({ stores }: { stores?: BrandStore[] }) {
  const tiles: BrandTile[] =
    stores && stores.length > 0
      ? stores.map((s) => ({
          key: s.id,
          name: s.name,
          caption: s.caption ?? '',
          logoUrl: s.logo_url,
          href: s.link_url,
        }))
      : BRAND_STORES.map((b) => ({
          key: b.name,
          name: b.name,
          caption: b.caption,
          logoUrl: null,
          href: null,
        }))

  return (
    <section>
      <SectionHeader title="Explore Official Brand Stores" to="/" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <BannerLink
            key={t.key}
            href={t.href}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-brand-300 hover:shadow-sm"
          >
            {t.logoUrl ? (
              <img
                src={t.logoUrl}
                alt={t.name}
                className="size-10 shrink-0 rounded-full border border-slate-200 object-contain p-1"
              />
            ) : (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-ink">
                {t.name.slice(0, 2)}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{t.name}</p>
              {t.caption ? <p className="truncate text-xs text-muted">{t.caption}</p> : null}
            </div>
          </BannerLink>
        ))}
      </div>
    </section>
  )
}

/**
 * Seasonal (Ramadan/New-Year) promo band. Uses the first admin-managed
 * `seasonal` banner when present; otherwise the demo copy.
 */
export function RamadanBanner({ banner }: { banner?: Banner }) {
  const title = banner?.title ?? 'Seasonal offers, limited time'
  const subtitle = banner?.subtitle ?? 'Discounts up to 50% across the marketplace.'
  const cta = banner?.cta_label ?? 'Order now'
  return (
    <BannerLink
      href={banner?.link_url ?? null}
      className="group relative flex items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-600 p-8 text-white"
    >
      {banner?.image_url ? (
        <>
          <img
            src={banner.image_url}
            alt=""
            className="absolute inset-0 size-full object-cover transition group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/85 to-emerald-900/40" />
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
        </div>
      )}
      <div className="relative">
        <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
        <p className="mt-2 text-sm text-white/80">{subtitle}</p>
        <span className="mt-5 inline-block rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-emerald-950 transition group-hover:bg-amber-300">
          {cta}
        </span>
      </div>
    </BannerLink>
  )
}

/** Green editorial "shop eco-friendly" band with its own tile strip. */
export function EcoPromo({ banner }: { banner?: Banner }) {
  const title = banner?.title ?? 'Shop eco-friendly, live sustainably'
  const subtitle =
    banner?.subtitle ?? 'Good for you, great for the Earth — explore eco-conscious products.'
  const cta = banner?.cta_label ?? 'Buy eco-friendly'
  return (
    <section className="overflow-hidden rounded-2xl bg-emerald-500 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="max-w-md text-2xl font-bold text-emerald-950">{title}</h2>
          <p className="mt-1 text-sm text-emerald-950/70">{subtitle}</p>
        </div>
        <BannerLink
          href={banner?.link_url ?? null}
          className="hidden shrink-0 rounded-full bg-emerald-950 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 sm:block"
        >
          {cta}
        </BannerLink>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
        {ECO_TILES.map((t) => (
          <Link
            key={t.seed}
            to="/"
            className="group flex flex-col items-center gap-2 rounded-xl bg-white/95 p-2 transition hover:bg-white"
          >
            <div className="aspect-square w-full overflow-hidden rounded-lg bg-emerald-50">
              <img
                src={demoImage(t.seed, 200)}
                alt=""
                loading="lazy"
                className="size-full object-cover transition group-hover:scale-105"
              />
            </div>
            <span className="line-clamp-1 text-center text-xs font-medium text-emerald-950">
              {t.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

/** Trust strip above the footer: pickup / shipping / payment / help. */
export function ServiceBadges() {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {SERVICE_BADGES.map((b) => (
        <div
          key={b.title}
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <CheckBadge />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{b.title}</p>
            <p className="truncate text-xs text-muted">{b.caption}</p>
          </div>
        </div>
      ))}
    </section>
  )
}

function CheckBadge() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
      <path
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Small layout helper so the page can stack sections with consistent spacing. */
export function Stack({ children }: { children: ReactNode }) {
  return <div className="space-y-10">{children}</div>
}
