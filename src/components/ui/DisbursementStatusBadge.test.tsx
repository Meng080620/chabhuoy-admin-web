import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { DisbursementStatusBadge } from './DisbursementStatusBadge'

describe('DisbursementStatusBadge', () => {
  it('colours a completed disbursement green', () => {
    render(<DisbursementStatusBadge status="completed" />)
    expect(screen.getByText('completed').className).toMatch(/emerald/)
  })

  it('colours pending amber and failed red — never a success green', () => {
    const { rerender } = render(<DisbursementStatusBadge status="pending" />)
    expect(screen.getByText('pending').className).toMatch(/amber/)

    rerender(<DisbursementStatusBadge status="failed" />)
    const failed = screen.getByText('failed')
    expect(failed.className).toMatch(/red/)
    expect(failed.className).not.toMatch(/emerald|green/)
  })
})
