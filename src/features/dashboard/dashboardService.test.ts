import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { DashboardSummary } from '@/types/api'
import { api } from '@/lib/api'
import { getDashboardSummary } from './dashboardService'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}))

const SUMMARY: DashboardSummary = {
  revenue: { captured: '1880.11', today: '1880.11' },
  orders: {
    total: 4,
    by_status: { pending: 1, paid: 2, shipped: 0, delivered: 1, cancelled: 0 },
  },
  customers: { total: 13, new_this_week: 12 },
  payouts: { pending_amount: '350.00', pending_count: 1 },
  catalog: {
    low_stock_count: 1,
    top_products: [{ id: 'p1', name: 'Silk Scarf', revenue: '602.24', units: 4 }],
  },
}

describe('dashboardService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('reads the summary from the plain (unwrapped) admin endpoint', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: SUMMARY })

    const result = await getDashboardSummary()

    expect(result).toEqual(SUMMARY)
    expect(api.get).toHaveBeenCalledWith('/admin/dashboard')
  })

  it('rejects a malformed payload instead of returning bad data silently', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { ...SUMMARY, revenue: { captured: 1880.11 } } })

    await expect(getDashboardSummary()).rejects.toThrow()
  })
})
