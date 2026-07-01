import { api } from '@/lib/api'
import type { AdminCustomer, AdminCustomerDetail, Paginated, Wrapped } from '@/types/api'

export interface ListCustomersParams {
  search?: string
  page?: number
  perPage?: number
}

/** GET /admin/customers — role=customer only, newest first, paginated. */
export async function listCustomers(params: ListCustomersParams): Promise<Paginated<AdminCustomer>> {
  const { data } = await api.get<Paginated<AdminCustomer>>('/admin/customers', {
    params: {
      search: params.search,
      page: params.page,
      per_page: params.perPage,
    },
  })
  return data
}

/** GET /admin/customers/{id} — profile + lifetime metrics + recent orders + addresses. */
export async function getCustomer(id: number): Promise<AdminCustomerDetail> {
  const { data } = await api.get<Wrapped<AdminCustomerDetail>>(`/admin/customers/${id}`)
  return data.data
}
