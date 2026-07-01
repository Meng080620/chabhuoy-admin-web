import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { DashboardSummary, Order, Paginated } from '@/types/api'
import * as dashboardService from '@/features/dashboard/dashboardService'
import * as orderService from '@/features/orders/orderService'
import { DashboardPage } from './DashboardPage'

vi.mock('@/features/dashboard/dashboardService')
vi.mock('@/features/orders/orderService')

const SUMMARY: DashboardSummary = {
  revenue: { captured: '4820.00', today: '320.00' },
  orders: {
    total: 7,
    by_status: { pending: 3, paid: 2, shipped: 1, delivered: 1, cancelled: 0 },
  },
  customers: { total: 13, new_this_week: 4 },
  payouts: { pending_amount: '350.00', pending_count: 2 },
  catalog: {
    low_stock_count: 3,
    top_products: [
      { id: 'p1', name: 'Silk Scarf', revenue: '602.24', units: 4 },
      { id: 'p2', name: 'Rattan Lamp', revenue: '410.00', units: 6 },
    ],
  },
}

const ALL_CLEAR: DashboardSummary = {
  ...SUMMARY,
  orders: { ...SUMMARY.orders, by_status: { ...SUMMARY.orders.by_status, pending: 0 } },
  payouts: { pending_amount: '0.00', pending_count: 0 },
  catalog: { ...SUMMARY.catalog, low_stock_count: 0 },
}

const orderPage = (orders: Order[]): Paginated<Order> => ({
  data: orders,
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, from: 1, last_page: 1, path: '', per_page: 5, to: orders.length, total: orders.length },
})

const ORDER: Order = {
  id: '8c57f393-5265-4165-8cd6-96c12d55e081',
  status: 'paid',
  status_label: 'Paid',
  payment_method: 'card',
  total: '784.93',
  placed_at: '2026-06-29T12:02:18.000000Z',
  customer: { id: 2, name: 'Karelle Cartwright', email: 'k@example.com' },
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
  return render(<DashboardPage />, { wrapper })
}

/** Find the KPI card whose label matches, scope assertions to it. */
function kpi(label: string) {
  const labelEl = screen.getByText(label)
  const card = labelEl.closest('div')
  if (!card) throw new Error(`No card for ${label}`)
  return within(card)
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dashboardService.getDashboardSummary).mockResolvedValue(SUMMARY)
    vi.mocked(orderService.listOrders).mockResolvedValue(orderPage([ORDER]))
  })

  it('shows the KPI rail derived from the one-call dashboard summary', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByText('Gross revenue')).toBeInTheDocument())
    expect(kpi('Gross revenue').getByText('$4,820.00')).toBeInTheDocument()
    expect(kpi('Gross revenue').getByText(/Today: \$320\.00/)).toBeInTheDocument()

    expect(kpi('Orders').getByText('7')).toBeInTheDocument()
    expect(kpi('Orders').getByText(/3 pending/)).toBeInTheDocument()

    expect(kpi('Customers').getByText('13')).toBeInTheDocument()
    expect(kpi('Customers').getByText(/4 new this week/)).toBeInTheDocument()

    // AOV = captured revenue ÷ orders actually captured (paid+shipped+delivered = 4).
    expect(kpi('Avg. order value').getByText('$1,205.00')).toBeInTheDocument()
  })

  it('guards average order value against a zero-captured-order divide', async () => {
    vi.mocked(dashboardService.getDashboardSummary).mockResolvedValue({
      ...SUMMARY,
      revenue: { captured: '0.00', today: '0.00' },
      orders: { total: 0, by_status: { pending: 0, paid: 0, shipped: 0, delivered: 0, cancelled: 0 } },
    })
    renderPage()

    await waitFor(() => expect(screen.getByText('Avg. order value')).toBeInTheDocument())
    expect(kpi('Avg. order value').getByText('$0.00')).toBeInTheDocument()
  })

  it('renders an attention strip that links to the screen that resolves each item', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByText('Pending orders')).toBeInTheDocument())

    const pending = screen.getByText('Pending orders').closest('a')
    expect(pending).toHaveAttribute('href', '/admin/orders')
    expect(within(pending as HTMLElement).getByText('3')).toBeInTheDocument()

    const payouts = screen.getByText('Payouts owed').closest('a')
    expect(payouts).toHaveAttribute('href', '/admin/payouts')
    expect(within(payouts as HTMLElement).getByText('$350.00')).toBeInTheDocument()

    const stock = screen.getByText('Low stock').closest('a')
    expect(stock).toHaveAttribute('href', '/admin/products')
    expect(within(stock as HTMLElement).getByText('3')).toBeInTheDocument()
  })

  it('shows an all-clear state when nothing needs attention', async () => {
    vi.mocked(dashboardService.getDashboardSummary).mockResolvedValue(ALL_CLEAR)
    renderPage()

    await waitFor(() => expect(screen.getByText(/all clear/i)).toBeInTheDocument())
    expect(screen.queryByText('Pending orders')).toBeNull()
  })

  it('renders top products ranked by revenue, linking to the storefront product', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByText('Silk Scarf')).toBeInTheDocument())

    const first = screen.getByText('Silk Scarf').closest('a')
    expect(first).toHaveAttribute('href', '/products/p1')
    expect(within(first as HTMLElement).getByText('$602.24')).toBeInTheDocument()

    const rows = screen.getAllByRole('link', { name: /Silk Scarf|Rattan Lamp/ })
    expect(rows.map((r) => r.textContent)).toEqual([
      expect.stringContaining('Silk Scarf'),
      expect.stringContaining('Rattan Lamp'),
    ])
  })

  it('greets the user and renders the monthly volume chart', async () => {
    renderPage()

    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'Total Volume' })).toBeInTheDocument(),
    )
    expect(screen.getByText(/Welcome back/)).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Avg. Value' })).toBeInTheDocument()
    expect(screen.getByText('Jun')).toBeInTheDocument()
  })

  it('renders a recent-orders feed with customer and total', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByText('Karelle Cartwright')).toBeInTheDocument())
    const row = screen.getByText('Karelle Cartwright').closest('a')
    expect(row).not.toBeNull()
    expect(within(row as HTMLElement).getByText('$784.93')).toBeInTheDocument()
  })
})
