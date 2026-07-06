import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { DeliveryMan, Paginated } from '@/types/api'
import * as deliveryService from '@/features/delivery/deliveryService'
import { RidersPage } from './RidersPage'

vi.mock('@/features/delivery/deliveryService')

const page = (riders: DeliveryMan[]): Paginated<DeliveryMan> => ({
  data: riders,
  links: { first: null, last: null, prev: null, next: null },
  meta: {
    current_page: 1,
    from: 1,
    last_page: 1,
    path: '',
    per_page: 15,
    to: riders.length,
    total: riders.length,
  },
})

const SOKHA: DeliveryMan = {
  id: 'r1',
  name: 'Sokha Rider',
  vehicle_type: 'motorbike',
  status: 'pending',
  is_online: false,
  wallet_balance: '30.00',
  cash_in_hand: '0.00',
}
const DARA: DeliveryMan = {
  id: 'r2',
  name: 'Dara Rider',
  vehicle_type: 'bicycle',
  status: 'active',
  is_online: true,
  wallet_balance: '0.00',
  cash_in_hand: '12.50',
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return render(<RidersPage />, { wrapper })
}

function rowFor(name: string) {
  const cell = screen.getByText(name)
  const row = cell.closest('tr')
  if (!row) throw new Error(`No row for ${name}`)
  return within(row)
}

describe('RidersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(deliveryService.listDeliveryMen).mockResolvedValue(page([SOKHA, DARA]))
  })

  it('renders a row per rider with status and the right status actions', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByText('Sokha Rider')).toBeInTheDocument())
    expect(rowFor('Sokha Rider').getByText('pending')).toBeInTheDocument()
    expect(rowFor('Sokha Rider').getByRole('button', { name: 'Approve' })).toBeInTheDocument()
    expect(rowFor('Dara Rider').getByRole('button', { name: 'Suspend' })).toBeInTheDocument()
  })

  it('approving a pending rider calls the service and optimistically flips status', async () => {
    // Hold the request open so the optimistic state stays observable.
    vi.mocked(deliveryService.updateDeliveryManStatus).mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByText('Sokha Rider')).toBeInTheDocument())
    await user.click(rowFor('Sokha Rider').getByRole('button', { name: 'Approve' }))

    expect(deliveryService.updateDeliveryManStatus).toHaveBeenCalledWith('r1', 'active')
    await waitFor(() => expect(rowFor('Sokha Rider').getByText('active')).toBeInTheDocument())
  })

  it('pays out a rider who has an outstanding wallet balance', async () => {
    vi.mocked(deliveryService.disburseDeliveryEarning).mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByText('Sokha Rider')).toBeInTheDocument())
    await user.click(rowFor('Sokha Rider').getByRole('button', { name: /pay out/i }))

    expect(deliveryService.disburseDeliveryEarning).toHaveBeenCalledWith('r1')
  })

  it('disables pay out for a rider with a zero wallet balance', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByText('Dara Rider')).toBeInTheDocument())
    expect(rowFor('Dara Rider').getByRole('button', { name: /pay out/i })).toBeDisabled()
  })

  it('debounces the search box before querying with the trimmed term', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(screen.getByText('Sokha Rider')).toBeInTheDocument())
    vi.mocked(deliveryService.listDeliveryMen).mockClear()

    await user.type(screen.getByPlaceholderText('Search by name…'), ' Sokha ')

    await waitFor(() =>
      expect(deliveryService.listDeliveryMen).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Sokha' }),
      ),
    )
  })
})
