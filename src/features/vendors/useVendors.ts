import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/query/keys'
import type { Paginated, Vendor, VendorStatus } from '@/types/api'
import {
  listVendors,
  updateVendorCommission,
  updateVendorStatus,
  type ListVendorsParams,
} from './vendorService'

export function useVendors(params: ListVendorsParams) {
  return useQuery({
    queryKey: queryKeys.vendors.list({ status: params.status, page: params.page }),
    queryFn: () => listVendors(params),
    placeholderData: (prev) => prev, // keep the table populated across page/filter changes
  })
}

interface UpdateVars {
  id: string
  status: VendorStatus
}

/**
 * Optimistically flips a vendor's status across every cached vendor list, then
 * reconciles on settle. Approving/suspending is an immediate-feedback action,
 * so the table updates before the round-trip; on error we roll back.
 */
export function useUpdateVendorStatus() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: UpdateVars) => updateVendorStatus(id, status),

    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: queryKeys.vendors.all() })

      const snapshots = qc.getQueriesData<Paginated<Vendor>>({
        queryKey: queryKeys.vendors.all(),
      })

      for (const [key, page] of snapshots) {
        if (!page) continue
        qc.setQueryData<Paginated<Vendor>>(key, {
          ...page,
          data: page.data.map((v) => (v.id === id ? { ...v, status } : v)),
        })
      }

      return { snapshots }
    },

    onError: (_err, _vars, context) => {
      context?.snapshots.forEach(([key, page]) => qc.setQueryData(key, page))
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.vendors.all() })
      // A suspended vendor's payout_balance drops out of the dashboard's
      // pending-payouts queue, so the summary must refetch too.
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary() })
    },
  })
}

interface UpdateCommissionVars {
  id: string
  rate: number
}

/**
 * Sets a vendor's take rate. No optimistic update — the new rate only
 * governs future deliveries, so there's nothing on-screen to flip early.
 */
export function useUpdateVendorCommission() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, rate }: UpdateCommissionVars) => updateVendorCommission(id, rate),
    onSuccess: (vendor) => {
      qc.setQueriesData<Paginated<Vendor>>({ queryKey: queryKeys.vendors.all() }, (page) => {
        if (!page) return page
        return { ...page, data: page.data.map((v) => (v.id === vendor.id ? vendor : v)) }
      })
    },
  })
}
