import { describe, it, expect } from 'vitest'
import type { Order } from '@/types/api'
import { buildMonthlySeries } from './revenueSeries'

const order = (over: Partial<Order>): Order => ({
  id: crypto.randomUUID(),
  status: 'paid',
  status_label: 'Paid',
  payment_method: 'card',
  total: '0.00',
  placed_at: null,
  ...over,
})

describe('buildMonthlySeries', () => {
  // Fixed "now" so month bucketing is deterministic.
  const now = new Date('2026-06-15T12:00:00Z')

  it('buckets realized revenue into the trailing 12 calendar months', () => {
    const series = buildMonthlySeries(
      [
        order({ status: 'paid', total: '100.00', placed_at: '2026-06-02T09:00:00Z' }),
        order({ status: 'delivered', total: '300.00', placed_at: '2026-06-20T09:00:00Z' }),
        order({ status: 'shipped', total: '50.00', placed_at: '2026-01-10T09:00:00Z' }),
      ],
      now,
      12,
    )

    expect(series).toHaveLength(12)
    // Window is Jul 2025 → Jun 2026 inclusive; the last bucket is the current month.
    expect(series.at(-1)).toMatchObject({ key: '2026-06', label: 'Jun', volume: 400, count: 2 })
    expect(series.find((p) => p.key === '2026-01')).toMatchObject({ volume: 50, count: 1 })
  })

  it('derives avg as volume / count, and 0 for empty months', () => {
    const series = buildMonthlySeries(
      [
        order({ status: 'paid', total: '100.00', placed_at: '2026-06-01T09:00:00Z' }),
        order({ status: 'paid', total: '200.00', placed_at: '2026-06-02T09:00:00Z' }),
      ],
      now,
    )
    const jun = series.find((p) => p.key === '2026-06')!
    expect(jun.avg).toBe(150) // (100 + 200) / 2
    // A month with no orders reports avg 0, not NaN.
    expect(series.find((p) => p.key === '2025-08')?.avg).toBe(0)
  })

  it('excludes pending/cancelled and orders outside the window', () => {
    const series = buildMonthlySeries(
      [
        order({ status: 'pending', total: '999.00', placed_at: '2026-06-01T09:00:00Z' }),
        order({ status: 'cancelled', total: '999.00', placed_at: '2026-06-01T09:00:00Z' }),
        order({ status: 'paid', total: '999.00', placed_at: '2025-01-01T09:00:00Z' }), // > 12mo old
        order({ status: 'paid', total: '999.00', placed_at: null }), // no date
      ],
      now,
    )
    expect(series.reduce((s, p) => s + p.volume, 0)).toBe(0)
  })
})
