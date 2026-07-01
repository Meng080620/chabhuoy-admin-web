import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Category } from '@/types/api'
import * as categoryService from '@/features/categories/categoryService'
import { CategoriesPage } from './CategoriesPage'

vi.mock('@/features/categories/categoryService')

const TREE: Category[] = [
  { id: 1, name: 'Textiles', slug: 'textiles', children: [{ id: 2, name: 'Scarves', slug: 'scarves' }] },
  { id: 3, name: 'Pottery', slug: 'pottery', children: [] },
]

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return render(<CategoriesPage />, { wrapper })
}

describe('CategoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(categoryService.listAdminCategories).mockResolvedValue(TREE)
  })

  it('renders the tree with nested children', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText('Textiles')).toBeInTheDocument())
    expect(screen.getByText('Scarves')).toBeInTheDocument()
    expect(screen.getByText('Pottery')).toBeInTheDocument()
  })

  it('creates a top-level category from the header form', async () => {
    const user = userEvent.setup()
    vi.mocked(categoryService.createCategory).mockResolvedValue({
      id: 7,
      name: 'Khmer Silk',
      slug: 'khmer-silk',
      children: [],
    })
    renderPage()
    await waitFor(() => expect(screen.getByText('Textiles')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'New category' }))
    await user.type(screen.getByLabelText('New category name'), 'Khmer Silk')
    await user.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() =>
      expect(categoryService.createCategory).toHaveBeenCalledWith({
        name: 'Khmer Silk',
        parent_id: null,
      }),
    )
  })

  it('surfaces the 422 guard message when deleting a category that still has products', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(categoryService.deleteCategory).mockRejectedValue(
      new AxiosError('Request failed', '422', undefined, undefined, {
        status: 422,
        data: {
          message: 'Cannot delete a category that still has products. Reassign them first.',
          errors: { category: ['Cannot delete a category that still has products. Reassign them first.'] },
        },
        statusText: 'Unprocessable Content',
        headers: {},
        // @ts-expect-error -- minimal config stub is enough for AxiosError plumbing
        config: {},
      }),
    )
    renderPage()
    await waitFor(() => expect(screen.getByText('Textiles')).toBeInTheDocument())

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]!)

    await waitFor(() =>
      expect(
        screen.getByText('Cannot delete a category that still has products. Reassign them first.'),
      ).toBeInTheDocument(),
    )
  })
})
