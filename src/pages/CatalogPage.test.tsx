import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Paginated, Product } from '@/types/api'
import * as productService from '@/features/products/productService'
import * as categoryService from '@/features/catalog/categoryService'
import * as bannerService from '@/features/banners/bannerService'
import * as brandStoreService from '@/features/brand-stores/brandStoreService'
import { CatalogPage } from './CatalogPage'

vi.mock('@/features/products/productService')
vi.mock('@/features/catalog/categoryService')
vi.mock('@/features/banners/bannerService')
vi.mock('@/features/brand-stores/brandStoreService')

const page = (products: Product[]): Paginated<Product> => ({
  data: products,
  links: { first: null, last: null, prev: null, next: null },
  meta: {
    current_page: 1,
    from: 1,
    last_page: 1,
    path: '',
    per_page: 12,
    to: products.length,
    total: products.length,
  },
})

const KRAMA: Product = {
  id: 'p1',
  name: 'Silk Krama',
  slug: 'silk-krama',
  description: 'Handwoven',
  price: '24.50',
  stock: 8,
  in_stock: true,
  is_active: true,
  image_url: null,
  created_at: '2026-06-01T00:00:00Z',
}

function renderAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
  return render(<CatalogPage />, { wrapper })
}

describe('CatalogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(productService.listProducts).mockResolvedValue(page([KRAMA]))
    vi.mocked(categoryService.listCategories).mockResolvedValue([])
    // No live banners / brand stores → sections fall back to their demo visuals.
    vi.mocked(bannerService.listBanners).mockResolvedValue([])
    vi.mocked(brandStoreService.listBrandStores).mockResolvedValue([])
  })

  it('renders the landing from the live catalogue with no query', async () => {
    renderAt('/')

    // Lead row renders the real API product, decorated with image + rating.
    await waitFor(() => expect(screen.getByText('Silk Krama')).toBeInTheDocument())
    expect(screen.getByRole('heading', { name: /today's best deals/i })).toBeInTheDocument()
    const card = screen.getByText('Silk Krama').closest('a')!
    expect(card).toHaveAttribute('href', '/products/p1')
    expect(within(card).getByAltText('Silk Krama')).toBeInTheDocument()
    expect(within(card).getByLabelText(/out of 5 stars/i)).toBeInTheDocument()
    // One catalogue-wide page feeds the grouped rows.
    expect(productService.listProducts).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, perPage: 60 }),
    )
    // Trust strip + brand stores prove the full page rendered.
    expect(screen.getByText(/free in-store pickup/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /official brand stores/i })).toBeInTheDocument()
  })

  it('falls back to the demo catalogue when the API has no products', async () => {
    vi.mocked(productService.listProducts).mockResolvedValue(page([]))
    renderAt('/')

    await waitFor(() =>
      expect(screen.getByText('Nike Invincible 3 Premium')).toBeInTheDocument(),
    )
    expect(screen.getByRole('heading', { name: /today's best deals/i })).toBeInTheDocument()
  })

  it('renders an admin-managed hero banner in place of the demo hero', async () => {
    vi.mocked(bannerService.listBanners).mockImplementation(async (type) =>
      type === 'hero'
        ? [
            {
              id: 1,
              type: 'hero',
              title: 'Admin Ramadan Hero',
              subtitle: 'Set from the CMS',
              image_url: 'http://localhost/storage/banners/hero.jpg',
              link_url: 'https://example.com/ramadan',
              cta_label: 'Shop the sale',
              position: 0,
              is_active: true,
            },
            {
              id: 2,
              type: 'hero',
              title: 'Second hero',
              subtitle: null,
              image_url: null,
              link_url: null,
              cta_label: null,
              position: 1,
              is_active: true,
            },
          ]
        : [],
    )

    renderAt('/')

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Admin Ramadan Hero' })).toBeInTheDocument(),
    )
    const link = screen.getByRole('heading', { name: 'Admin Ramadan Hero' }).closest('a')!
    expect(link).toHaveAttribute('href', 'https://example.com/ramadan')
  })

  it('renders live search results, priced and linking to detail, when ?q= is set', async () => {
    renderAt('/?q=krama')

    await waitFor(() => expect(screen.getByText('Silk Krama')).toBeInTheDocument())
    expect(productService.listProducts).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'krama' }),
    )
    const card = screen.getByText('Silk Krama').closest('a')!
    expect(card).toHaveAttribute('href', '/products/p1')
    expect(within(card).getByText('$24.50')).toBeInTheDocument()
  })

  it('shows an empty-state when a search matches nothing', async () => {
    vi.mocked(productService.listProducts).mockResolvedValue(page([]))
    renderAt('/?q=zzz')

    await waitFor(() =>
      expect(screen.getByText(/no products match/i)).toBeInTheDocument(),
    )
  })
})
