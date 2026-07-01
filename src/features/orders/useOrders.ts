import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/query/keys'
import { cancelOrder, listOrders, type ListOrdersParams } from './orderService'

export function useOrders(params: ListOrdersParams) {
  return useQuery({
    queryKey: queryKeys.orders.list({ status: params.status, page: params.page }),
    queryFn: () => listOrders(params),
    placeholderData: (prev) => prev, // keep the table populated across page/filter changes
  })
}

/**
 * Cancels an order. Cancellation restocks inventory and can change the
 * dashboard's paid-orders/revenue figures, so on settle we invalidate every
 * order list and the sales report rather than optimistically patching — the
 * server is the source of truth for the resulting status and stock.
 */
export function useCancelOrder() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => cancelOrder(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.all() })
      // A cancel returns stock and reverses revenue — shifts the dashboard summary.
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary() })
    },
  })
}
