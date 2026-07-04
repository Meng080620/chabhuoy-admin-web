import { describe, it, expect } from 'vitest'
import type { Product } from '@/types/api'
import { buildLandingRows } from './landingRows'

let seq = 0
function product(category: string | null): Product {
  seq += 1
  return {
    id: `uuid-${seq}`,
    name: `Product ${seq}`,
    slug: `product-${seq}`,
    description: null,
    price: '10.00',
    stock: 5,
    in_stock: true,
    is_active: true,
    image_url: null,
    category: category ? { id: seq, name: category } : undefined,
    created_at: '2026-07-01T00:00:00Z',
  }
}

describe('buildLandingRows', () => {
  it('returns no rows for an empty catalogue (caller falls back to demo)', () => {
    expect(buildLandingRows([])).toEqual([])
  })

  it('leads with a best-deals row of the newest products, then one row per category', () => {
    const products = [
      ...Array.from({ length: 6 }, () => product('Electronics')),
      ...Array.from({ length: 4 }, () => product('Fashion')),
      ...Array.from({ length: 3 }, () => product('Groceries')),
    ]

    const rows = buildLandingRows(products, 5)

    expect(rows[0]?.id).toBe('best-deals')
    expect(rows[0]?.products).toHaveLength(5)
    // API order (newest first) is preserved for the lead row.
    expect(rows[0]?.products[0]?.id).toBe(products[0]?.id)

    const categoryRows = rows.slice(1)
    expect(categoryRows.map((r) => r.title)).toEqual([
      'Top Deals In Electronics',
      'Style & Fashion',
      'Bestseller In Grocery',
    ])
    expect(categoryRows[0]?.products).toHaveLength(5)
    expect(categoryRows.every((r) => r.products.every((p) => p.category?.name))).toBe(true)
  })

  it('skips categories with fewer than 3 products and products without a category', () => {
    const rows = buildLandingRows([
      ...Array.from({ length: 3 }, () => product('Sneakers')),
      product('Luxury'),
      product(null),
    ])

    expect(rows.map((r) => r.id)).toEqual(['best-deals', 'cat-Sneakers'])
  })

  it('titles unmapped categories generically', () => {
    const rows = buildLandingRows(Array.from({ length: 3 }, () => product('Pet Supplies')))
    expect(rows[1]?.title).toBe('Best In Pet Supplies')
  })
})
