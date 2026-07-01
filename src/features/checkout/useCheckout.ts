import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/query/keys'
import type { Cart } from '@/types/api'
import { placeOrder } from './checkoutService'

/**
 * Place the order. On success the server has emptied the cart and created the
 * order, so we mirror that locally (cart → empty) and invalidate "my orders".
 * Navigation to the confirmation page is the caller's job (it has the new id).
 */
export function usePlaceOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: placeOrder,
    onSuccess: () => {
      queryClient.setQueryData<Cart>(queryKeys.cart.current(), { items: [] })
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() })
    },
  })
}
