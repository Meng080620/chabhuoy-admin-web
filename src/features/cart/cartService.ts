import { api } from '@/lib/api'
import type { Cart } from '@/types/api'

/**
 * Customer cart API. The cart is server-side and auth-scoped (one per user), so
 * every call here rides the bearer token via the axios interceptor.
 *
 * ⚠️ Built to the CORRECTED uuid contract: `productId` is the product **uuid**.
 * The live backend still keys these endpoints on the internal bigint id — see the
 * cart blocker in API_CONTRACT.md. Swap nothing here once the backend aligns.
 */

/** GET /cart — plain `{ items: [...] }`, not data-wrapped. */
export async function getCart(): Promise<Cart> {
  const { data } = await api.get<Cart>('/cart')
  return data
}

/**
 * PUT /cart — upsert a line by absolute quantity (idempotent). Returns just a
 * `{ message }`, so callers refetch/optimistically patch the cart themselves.
 */
export async function setCartItem(productId: string, quantity: number): Promise<void> {
  await api.put('/cart', { product_id: productId, quantity })
}

/** DELETE /cart/{productUuid} — remove a line entirely. */
export async function removeCartItem(productId: string): Promise<void> {
  await api.delete(`/cart/${productId}`)
}
