import { api } from '@/lib/api'
import type { Order, PlaceOrderInput, Wrapped } from '@/types/api'

/**
 * POST /orders — place an order from the server cart. Body carries the chosen
 * payment method and the shipping address (uuid, per the corrected contract).
 * Returns the created order wrapped in `{ data, message }`; the cart is cleared
 * server-side as a side effect.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  const { data } = await api.post<Wrapped<Order>>('/orders', input)
  return data.data
}
