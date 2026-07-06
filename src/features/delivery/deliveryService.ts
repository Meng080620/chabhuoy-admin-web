import { api } from '@/lib/api'
import type {
  DeliveryEarning,
  DeliveryMan,
  DeliveryManStatus,
  Paginated,
  Wrapped,
} from '@/types/api'

export interface ListDeliveryMenParams {
  status?: DeliveryManStatus
  search?: string
  page?: number
  perPage?: number
}

/** GET /admin/delivery-men — paginated rider list, newest first. `search` is a name partial. */
export async function listDeliveryMen(
  params: ListDeliveryMenParams,
): Promise<Paginated<DeliveryMan>> {
  const { data } = await api.get<Paginated<DeliveryMan>>('/admin/delivery-men', {
    params: {
      status: params.status,
      search: params.search,
      page: params.page,
      per_page: params.perPage,
    },
  })
  return data
}

/** PATCH /admin/delivery-men/{id} — approve/suspend/reactivate. Binds by uuid. */
export async function updateDeliveryManStatus(
  id: string,
  status: DeliveryManStatus,
): Promise<DeliveryMan> {
  const { data } = await api.patch<Wrapped<DeliveryMan>>(`/admin/delivery-men/${id}`, {
    status,
  })
  return data.data
}

/**
 * POST /admin/delivery-earnings/{id} — disburse the rider's wallet balance to 0
 * and record a ledger row, `201`. Refuses `422` when nothing is owed.
 */
export async function disburseDeliveryEarning(id: string): Promise<DeliveryEarning> {
  const { data } = await api.post<Wrapped<DeliveryEarning>>(`/admin/delivery-earnings/${id}`)
  return data.data
}
