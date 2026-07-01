import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AdminCustomer, Paginated } from '@/types/api'
import * as customerService from '@/features/customers/customerService'
import { CustomersPage } from './CustomersPage'

vi.mock('@/features/customers/customerService')

const page = (customers: AdminCustomer[]): Paginated<AdminCustomer> => ({
  data: customers,
  links: { first: null, last: null, prev: null, next: null },
  meta: {
    current_page: 1,
    from: 1,
    last_page: 1,
    path: '',
    per_page: 20,
    to: customers.length,
    total: customers.length,
  },
})

const SOKHA: AdminCustomer = {
  id: 31,
  name: 'Sokha Pich',
  email: 'sokha@example.com',
  orders_count: 2,
  total_spent: '80.00',
  created_at: '2026-06-30T13:13:55.000000Z',
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
  return render(<CustomersPage />, { wrapper })
}

describe('CustomersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(customerService.listCustomers).mockResolvedValue(page([SOKHA]))
  })

  it('lists customers with realised spend and links to the detail page', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText('Sokha Pich')).toBeInTheDocument())
    expect(screen.getByText('$80.00')).toBeInTheDocument()
    const link = screen.getByText('Sokha Pich').closest('a')
    expect(link).toHaveAttribute('href', '/admin/customers/31')
  })

  it('debounces the search box before querying', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(screen.getByText('Sokha Pich')).toBeInTheDocument())
    vi.mocked(customerService.listCustomers).mockClear()

    await user.type(screen.getByPlaceholderText(/search by name or email/i), 'sokha')

    await waitFor(() =>
      expect(customerService.listCustomers).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'sokha' }),
      ),
    )
  })
})
