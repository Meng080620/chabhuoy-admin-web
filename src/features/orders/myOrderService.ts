import { api } from '@/lib/api'
import type { Order, Paginated, Wrapped } from '@/types/api'

/** GET /orders — the signed-in customer's own orders, newest first, paginated. */
export async function listMyOrders(page?: number): Promise<Paginated<Order>> {
  const { data } = await api.get<Paginated<Order>>('/orders', { params: { page } })
  return data
}

/** GET /orders/{uuid} — a single order with its line items loaded. */
export async function getMyOrder(id: string): Promise<Order> {
  const { data } = await api.get<Wrapped<Order>>(`/orders/${id}`)
  return data.data
}
