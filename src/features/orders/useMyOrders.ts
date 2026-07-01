import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/query/keys'
import { useIsAuthenticated } from '@/store/auth'
import { getMyOrder, listMyOrders } from './myOrderService'

/** The signed-in customer's order history. */
export function useMyOrders(page: number) {
  const isAuthenticated = useIsAuthenticated()
  return useQuery({
    queryKey: queryKeys.orders.mine({ page }),
    queryFn: () => listMyOrders(page),
    enabled: isAuthenticated,
    placeholderData: (prev) => prev,
  })
}

/** A single order by uuid — used for the confirmation + detail view. */
export function useMyOrder(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id ?? ''),
    queryFn: () => getMyOrder(id as string),
    enabled: !!id,
  })
}
