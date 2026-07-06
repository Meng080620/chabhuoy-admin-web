import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Paginated, Vendor } from '@/types/api'
import { queryKeys } from '@/query/keys'
import * as vendorService from './vendorService'
import { useUpdateVendorCommission, useUpdateVendorStatus, useVendors } from './useVendors'

vi.mock('./vendorService')

const page = (vendors: Vendor[]): Paginated<Vendor> => ({
  data: vendors,
  links: { first: null, last: null, prev: null, next: null },
  meta: {
    current_page: 1,
    from: 1,
    last_page: 1,
    path: '',
    per_page: 15,
    to: vendors.length,
    total: vendors.length,
  },
})

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { wrapper, queryClient }
}

// Renders the read + write hooks against one shared cache, mirroring how a
// VendorsTable consumes them.
function renderVendorHooks() {
  const { wrapper, queryClient } = createWrapper()
  const { result } = renderHook(
    () => ({ list: useVendors({}), update: useUpdateVendorStatus() }),
    { wrapper },
  )
  return { result, queryClient }
}

describe('useUpdateVendorStatus — optimistic update', () => {
  const ACME: Vendor = { id: 'v1', name: 'Acme', status: 'pending' }

  beforeEach(() => {
    vi.clearAllMocks()
    // First load resolves; the post-mutation invalidation refetch HANGS.
    // This isolates rollback: if the only thing that can restore `pending` is
    // a server refetch, the test can't tell whether onError actually rolled
    // back. With the refetch pending forever, onError is the sole mechanism.
    let call = 0
    vi.mocked(vendorService.listVendors).mockImplementation(() => {
      call += 1
      return call === 1
        ? Promise.resolve(page([ACME]))
        : new Promise<Paginated<Vendor>>(() => {})
    })
  })

  it('rolls back to the pre-mutation status when the request fails', async () => {
    // Hold the request open so the optimistic window is observable, then fail it.
    let rejectUpdate!: (e: unknown) => void
    vi.mocked(vendorService.updateVendorStatus).mockReturnValue(
      new Promise<Vendor>((_resolve, reject) => {
        rejectUpdate = reject
      }),
    )

    const { result } = renderVendorHooks()

    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))
    expect(result.current.list.data?.data?.[0]?.status).toBe('pending')

    act(() => {
      result.current.update.mutate({ id: 'v1', status: 'active' })
    })

    // Optimistic: the cached row flips before the round-trip resolves.
    await waitFor(() =>
      expect(result.current.list.data?.data?.[0]?.status).toBe('active'),
    )

    act(() => rejectUpdate(new Error('500 Internal Server Error')))

    // Rollback: onError restores the snapshot captured in onMutate.
    await waitFor(() => expect(result.current.update.isError).toBe(true))
    await waitFor(() =>
      expect(result.current.list.data?.data?.[0]?.status).toBe('pending'),
    )
  })

  it('invalidates the dashboard summary after a status change settles', async () => {
    // A suspended vendor's payout_balance drops out of the dashboard's
    // pending-payouts queue, so the summary must be invalidated too.
    vi.mocked(vendorService.updateVendorStatus).mockResolvedValue({
      ...ACME,
      status: 'active',
    })

    const { result, queryClient } = renderVendorHooks()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))

    act(() => {
      result.current.update.mutate({ id: 'v1', status: 'active' })
    })

    await waitFor(() => expect(result.current.update.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.dashboard.summary(),
    })
  })
})

describe('useUpdateVendorCommission', () => {
  const ACME: Vendor = { id: 'v1', name: 'Acme', status: 'active', commission_rate: '10.00' }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(vendorService.listVendors).mockResolvedValue(page([ACME]))
  })

  it('patches the cached row with the server-returned rate on success', async () => {
    vi.mocked(vendorService.updateVendorCommission).mockResolvedValue({
      ...ACME,
      commission_rate: '15.00',
    })

    const { wrapper } = createWrapper()
    const { result } = renderHook(
      () => ({ list: useVendors({}), update: useUpdateVendorCommission() }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))

    act(() => {
      result.current.update.mutate({ id: 'v1', rate: 15 })
    })

    await waitFor(() => expect(result.current.update.isSuccess).toBe(true))
    expect(vendorService.updateVendorCommission).toHaveBeenCalledWith('v1', 15)
    await waitFor(() =>
      expect(result.current.list.data?.data?.[0]?.commission_rate).toBe('15.00'),
    )
  })
})
