import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProducts } from '@/features/products/useProducts'
import { useCategories } from '@/features/catalog/useCategories'
import { useBanners } from '@/features/banners/useBanners'
import { useBrandStores } from '@/features/brand-stores/useBrandStores'
import { categoryTiles } from '@/features/catalog/demo'
import { DEMO_SECTIONS, CIRCLE_CATEGORIES } from '@/features/catalog/demoCatalog'
import { buildLandingRows } from '@/features/catalog/landingRows'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { apiErrorMessage } from '@/lib/api'
import { StorefrontProductCard } from '@/components/storefront/StorefrontProductCard'
import {
  HeroPanels,
  CircularCategoryRow,
  ProductRow,
  PromoTrio,
  BrandStores,
  RamadanBanner,
  EcoPromo,
  ServiceBadges,
  Stack,
} from '@/components/storefront/sections'

/**
 * Storefront homepage.
 *
 * With a `?q=` term (from the header search box) it renders a flat, paginated
 * results grid backed by the real `GET /products`. Without one it renders the
 * Emox-style landing page from the live catalogue: one `GET /products` page
 * grouped into category rows ([[landingRows]]), plus live banners, brand
 * stores, and category tiles. Every section keeps a demo fallback
 * ([[demoCatalog]]) so the page never renders empty against a bare backend.
 */
export function CatalogPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''

  return query ? <SearchResults query={query} /> : <Landing />
}

function SearchResults({ query }: { query: string }) {
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching, error } = useProducts({ search: query, page, perPage: 12 })
  const products = data?.data ?? []

  if (error) {
    return (
      <p className="text-sm text-red-700" role="alert">
        {apiErrorMessage(error, 'Could not load products.')}
      </p>
    )
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-xl font-bold text-night-900">Results for “{query}”</h1>
      <p className="mb-6 text-sm text-night-600">
        {data ? `${data.meta.total} product${data.meta.total === 1 ? '' : 's'}` : ' '}
      </p>

      {isLoading ? (
        <Spinner label="Searching…" />
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((p) => (
              <StorefrontProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-plaster-200 bg-white">
            <Pagination meta={data!.meta} onPage={setPage} isFetching={isFetching} />
          </div>
        </>
      ) : (
        <p className="text-sm text-night-600">No products match “{query}”.</p>
      )}
    </div>
  )
}

function Landing() {
  // Live taxonomy → round category tiles; fall back to demo tiles if empty.
  const { data: categories } = useCategories()
  const liveTiles = categoryTiles(categories, 8)
  const tiles = liveTiles.length > 0 ? liveTiles : CIRCLE_CATEGORIES

  // Admin-managed banners per slot. Each section falls back to its demo visual
  // when its slot has no active banner, so the page is never empty.
  const { data: heroBanners } = useBanners('hero')
  const { data: promoBanners } = useBanners('promo')
  const { data: seasonalBanners } = useBanners('seasonal')
  const { data: ecoBanners } = useBanners('eco')
  const { data: brandStores } = useBrandStores()

  // Live catalogue → grouped category rows; demo sections only once the query
  // settles empty (bare backend) — never while loading, so live data doesn't
  // replace a demo flash. One page covers the catalogue at current size.
  const { data: productPage, isPending } = useProducts({ page: 1, perPage: 60 })
  const liveRows = buildLandingRows(productPage?.data ?? [])
  const sections =
    liveRows.length > 0
      ? liveRows
      : isPending
        ? []
        : DEMO_SECTIONS.map((s) => ({ id: s.id, title: s.title, products: s.products }))

  const row = (i: number) => {
    const s = sections[i]
    return s ? <ProductRow key={s.id} title={s.title} products={s.products} /> : null
  }

  return (
    <Stack>
      <HeroPanels banners={heroBanners} />
      <CircularCategoryRow tiles={tiles} />
      {row(0)}
      <PromoTrio banners={promoBanners} />
      {row(1)}
      <BrandStores stores={brandStores} />
      {row(2)}
      <RamadanBanner banner={seasonalBanners?.[0]} />
      {row(3)}
      <EcoPromo banner={ecoBanners?.[0]} />
      {row(4)}
      {row(5)}
      {row(6)}
      <ServiceBadges />
    </Stack>
  )
}
