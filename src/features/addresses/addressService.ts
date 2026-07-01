import { api } from '@/lib/api'
import type { Address, CreateAddressInput, Wrapped } from '@/types/api'

/** GET /addresses — non-paginated collection, default-first. `{ data: [...] }`. */
export async function listAddresses(): Promise<Address[]> {
  const { data } = await api.get<Wrapped<Address[]>>('/addresses')
  return data.data
}

/** POST /addresses — creates an address (201). First one is auto-default. */
export async function createAddress(input: CreateAddressInput): Promise<Address> {
  const { data } = await api.post<Wrapped<Address>>('/addresses', input)
  return data.data
}

/** PATCH /addresses/{uuid}/default — promote to default (binds by uuid). */
export async function setDefaultAddress(id: string): Promise<Address> {
  const { data } = await api.patch<Wrapped<Address>>(`/addresses/${id}/default`)
  return data.data
}
