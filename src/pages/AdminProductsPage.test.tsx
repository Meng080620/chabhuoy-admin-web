import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Paginated, Product } from '@/types/api'
import * as productService from '@/features/products/productService'
import { AdminProductsPage } from './AdminProductsPage'

vi.mock('@/features/products/productService')

const page = (products: Product[]): Paginated<Product> => ({
  data: products,
  links: { first: null, last: null, prev: null, next: null },
  meta: {
    current_page: 1,
    from: 1,
    last_page: 1,
    path: '',
    per_page: 20,
    to: products.length,
    total: products.length,
  },
})

const SCARF: Product = {
  id: 'p1',
  name: 'Khmer Silk Scarf',
  slug: 'khmer-silk-scarf',
  description: null,
  price: '24.50',
  stock: 8,
  in_stock: true,
  is_active: true,
  image_url: null,
  category: { id: 14, name: 'Textiles' },
  vendor: { id: 'v1', name: 'Angkor Crafts', status: 'active' },
  created_at: '2026-06-30T13:02:11.000000Z',
}
const LAMP: Product = {
  id: 'p2',
  name: 'Rattan Lamp',
  slug: 'rattan-lamp',
  description: null,
  price: '38.00',
  stock: 0,
  in_stock: false,
  is_active: false,
  image_url: null,
  category: { id: 9, name: 'Home' },
  vendor: { id: 'v2', name: 'Riverside Goods', status: 'active' },
  created_at: '2026-06-29T09:00:00.000000Z',
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return render(<AdminProductsPage />, { wrapper })
}

// Scopes assertions/clicks to the <tr> containing a given product name.
function rowFor(name: string) {
  const cell = screen.getByText(name)
  const row = cell.closest('tr')
  if (!row) throw new Error(`No row for ${name}`)
  return within(row)
}

describe('AdminProductsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(productService.listAdminProducts).mockResolvedValue(page([SCARF, LAMP]))
  })

  it('renders a row per product with vendor, category, and a visibility toggle', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByText('Khmer Silk Scarf')).toBeInTheDocument())

    expect(rowFor('Khmer Silk Scarf').getByText('Angkor Crafts')).toBeInTheDocument()
    expect(rowFor('Khmer Silk Scarf').getByText('Textiles')).toBeInTheDocument()
    expect(rowFor('Khmer Silk Scarf').getByRole('button', { name: 'Disable' })).toBeInTheDocument()
    expect(rowFor('Rattan Lamp').getByRole('button', { name: 'Enable' })).toBeInTheDocument()
  })

  it('disabling a product calls the service and optimistically flips the status', async () => {
    // Hold the request open so the optimistic state stays observable.
    vi.mocked(productService.updateProductVisibility).mockReturnValue(
      new Promise<Product>(() => {}),
    )
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByText('Khmer Silk Scarf')).toBeInTheDocument())
    expect(rowFor('Khmer Silk Scarf').getByText('Active')).toBeInTheDocument()

    await user.click(rowFor('Khmer Silk Scarf').getByRole('button', { name: 'Disable' }))

    expect(productService.updateProductVisibility).toHaveBeenCalledWith('p1', false)
    await waitFor(() =>
      expect(rowFor('Khmer Silk Scarf').getByText('Hidden')).toBeInTheDocument(),
    )
  })

  it('selecting a status filter refetches scoped to that status', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(productService.listAdminProducts).toHaveBeenCalled())
    expect(productService.listAdminProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: undefined, page: 1 }),
    )

    await user.click(screen.getByRole('button', { name: 'inactive' }))

    await waitFor(() =>
      expect(productService.listAdminProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'inactive', page: 1 }),
      ),
    )
  })
})

describe('AdminProductsPage — product image manager', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uploads a chosen image for a product, calling the service with the file', async () => {
    vi.mocked(productService.listAdminProducts).mockResolvedValue(page([SCARF]))
    vi.mocked(productService.uploadProductImage).mockResolvedValue({
      ...SCARF,
      image_url: 'http://localhost/storage/products/new.jpg',
    })
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByText('Khmer Silk Scarf')).toBeInTheDocument())

    await user.click(rowFor('Khmer Silk Scarf').getByRole('button', { name: /image/i }))

    const dialog = screen.getByRole('dialog')
    const file = new File(['x'], 'shoe.jpg', { type: 'image/jpeg' })
    await user.upload(within(dialog).getByLabelText('Choose image file'), file)
    await user.click(within(dialog).getByRole('button', { name: /^upload$/i }))

    expect(productService.uploadProductImage).toHaveBeenCalledWith('p1', file)
  })

  it('removes an existing image via the manager', async () => {
    const withImage: Product = { ...SCARF, image_url: 'http://localhost/storage/products/old.jpg' }
    vi.mocked(productService.listAdminProducts).mockResolvedValue(page([withImage]))
    vi.mocked(productService.removeProductImage).mockResolvedValue({ ...SCARF, image_url: null })
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByText('Khmer Silk Scarf')).toBeInTheDocument())

    await user.click(rowFor('Khmer Silk Scarf').getByRole('button', { name: /image/i }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /remove/i }))

    expect(productService.removeProductImage).toHaveBeenCalledWith('p1')
  })

  it('does not offer removal when the product has no image', async () => {
    vi.mocked(productService.listAdminProducts).mockResolvedValue(page([SCARF]))
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByText('Khmer Silk Scarf')).toBeInTheDocument())
    await user.click(rowFor('Khmer Silk Scarf').getByRole('button', { name: /image/i }))

    expect(within(screen.getByRole('dialog')).queryByRole('button', { name: /remove/i })).toBeNull()
  })
})
