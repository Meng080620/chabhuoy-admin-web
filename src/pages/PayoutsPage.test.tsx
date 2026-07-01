import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Payout, Vendor } from '@/types/api'
import * as vendorService from '@/features/vendors/vendorService'
import * as payoutService from '@/features/payouts/payoutService'
import { PayoutsPage } from './PayoutsPage'

vi.mock('@/features/vendors/vendorService')
vi.mock('@/features/payouts/payoutService')

const vendorPage = (vendors: Vendor[]) => ({
  data: vendors,
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, from: 1, last_page: 1, path: '', per_page: 100, to: vendors.length, total: vendors.length },
})
const payoutPage = (payouts: Payout[]) => ({
  data: payouts,
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, from: 1, last_page: 1, path: '', per_page: 20, to: payouts.length, total: payouts.length },
})

const ANGKOR: Vendor = { id: 'v1', name: 'Angkor Crafts', status: 'active', payout_balance: '20.00' }
const RIVERSIDE: Vendor = { id: 'v2', name: 'Riverside Goods', status: 'active', payout_balance: '0.00' }

const PAYOUT: Payout = {
  id: 'c5f6e7df-4cc1-49db-a10e-e6c5b46ca524',
  vendor: { id: 'v3', name: 'Old Payout Vendor' },
  amount: '15.00',
  status: 'completed',
  reference: null,
  processed_at: '2026-06-30T16:54:32.000000Z',
  created_at: '2026-06-30T16:54:32.000000Z',
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return render(<PayoutsPage />, { wrapper })
}

describe('PayoutsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(vendorService.listVendors).mockResolvedValue(vendorPage([ANGKOR, RIVERSIDE]))
    vi.mocked(payoutService.listPayouts).mockResolvedValue(payoutPage([PAYOUT]))
  })

  it('lists only vendors with an outstanding balance in the disbursement queue', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText('Angkor Crafts')).toBeInTheDocument())
    expect(screen.queryByText('Riverside Goods')).toBeNull()
  })

  it('disburses a vendor balance when "Pay out" is clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(payoutService.disburseVendorPayout).mockResolvedValue({
      ...PAYOUT,
      vendor: { id: 'v1', name: 'Angkor Crafts' },
      amount: '20.00',
    })
    renderPage()
    await waitFor(() => expect(screen.getByText('Angkor Crafts')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Pay out' }))

    await waitFor(() => expect(payoutService.disburseVendorPayout).toHaveBeenCalledWith('v1'))
  })

  it('surfaces the 422 when a vendor has no outstanding balance', async () => {
    const user = userEvent.setup()
    vi.mocked(payoutService.disburseVendorPayout).mockRejectedValue(
      new AxiosError('Request failed', '422', undefined, undefined, {
        status: 422,
        data: {
          message: 'This vendor has no outstanding balance to pay out.',
          errors: { vendor: ['This vendor has no outstanding balance to pay out.'] },
        },
        statusText: 'Unprocessable Content',
        headers: {},
        // @ts-expect-error -- minimal config stub is enough for AxiosError plumbing
        config: {},
      }),
    )
    renderPage()
    await waitFor(() => expect(screen.getByText('Angkor Crafts')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Pay out' }))

    await waitFor(() =>
      expect(screen.getByText('This vendor has no outstanding balance to pay out.')).toBeInTheDocument(),
    )
  })

  it('renders the payout ledger', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText('Old Payout Vendor')).toBeInTheDocument())
    expect(screen.getByText('$15.00')).toBeInTheDocument()
  })
})
