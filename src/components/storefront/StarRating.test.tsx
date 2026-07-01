import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { StarRating } from './StarRating'

describe('StarRating', () => {
  it('gives every gradient a unique id even when stars share the same fill percentage', () => {
    // All 5 stars are fully filled at stars=5, so every gradient computes the
    // same 100% offset — a naive `s-${pct}` id collides across all of them.
    const { container } = render(<StarRating stars={5} count={12} />)
    const ids = Array.from(container.querySelectorAll('linearGradient')).map((el) => el.id)

    expect(ids).toHaveLength(5)
    expect(new Set(ids).size).toBe(5)
  })
})
