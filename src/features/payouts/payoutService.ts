import { api } from '@/lib/api'
import type { Paginated, Payout, Wrapped } from '@/types/api'

export interface ListPayoutsParams {
  vendorId?: string
  page?: number
  perPage?: number
}

/** GET /admin/payouts — disbursement ledger, newest first. */
export async function listPayouts(params: ListPayoutsParams): Promise<Paginated<Payout>> {
  const { data } = await api.get<Paginated<Payout>>('/admin/payouts', {
    params: {
      vendor_id: params.vendorId,
      page: params.page,
      per_page: params.perPage,
    },
  })
  return data
}

/**
 * POST /admin/payouts/{vendor} — drains the vendor's balance to 0, `201`.
 * `{vendor}` binds by uuid. Refuses `422` when the balance is already 0.
 */
export async function disburseVendorPayout(vendorId: string): Promise<Payout> {
  const { data } = await api.post<Wrapped<Payout>>(`/admin/payouts/${vendorId}`)
  return data.data
}
