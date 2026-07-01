import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AdminCustomerDetail } from '@/types/api'
import * as customerService from '@/features/customers/customerService'
import { CustomerDetailPage } from './CustomerDetailPage'

vi.mock('@/features/customers/customerService')

const SOKHA: AdminCustomerDetail = {
  id: 31,
  name: 'Sokha Pich',
  email: 'sokha@example.com',
  orders_count: 2,
  total_spent: '80.00',
  created_at: '2026-06-30T13:13:55.000000Z',
  recent_orders: [
    {
      id: '8fe15c6b-1111-1111-1111-111111111111',
      status: 'delivered',
      status_label: 'Delivered',
      payment_method: 'card',
      total: '35.00',
      placed_at: '2026-06-30T13:13:55.000000Z',
      shipping: null,
    },
  ],
  addresses: [
    {
      id: '90dfce7c-2222-2222-2222-222222222222',
      label: 'Home',
      recipient_name: 'Dr. Ford Skiles',
      phone: '07629261343',
      line1: '66176 Destiny Drive Suite 319',
      line2: null,
      city: 'Sarahborough',
      postal_code: '76386',
      country: 'KH',
      is_default: false,
    },
  ],
}

function renderPage(id = '31') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/admin/customers/${id}`]}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
  return render(
    <Routes>
      <Route path="/admin/customers/:customerId" element={<CustomerDetailPage />} />
    </Routes>,
    { wrapper },
  )
}

describe('CustomerDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(customerService.getCustomer).mockResolvedValue(SOKHA)
  })

  it('shows profile, lifetime metrics, recent orders, and addresses', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByText('Sokha Pich')).toBeInTheDocument())
    expect(screen.getByText('sokha@example.com')).toBeInTheDocument()
    expect(screen.getByText('$80.00')).toBeInTheDocument()
    expect(screen.getByText(/2 order/)).toBeInTheDocument()

    expect(screen.getByText('Delivered')).toBeInTheDocument()
    expect(screen.getByText('Dr. Ford Skiles')).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('fetches by the numeric id from the route', async () => {
    renderPage('31')
    await waitFor(() => expect(customerService.getCustomer).toHaveBeenCalledWith(31))
  })
})
