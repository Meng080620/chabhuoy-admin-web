import { describe, it, expect } from 'vitest'
import { formatCurrency, formatNumber, formatDate } from './format'

describe('formatCurrency', () => {
  it('coerces the API decimal string to USD with two decimals', () => {
    expect(formatCurrency('24.50')).toBe('$24.50')
    expect(formatCurrency('1234.5')).toBe('$1,234.50')
  })

  it('formats a plain number the same way', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50')
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('renders refunds / negatives with a sign', () => {
    expect(formatCurrency('-5')).toBe('-$5.00')
  })

  it('falls back to $0.00 for null, undefined and non-numeric junk', () => {
    // The whole point of the helper: money cells never render "NaN" or blank.
    expect(formatCurrency(null)).toBe('$0.00')
    expect(formatCurrency(undefined)).toBe('$0.00')
    expect(formatCurrency('not-a-price')).toBe('$0.00')
    expect(formatCurrency('')).toBe('$0.00')
  })
})

describe('formatNumber', () => {
  it('adds thousands separators', () => {
    expect(formatNumber(1234567)).toBe('1,234,567')
  })

  it('treats null/undefined as zero', () => {
    expect(formatNumber(null)).toBe('0')
    expect(formatNumber(undefined)).toBe('0')
  })
})

describe('formatDate', () => {
  it('returns an em dash for null, undefined and unparseable input', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
    expect(formatDate('not-a-date')).toBe('—')
  })

  it('parses the API microsecond ISO timestamp into a real date', () => {
    // Assert the timezone-independent invariant (year present, not the em-dash
    // fallback) rather than a localized time string that would flake across CI TZs.
    const out = formatDate('2026-06-29T12:02:18.000000Z')
    expect(out).not.toBe('—')
    expect(out).toContain('2026')
  })
})
