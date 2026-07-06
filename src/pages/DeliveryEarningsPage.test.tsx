import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { DeliveryEarning, Paginated } from '@/types/api'
import * as deliveryService from '@/features/delivery/deliveryService'
import { DeliveryEarningsPage } from './DeliveryEarningsPage'

vi.mock('@/features/delivery/deliveryService')

const page = (earnings: DeliveryEarning[]): Paginated<DeliveryEarning> => ({
  data: earnings,
  links: { first: null, last: null, prev: null, next: null },
  meta: {
    current_page: 1,
    from: 1,
    last_page: 1,
    path: '',
    per_page: 20,
    to: earnings.length,
    total: earnings.length,
  },
})

const EARNING: DeliveryEarning = {
  id: 'e1',
  delivery_man: { id: 'r1', name: 'Sokha Rider' },
  amount: '12.50',
  status: 'completed',
  reference: 'disb_abc123',
  processed_at: '2026-07-01T10:00:00.000000Z',
  created_at: '2026-07-01T10:00:00.000000Z',
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
  return render(<DeliveryEarningsPage />, { wrapper })
}

describe('DeliveryEarningsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the earnings ledger', async () => {
    vi.mocked(deliveryService.listDeliveryEarnings).mockResolvedValue(page([EARNING]))
    renderPage()

    await waitFor(() => expect(screen.getByText('Sokha Rider')).toBeInTheDocument())
    expect(screen.getByText('$12.50')).toBeInTheDocument()
    expect(screen.getByText('completed')).toBeInTheDocument()
    expect(screen.getByText('disb_abc123')).toBeInTheDocument()
  })

  it('shows an empty state when nothing has been paid out yet', async () => {
    vi.mocked(deliveryService.listDeliveryEarnings).mockResolvedValue(page([]))
    renderPage()

    await waitFor(() =>
      expect(screen.getByText('No riders have been paid out yet.')).toBeInTheDocument(),
    )
  })
})
