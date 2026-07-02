import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Paginated, Product } from '@/types/api'
import * as productService from '@/features/products/productService'
import { ProductDetailPage } from './ProductDetailPage'

vi.mock('@/features/products/productService')

const CHARM_BRACELET: Product = {
  id: 'p-charm',
  name: 'I Love My Pet Charm Bracelet',
  slug: 'i-love-my-pet-charm-bracelet',
  description: 'Exclusively handmade with antique gold charms.',
  price: '25.00',
  stock: 10,
  in_stock: true,
  is_active: true,
  image_url: null,
  category: { id: 1, name: 'Jewelry' },
  vendor: { id: 'v-ama', name: 'AMA Animal Rescue', status: 'active' },
  created_at: '2026-06-01T00:00:00Z',
}

const OTHER_PRODUCTS: Product[] = [
  CHARM_BRACELET,
  { ...CHARM_BRACELET, id: 'p-other-1', name: 'Cat Collar Charm' },
  { ...CHARM_BRACELET, id: 'p-other-2', name: 'Dog Tag Necklace' },
  { ...CHARM_BRACELET, id: 'p-other-3', name: 'Paw Print Earrings' },
  { ...CHARM_BRACELET, id: 'p-other-4', name: 'Rescue Ribbon Pin' },
  { ...CHARM_BRACELET, id: 'p-other-5', name: 'Kitten Bandana' },
]

const page = (products: Product[]): Paginated<Product> => ({
  data: products,
  links: { first: null, last: null, prev: null, next: null },
  meta: {
    current_page: 1,
    from: 1,
    last_page: 1,
    path: '',
    per_page: 5,
    to: products.length,
    total: products.length,
  },
})

function renderAt(productId: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/products/${productId}`]}>
        <Routes>
          <Route path="/products/:productId" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
  return render(<ProductDetailPage />, { wrapper })
}

describe('ProductDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(productService.getProduct).mockResolvedValue(CHARM_BRACELET)
    vi.mocked(productService.listProducts).mockResolvedValue(page(OTHER_PRODUCTS))
  })

  it('renders the product image, rating, price and stock', async () => {
    renderAt('p-charm')

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'I Love My Pet Charm Bracelet' })).toBeInTheDocument(),
    )
    expect(screen.getByAltText('I Love My Pet Charm Bracelet')).toBeInTheDocument()
    expect(screen.getByLabelText(/out of 5 stars/i)).toBeInTheDocument()
    expect(screen.getByText('$25.00')).toBeInTheDocument()
    expect(screen.getByText(/10 in stock/i)).toBeInTheDocument()
  })

  it('shows "You may also like" with other products, excluding the current one', async () => {
    renderAt('p-charm')

    await waitFor(() => expect(screen.getByText('Cat Collar Charm')).toBeInTheDocument())
    const section = screen.getByRole('heading', { name: /you may also like/i }).closest('section')!
    const within_ = within(section)
    expect(within_.getByText('Cat Collar Charm')).toBeInTheDocument()
    expect(within_.getByText('Dog Tag Necklace')).toBeInTheDocument()
    expect(within_.getByText('Paw Print Earrings')).toBeInTheDocument()
    // The current product must not recommend itself.
    expect(within_.queryByText('I Love My Pet Charm Bracelet')).not.toBeInTheDocument()
    expect(within_.getByText('Rescue Ribbon Pin')).toBeInTheDocument()
    // Capped at 4 related items.
    expect(within_.queryByText('Kitten Bandana')).not.toBeInTheDocument()
  })
})
