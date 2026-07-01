import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Payout } from '@/types/api'
import { api } from '@/lib/api'
import { listPayouts, disburseVendorPayout } from './payoutService'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}))

const PAYOUT: Payout = {
  id: 'c5f6e7df-4cc1-49db-a10e-e6c5b46ca524',
  vendor: { id: '42d18c66-93f8-40c3-b7f3-4cb39723189f', name: 'Angkor Crafts' },
  amount: '20.00',
  status: 'completed',
  reference: null,
  processed_at: '2026-06-30T16:54:32.000000Z',
  created_at: '2026-06-30T16:54:32.000000Z',
}

const page = (payouts: Payout[]) => ({
  data: payouts,
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, from: 1, last_page: 1, path: '', per_page: 20, to: payouts.length, total: payouts.length },
})

describe('payoutService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists the ledger, passing a vendor filter through', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: page([PAYOUT]) })

    const result = await listPayouts({ vendorId: PAYOUT.vendor!.id, page: 1, perPage: 20 })

    expect(result.data).toEqual([PAYOUT])
    expect(api.get).toHaveBeenCalledWith('/admin/payouts', {
      params: { vendor_id: PAYOUT.vendor!.id, page: 1, per_page: 20 },
    })
  })

  it('disburses a vendor balance by uuid with no body', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { data: PAYOUT } })

    const result = await disburseVendorPayout(PAYOUT.vendor!.id)

    expect(result).toEqual(PAYOUT)
    expect(api.post).toHaveBeenCalledWith(`/admin/payouts/${PAYOUT.vendor!.id}`)
  })
})
