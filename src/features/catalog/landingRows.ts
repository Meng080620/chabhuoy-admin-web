import type { Product } from '@/types/api'

export interface LandingRow {
  id: string
  title: string
  products: Product[]
}

/** Marketing titles for the categories the storefront design was built around. */
const CATEGORY_TITLES: Record<string, string> = {
  Electronics: 'Top Deals In Electronics',
  Fashion: 'Style & Fashion',
  Groceries: 'Bestseller In Grocery',
  'Health & Beauty': 'Best Sellers In Beauty & Health',
  'Home Decor': 'Bestsellers In Home Appliances',
  Luxury: 'Luxury Picks',
  Sneakers: 'Trending Sneakers',
}

/** Only categories with enough products to fill a meaningful row get one. */
const MIN_ROW_PRODUCTS = 3

/**
 * Build the landing page's product rows from the live catalogue: a lead
 * "best deals" row (API order — newest first), then one row per category,
 * largest categories first. Client-side grouping is deliberate: the public
 * `GET /products` has no category filter yet (see API_CONTRACT.md), and one
 * page covers the whole catalogue at its current size. When the catalogue
 * outgrows a single page, replace this with a backend `?category=` filter
 * rather than raising `perPage`.
 */
export function buildLandingRows(products: Product[], perRow = 5): LandingRow[] {
  if (products.length === 0) return []

  const rows: LandingRow[] = [
    { id: 'best-deals', title: "Today's Best Deals For You!", products: products.slice(0, perRow) },
  ]

  const byCategory = new Map<string, Product[]>()
  for (const p of products) {
    const name = p.category?.name
    if (!name) continue
    const group = byCategory.get(name)
    if (group) group.push(p)
    else byCategory.set(name, [p])
  }

  const grouped = [...byCategory.entries()]
    .filter(([, group]) => group.length >= MIN_ROW_PRODUCTS)
    .sort((a, b) => b[1].length - a[1].length)

  for (const [name, group] of grouped) {
    rows.push({
      id: `cat-${name}`,
      title: CATEGORY_TITLES[name] ?? `Best In ${name}`,
      products: group.slice(0, perRow),
    })
  }

  return rows
}
