import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/query/keys'
import { getCustomer, listCustomers, type ListCustomersParams } from './customerService'

export function useCustomers(params: ListCustomersParams) {
  return useQuery({
    queryKey: queryKeys.customers.list({ search: params.search, page: params.page }),
    queryFn: () => listCustomers(params),
    placeholderData: (prev) => prev,
  })
}

export function useCustomer(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id ?? 0),
    queryFn: () => getCustomer(id as number),
    enabled: id !== undefined,
  })
}
