import { describe, it, expect } from 'vitest'
import { hashString, demoImage, demoRating, formatRatingCount } from './demo'

describe('demo presentation helpers', () => {
  it('hashString is deterministic and non-negative', () => {
    expect(hashString('p1')).toBe(hashString('p1'))
    expect(hashString('p1')).not.toBe(hashString('p2'))
    expect(hashString('anything')).toBeGreaterThanOrEqual(0)
  })

  it('demoImage is stable per seed and url-encodes it', () => {
    expect(demoImage('p1')).toBe(demoImage('p1'))
    expect(demoImage('a b')).toContain('a%20b')
    expect(demoImage('p1', 200)).toContain('/200/200')
  })

  it('demoRating stays in the 3.5–5.0 band with a plausible count', () => {
    for (const seed of ['p1', 'p2', 'silk-krama', 'palm-sugar', '']) {
      const { stars, count } = demoRating(seed)
      expect(stars).toBeGreaterThanOrEqual(3.5)
      expect(stars).toBeLessThanOrEqual(5.0)
      // one decimal place, never a float artifact like 4.300000001
      expect(Math.round(stars * 10)).toBe(stars * 10)
      expect(count).toBeGreaterThanOrEqual(12)
      expect(count).toBeLessThan(912)
    }
  })

  it('formatRatingCount abbreviates thousands', () => {
    expect(formatRatingCount(950)).toBe('950')
    expect(formatRatingCount(1200)).toBe('1.2k')
    expect(formatRatingCount(12)).toBe('12')
  })
})
