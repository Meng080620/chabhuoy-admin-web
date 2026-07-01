import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Paginated, Product } from '@/types/api'
import { queryKeys } from '@/query/keys'
import * as productService from './productService'
import { useAdminProducts, useUpdateProductVisibility } from './useProducts'

vi.mock('./productService')

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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { wrapper, queryClient }
}

// Mirrors how AdminProductsPage consumes both hooks against one shared cache.
function renderProductHooks() {
  const { wrapper, queryClient } = createWrapper()
  const { result } = renderHook(
    () => ({ list: useAdminProducts({}), update: useUpdateProductVisibility() }),
    { wrapper },
  )
  return { result, queryClient }
}

describe('useUpdateProductVisibility — optimistic update', () => {
  const SCARF: Product = {
    id: 'p1',
    name: 'Khmer Silk Scarf',
    slug: 'khmer-silk-scarf',
    description: null,
    price: '24.50',
    stock: 8,
    in_stock: true,
    is_active: true,
    created_at: '2026-06-30T13:02:11.000000Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // First load resolves; the post-mutation invalidation refetch HANGS, so
    // rollback (not a server refetch) is the only thing that can restore
    // `is_active: true` after a failed PATCH.
    let call = 0
    vi.mocked(productService.listAdminProducts).mockImplementation(() => {
      call += 1
      return call === 1
        ? Promise.resolve(page([SCARF]))
        : new Promise<Paginated<Product>>(() => {})
    })
  })

  it('rolls back to the pre-mutation visibility when the request fails', async () => {
    let rejectUpdate!: (e: unknown) => void
    vi.mocked(productService.updateProductVisibility).mockReturnValue(
      new Promise<Product>((_resolve, reject) => {
        rejectUpdate = reject
      }),
    )

    const { result } = renderProductHooks()

    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))
    expect(result.current.list.data?.data?.[0]?.is_active).toBe(true)

    act(() => {
      result.current.update.mutate({ id: 'p1', isActive: false })
    })

    await waitFor(() =>
      expect(result.current.list.data?.data?.[0]?.is_active).toBe(false),
    )

    act(() => rejectUpdate(new Error('500 Internal Server Error')))

    await waitFor(() => expect(result.current.update.isError).toBe(true))
    await waitFor(() =>
      expect(result.current.list.data?.data?.[0]?.is_active).toBe(true),
    )
  })

  it('invalidates the admin product list after a visibility change settles', async () => {
    vi.mocked(productService.updateProductVisibility).mockResolvedValue({
      ...SCARF,
      is_active: false,
    })

    const { result, queryClient } = renderProductHooks()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))

    act(() => {
      result.current.update.mutate({ id: 'p1', isActive: false })
    })

    await waitFor(() => expect(result.current.update.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.products.all() })
  })
})
