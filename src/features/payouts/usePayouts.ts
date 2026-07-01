import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/query/keys'
import { disburseVendorPayout, listPayouts, type ListPayoutsParams } from './payoutService'

export function usePayouts(params: ListPayoutsParams) {
  return useQuery({
    queryKey: queryKeys.payouts.list({ vendorId: params.vendorId, page: params.page }),
    queryFn: () => listPayouts(params),
    placeholderData: (prev) => prev,
  })
}

/**
 * Disbursing drains the vendor's `payout_balance` to 0 and writes a ledger
 * row — three caches move at once: the ledger itself, the vendor's balance
 * (shown on `VendorsPage` too), and the dashboard's pending-payouts KPI.
 */
export function useDisburseVendorPayout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vendorId: string) => disburseVendorPayout(vendorId),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.payouts.all() })
      qc.invalidateQueries({ queryKey: queryKeys.vendors.all() })
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary() })
    },
  })
}
