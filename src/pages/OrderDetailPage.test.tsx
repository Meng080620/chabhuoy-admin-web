import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Order } from '@/types/api'
import * as myOrderService from '@/features/orders/myOrderService'
import { OrderDetailPage } from './OrderDetailPage'

vi.mock('@/features/orders/myOrderService')

const BASE_ORDER: Order = {
  id: '2ee920f7-1111-1111-1111-111111111111',
  status: 'shipped',
  status_label: 'Shipped',
  payment_method: 'card',
  total: '362.01',
  placed_at: '2026-07-01T10:00:00.000000Z',
  shipping: null,
  items: [{ product_name: 'Rattan Basket', quantity: 3, unit_price: '120.67', line_total: '350.00', status: 'shipped' }],
}

function renderPage(order: Order) {
  vi.mocked(myOrderService.getMyOrder).mockResolvedValue(order)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/orders/${order.id}`]}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
  return render(
    <Routes>
      <Route path="/orders/:orderId" element={<OrderDetailPage />} />
    </Routes>,
    { wrapper },
  )
}

describe('OrderDetailPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders line items and total for an order with no shipments', async () => {
    renderPage(BASE_ORDER)
    await waitFor(() => expect(screen.getByText('Rattan Basket', { exact: false })).toBeInTheDocument())
    expect(screen.getByText('$350.00')).toBeInTheDocument()
    expect(screen.getByText('$362.01')).toBeInTheDocument()
    expect(screen.queryByText('Tracking')).toBeNull()
  })

  it('shows carrier and tracking number per parcel, naming the shipping vendor', async () => {
    renderPage({
      ...BASE_ORDER,
      shipments: [
        {
          carrier: 'J&T Express',
          tracking_number: 'JT-998877',
          shipped_at: '2026-07-01T11:00:00.000000Z',
          vendor: { id: 'v1', name: 'Angkor Crafts' },
        },
      ],
    })

    await waitFor(() => expect(screen.getByText('Tracking')).toBeInTheDocument())
    expect(screen.getByText(/Angkor Crafts/)).toBeInTheDocument()
    expect(screen.getByText('J&T Express')).toBeInTheDocument()
    expect(screen.getByText('JT-998877')).toBeInTheDocument()
  })

  it('labels a parcel without a carrier name, since it is nullable', async () => {
    renderPage({
      ...BASE_ORDER,
      shipments: [
        {
          carrier: null,
          tracking_number: 'JT-000111',
          shipped_at: '2026-07-01T11:00:00.000000Z',
          vendor: { id: 'v1', name: 'Angkor Crafts' },
        },
      ],
    })

    await waitFor(() => expect(screen.getByText('JT-000111')).toBeInTheDocument())
    expect(screen.getByText('Carrier not set')).toBeInTheDocument()
  })

  it('renders multiple parcels for a multi-vendor order, each attributed to its vendor', async () => {
    renderPage({
      ...BASE_ORDER,
      shipments: [
        {
          carrier: 'J&T Express',
          tracking_number: 'JT-1',
          shipped_at: '2026-07-01T11:00:00.000000Z',
          vendor: { id: 'v1', name: 'Angkor Crafts' },
        },
        {
          carrier: 'DHL',
          tracking_number: 'DHL-2',
          shipped_at: '2026-07-01T12:00:00.000000Z',
          vendor: { id: 'v2', name: 'Riverside Goods' },
        },
      ],
    })

    await waitFor(() => expect(screen.getByText(/Angkor Crafts/)).toBeInTheDocument())
    expect(screen.getByText(/Riverside Goods/)).toBeInTheDocument()
    expect(screen.getByText('JT-1')).toBeInTheDocument()
    expect(screen.getByText('DHL-2')).toBeInTheDocument()
  })
})
