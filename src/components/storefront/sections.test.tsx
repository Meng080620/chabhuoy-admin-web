import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { Banner } from '@/types/api'
import { HeroPanels } from './sections'

function banner(overrides: Partial<Banner> & { id: number; title: string }): Banner {
  return {
    type: 'hero',
    subtitle: null,
    image_url: null,
    link_url: null,
    cta_label: null,
    position: 0,
    is_active: true,
    ...overrides,
  }
}

function renderHero(banners: Banner[]) {
  return render(
    <MemoryRouter>
      <HeroPanels banners={banners} />
    </MemoryRouter>,
  )
}

/**
 * The dot row implies a carousel — it must actually rotate the featured (lead)
 * slide, not just sit there with the first dot permanently lit.
 */
describe('HeroPanels', () => {
  it('auto-rotates the featured (lead) slide on a timer', () => {
    vi.useFakeTimers()
    const banners = [
      banner({ id: 1, title: 'Slide A' }),
      banner({ id: 2, title: 'Slide B' }),
      banner({ id: 3, title: 'Slide C' }),
    ]
    renderHero(banners)

    // All three titles are visible at once (lead + tall + promo) — the lead
    // slot specifically is what must rotate, so scope to it via testid.
    expect(within(screen.getByTestId('hero-lead')).getByText('Slide A')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(6000)
    })
    expect(within(screen.getByTestId('hero-lead')).getByText('Slide B')).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('jumps straight to a slide when its dot is clicked', () => {
    const banners = [
      banner({ id: 1, title: 'Slide A' }),
      banner({ id: 2, title: 'Slide B' }),
      banner({ id: 3, title: 'Slide C' }),
    ]
    renderHero(banners)

    fireEvent.click(screen.getByRole('button', { name: 'Show slide 3' }))
    expect(within(screen.getByTestId('hero-lead')).getByText('Slide C')).toBeInTheDocument()
  })

  it('does not crash and skips the timer with a single banner', () => {
    vi.useFakeTimers()
    renderHero([banner({ id: 1, title: 'Only slide' })])
    // Only one panel — no `tall` slot exists, so the section renders nothing.
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(20000)
    })
    vi.useRealTimers()
  })
})
