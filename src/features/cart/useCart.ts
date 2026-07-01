import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/query/keys'
import { useIsAuthenticated } from '@/store/auth'
import type { Cart } from '@/types/api'
import { getCart, removeCartItem, setCartItem } from './cartService'

/** The server cart for the signed-in user. Idle (no request) when signed out. */
export function useCart() {
  const isAuthenticated = useIsAuthenticated()
  return useQuery({
    queryKey: queryKeys.cart.current(),
    queryFn: getCart,
    enabled: isAuthenticated,
  })
}

/** Total item count across lines — for the header badge. 0 when empty/unloaded. */
export function useCartCount(): number {
  const { data } = useCart()
  return data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0
}

interface SetCartItemVars {
  productId: string
  quantity: number
  /**
   * Optional product snapshot so a brand-new line renders immediately; without
   * it we can only optimistically adjust an existing line's quantity and let the
   * refetch fill in a new one.
   */
  product?: { name: string; unit_price: string | number }
}

/**
 * Upsert a cart line. Optimistic because add-to-cart is an immediate-feedback
 * action — the badge/cart should move the instant the user clicks, then settle
 * against the server. Rolls back on error; always reconciles on settle.
 */
export function useSetCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, quantity }: SetCartItemVars) =>
      setCartItem(productId, quantity),
    onMutate: async ({ productId, quantity, product }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.current() })
      const previous = queryClient.getQueryData<Cart>(queryKeys.cart.current())

      queryClient.setQueryData<Cart>(queryKeys.cart.current(), (old) => {
        const items = old?.items ?? []
        const exists = items.some((i) => i.product_id === productId)
        if (exists) {
          return {
            items: items.map((i) =>
              i.product_id === productId ? { ...i, quantity } : i,
            ),
          }
        }
        if (!product) return old ?? { items }
        return {
          items: [
            ...items,
            { product_id: productId, name: product.name, quantity, unit_price: product.unit_price },
          ],
        }
      })

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.cart.current(), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.current() })
    },
  })
}

/** Remove a line entirely. Optimistic for the same immediate-feedback reason. */
export function useRemoveCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productId: string) => removeCartItem(productId),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.current() })
      const previous = queryClient.getQueryData<Cart>(queryKeys.cart.current())

      queryClient.setQueryData<Cart>(queryKeys.cart.current(), (old) => ({
        items: (old?.items ?? []).filter((i) => i.product_id !== productId),
      }))

      return { previous }
    },
    onError: (_err, _productId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.cart.current(), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.current() })
    },
  })
}
