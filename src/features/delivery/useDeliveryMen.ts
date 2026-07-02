import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/query/keys'
import type { DeliveryMan, DeliveryManStatus, Paginated } from '@/types/api'
import {
  disburseDeliveryEarning,
  listDeliveryMen,
  updateDeliveryManStatus,
  type ListDeliveryMenParams,
} from './deliveryService'

export function useDeliveryMen(params: ListDeliveryMenParams) {
  return useQuery({
    queryKey: queryKeys.deliveryMen.list({ status: params.status, page: params.page }),
    queryFn: () => listDeliveryMen(params),
    placeholderData: (prev) => prev, // keep the table populated across page/filter changes
  })
}

interface UpdateVars {
  id: string
  status: DeliveryManStatus
}

/**
 * Optimistically flips a rider's status across every cached list, then
 * reconciles on settle. Approve/suspend is an immediate-feedback action, so the
 * table updates before the round-trip; on error we roll back.
 */
export function useUpdateDeliveryManStatus() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: UpdateVars) => updateDeliveryManStatus(id, status),

    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: queryKeys.deliveryMen.all() })

      const snapshots = qc.getQueriesData<Paginated<DeliveryMan>>({
        queryKey: queryKeys.deliveryMen.all(),
      })

      for (const [key, page] of snapshots) {
        if (!page) continue
        qc.setQueryData<Paginated<DeliveryMan>>(key, {
          ...page,
          data: page.data.map((r) => (r.id === id ? { ...r, status } : r)),
        })
      }

      return { snapshots }
    },

    onError: (_err, _vars, context) => {
      context?.snapshots.forEach(([key, page]) => qc.setQueryData(key, page))
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.deliveryMen.all() })
    },
  })
}

/**
 * Disbursing drains the rider's wallet_balance to 0 and writes a ledger row —
 * no optimistic update since the paid amount is server-derived; we invalidate
 * so the wallet column refetches to zero.
 */
export function useDisburseDeliveryEarning() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => disburseDeliveryEarning(id),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.deliveryMen.all() }),
  })
}
