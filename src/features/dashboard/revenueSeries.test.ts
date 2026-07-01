import { describe, it, expect } from 'vitest'
import type { Order } from '@/types/api'
import { buildRevenueSeries } from './revenueSeries'

const order = (over: Partial<Order>): Order => ({
  id: crypto.randomUUID(),
  status: 'paid',
  status_label: 'Paid',
  payment_method: 'card',
  total: '0.00',
  placed_at: null,
  ...over,
})

describe('buildRevenueSeries', () => {
  // A fixed "now" so day bucketing is deterministic. 2026-06-30 is a Tuesday.
  const now = new Date('2026-06-30T12:00:00Z')

  it('buckets realized revenue by calendar day across the window', () => {
    const series = buildRevenueSeries(
      [
        order({ status: 'paid', total: '100.00', placed_at: '2026-06-30T09:00:00.000000Z' }),
        order({ status: 'delivered', total: '50.00', placed_at: '2026-06-28T22:00:00.000000Z' }),
      ],
      now,
      7,
    )

    expect(series).toHaveLength(7)
    expect(series.at(-1)).toMatchObject({ date: '2026-06-30', value: 100 })
    expect(series.find((p) => p.date === '2026-06-28')?.value).toBe(50)
    // The other five days stay at zero (seeded, not dropped).
    expect(series.filter((p) => p.value === 0)).toHaveLength(5)
  })

  it('excludes pending and cancelled orders from revenue', () => {
    const series = buildRevenueSeries(
      [
        order({ status: 'pending', total: '999.00', placed_at: '2026-06-30T09:00:00Z' }),
        order({ status: 'cancelled', total: '999.00', placed_at: '2026-06-30T09:00:00Z' }),
      ],
      now,
    )
    expect(series.reduce((s, p) => s + p.value, 0)).toBe(0)
  })

  it('ignores orders outside the window and those missing a placed_at', () => {
    const series = buildRevenueSeries(
      [
        order({ status: 'paid', total: '500.00', placed_at: '2026-06-01T09:00:00Z' }), // too old
        order({ status: 'paid', total: '500.00', placed_at: null }), // no date
      ],
      now,
    )
    expect(series.reduce((s, p) => s + p.value, 0)).toBe(0)
  })
})
