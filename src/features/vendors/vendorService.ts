import { api } from '@/lib/api'
import type { Paginated, Vendor, VendorStatus, Wrapped } from '@/types/api'

export interface ListVendorsParams {
  status?: VendorStatus
  page?: number
  perPage?: number
}

/** GET /admin/vendors — paginated resource collection. */
export async function listVendors(
  params: ListVendorsParams,
): Promise<Paginated<Vendor>> {
  const { data } = await api.get<Paginated<Vendor>>('/admin/vendors', {
    params: {
      status: params.status,
      page: params.page,
      per_page: params.perPage,
    },
  })
  return data
}

/** PATCH /admin/vendors/{id} — single resource, wrapped in `data`. */
export async function updateVendorStatus(
  id: string,
  status: VendorStatus,
): Promise<Vendor> {
  const { data } = await api.patch<Wrapped<Vendor>>(`/admin/vendors/${id}`, {
    status,
  })
  return data.data
}
