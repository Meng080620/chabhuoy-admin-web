import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { DeliveryCashSettlement, Paginated } from '@/types/api'
import * as deliveryService from '@/features/delivery/deliveryService'
import { DeliveryCashSettlementsPage } from './DeliveryCashSettlementsPage'

vi.mock('@/features/delivery/deliveryService')

const page = (settlements: DeliveryCashSettlement[]): Paginated<DeliveryCashSettlement> => ({
  data: settlements,
  links: { first: null, last: null, prev: null, next: null },
  meta: {
    current_page: 1,
    from: 1,
    last_page: 1,
    path: '',
    per_page: 20,
    to: settlements.length,
    total: settlements.length,
  },
})

const SETTLEMENT: DeliveryCashSettlement = {
  id: 's1',
  delivery_man: { id: 'r1', name: 'Dara Rider' },
  amount: '8.00',
  settled_at: '2026-07-02T09:30:00.000000Z',
  created_at: '2026-07-02T09:30:00.000000Z',
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
  return render(<DeliveryCashSettlementsPage />, { wrapper })
}

describe('DeliveryCashSettlementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the cash-settlement ledger', async () => {
    vi.mocked(deliveryService.listDeliveryCashSettlements).mockResolvedValue(page([SETTLEMENT]))
    renderPage()

    await waitFor(() => expect(screen.getByText('Dara Rider')).toBeInTheDocument())
    expect(screen.getByText('$8.00')).toBeInTheDocument()
  })

  it('shows an empty state when no rider has settled cash yet', async () => {
    vi.mocked(deliveryService.listDeliveryCashSettlements).mockResolvedValue(page([]))
    renderPage()

    await waitFor(() =>
      expect(screen.getByText('No riders have settled cash yet.')).toBeInTheDocument(),
    )
  })
})
