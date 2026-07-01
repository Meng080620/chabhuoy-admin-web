import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Order } from '@/types/api'
import { queryKeys } from '@/query/keys'
import * as orderService from './orderService'
import { useCancelOrder } from './useOrders'

vi.mock('./orderService')

const CANCELLED: Order = {
  id: 'o1',
  status: 'cancelled',
  status_label: 'Cancelled',
  payment_method: 'card',
  total: '42.00',
  placed_at: null,
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { wrapper, queryClient }
}

describe('useCancelOrder', () => {
  beforeEach(() => vi.clearAllMocks())

  it('invalidates the order lists AND the dashboard summary once the cancel settles', async () => {
    // Cancelling restocks inventory and shifts paid-order/revenue figures, so
    // both the order lists and the dashboard summary must be refetched.
    vi.mocked(orderService.cancelOrder).mockResolvedValue(CANCELLED)

    const { wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCancelOrder(), { wrapper })

    act(() => {
      result.current.mutate('o1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(orderService.cancelOrder).toHaveBeenCalledWith('o1')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.orders.all() })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.dashboard.summary() })
  })
})
