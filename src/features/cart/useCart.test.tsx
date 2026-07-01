import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Cart } from '@/types/api'
import { queryKeys } from '@/query/keys'
import * as cartService from './cartService'
import { useSetCartItem, useRemoveCartItem } from './useCart'

vi.mock('./cartService')

function createWrapper(seed?: Cart) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  if (seed) queryClient.setQueryData(queryKeys.cart.current(), seed)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { wrapper, queryClient }
}

const EXISTING: Cart = {
  items: [{ product_id: 'u1', name: 'Silk Krama', quantity: 1, unit_price: '24.50' }],
}

describe('useSetCartItem', () => {
  beforeEach(() => vi.clearAllMocks())

  it('optimistically adds a brand-new line by uuid before the request settles', async () => {
    // Hold the request open so the optimistic state is observable.
    vi.mocked(cartService.setCartItem).mockReturnValue(new Promise<void>(() => {}))
    const { wrapper, queryClient } = createWrapper({ items: [] })

    const { result } = renderHook(() => useSetCartItem(), { wrapper })

    act(() => {
      result.current.mutate({
        productId: 'u9',
        quantity: 2,
        product: { name: 'Palm Sugar', unit_price: '3.00' },
      })
    })

    await waitFor(() => {
      const cart = queryClient.getQueryData<Cart>(queryKeys.cart.current())
      expect(cart?.items).toEqual([
        { product_id: 'u9', name: 'Palm Sugar', quantity: 2, unit_price: '3.00' },
      ])
    })
    // Sends the uuid, not an internal id.
    expect(cartService.setCartItem).toHaveBeenCalledWith('u9', 2)
  })

  it('rolls back to the previous cart when the request fails', async () => {
    vi.mocked(cartService.setCartItem).mockRejectedValue(new Error('500'))
    const { wrapper, queryClient } = createWrapper(EXISTING)

    const { result } = renderHook(() => useSetCartItem(), { wrapper })

    act(() => {
      result.current.mutate({ productId: 'u1', quantity: 5 })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    const cart = queryClient.getQueryData<Cart>(queryKeys.cart.current())
    expect(cart?.items[0]?.quantity).toBe(1) // restored, not the optimistic 5
  })
})

describe('useRemoveCartItem', () => {
  beforeEach(() => vi.clearAllMocks())

  it('optimistically drops the line and invalidates the cart on settle', async () => {
    vi.mocked(cartService.removeCartItem).mockResolvedValue()
    const { wrapper, queryClient } = createWrapper(EXISTING)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useRemoveCartItem(), { wrapper })

    act(() => {
      result.current.mutate('u1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(cartService.removeCartItem).toHaveBeenCalledWith('u1')
    expect(queryClient.getQueryData<Cart>(queryKeys.cart.current())?.items).toEqual([])
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.cart.current() })
  })
})
