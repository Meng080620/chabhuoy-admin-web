import { api } from '@/lib/api'
import type { Order, OrderStatus, Paginated, Wrapped } from '@/types/api'

export interface ListOrdersParams {
  status?: OrderStatus
  page?: number
  perPage?: number
}

/** GET /admin/orders — paginated resource collection (items + customer loaded). */
export async function listOrders(params: ListOrdersParams): Promise<Paginated<Order>> {
  const { data } = await api.get<Paginated<Order>>('/admin/orders', {
    params: {
      status: params.status,
      page: params.page,
      per_page: params.perPage,
    },
  })
  return data
}

/**
 * PATCH /admin/orders/{id} — the only admin order action is cancellation.
 * Returns 422 if the order has already shipped/delivered.
 */
export async function cancelOrder(id: string): Promise<Order> {
  const { data } = await api.patch<Wrapped<Order>>(`/admin/orders/${id}`, {
    status: 'cancelled',
  })
  return data.data
}
