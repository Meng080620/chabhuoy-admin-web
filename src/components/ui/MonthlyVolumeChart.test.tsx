import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { MonthlyPoint } from '@/features/dashboard/revenueSeries'
import { MonthlyVolumeChart } from './MonthlyVolumeChart'

const point = (over: Partial<MonthlyPoint>): MonthlyPoint => ({
  label: 'Jan',
  key: '2026-01',
  volume: 0,
  count: 0,
  avg: 0,
  ...over,
})

const DATA: MonthlyPoint[] = [
  point({ label: 'May', key: '2026-05', volume: 2000, count: 4, avg: 500 }),
  point({ label: 'Jun', key: '2026-06', volume: 9000, count: 6, avg: 1500 }),
]

describe('MonthlyVolumeChart', () => {
  it('defaults to Total Volume and spotlights the peak month', () => {
    render(<MonthlyVolumeChart data={DATA} />)

    expect(screen.getByRole('tab', { name: 'Total Volume' })).toHaveAttribute('aria-selected', 'true')
    // Peak (Jun, $9,000) tooltip is shown by default.
    expect(screen.getByText('Volume')).toBeInTheDocument()
    expect(screen.getByText('$9,000.00')).toBeInTheDocument()
  })

  it('switches the bars and tooltip to average order value', async () => {
    const user = userEvent.setup()
    render(<MonthlyVolumeChart data={DATA} />)

    await user.click(screen.getByRole('tab', { name: 'Avg. Value' }))

    expect(screen.getByRole('tab', { name: 'Avg. Value' })).toHaveAttribute('aria-selected', 'true')
    // Peak by avg is still Jun ($1,500); the tooltip relabels and revalues.
    expect(screen.getByText('Avg. value')).toBeInTheDocument()
    expect(screen.getByText('$1,500.00')).toBeInTheDocument()
  })

  it('exposes each bar with an accessible value label', () => {
    render(<MonthlyVolumeChart data={DATA} />)

    expect(screen.getByRole('button', { name: 'May: $2,000.00' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Jun: $9,000.00' })).toBeInTheDocument()
  })
})
