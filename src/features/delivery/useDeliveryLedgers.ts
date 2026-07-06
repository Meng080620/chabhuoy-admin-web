import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/query/keys'
import {
  listDeliveryCashSettlements,
  listDeliveryEarnings,
  type ListDeliveryCashSettlementsParams,
  type ListDeliveryEarningsParams,
} from './deliveryService'

export function useDeliveryEarnings(params: ListDeliveryEarningsParams) {
  return useQuery({
    queryKey: queryKeys.deliveryEarnings.list({
      deliveryManId: params.deliveryManId,
      page: params.page,
      perPage: params.perPage,
    }),
    queryFn: () => listDeliveryEarnings(params),
    placeholderData: (prev) => prev,
  })
}

export function useDeliveryCashSettlements(params: ListDeliveryCashSettlementsParams) {
  return useQuery({
    queryKey: queryKeys.deliveryCashSettlements.list({
      deliveryManId: params.deliveryManId,
      page: params.page,
      perPage: params.perPage,
    }),
    queryFn: () => listDeliveryCashSettlements(params),
    placeholderData: (prev) => prev,
  })
}
