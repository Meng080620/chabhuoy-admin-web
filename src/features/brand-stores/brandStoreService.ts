import { api } from '@/lib/api'
import type { BrandStore } from '@/types/api'
import { brandStoreSchema, brandStoresResponseSchema } from './brandStoreSchemas'

/** Fields an admin edits. `logo` is the raw File; everything else is scalar. */
export interface BrandStoreInput {
  name: string
  caption?: string | null
  link_url?: string | null
  position?: number
  is_active?: boolean
  logo?: File | null
}

/** GET /brand-stores — active brand-store tiles for the homepage. */
export async function listBrandStores(): Promise<BrandStore[]> {
  const { data } = await api.get('/brand-stores')
  return brandStoresResponseSchema.parse(data).data
}

/** GET /admin/brand-stores — every tile, active or not, ordered for editing. */
export async function listAdminBrandStores(): Promise<BrandStore[]> {
  const { data } = await api.get('/admin/brand-stores')
  return brandStoresResponseSchema.parse(data).data
}

function toFormData(input: BrandStoreInput, method?: 'PUT'): FormData {
  const fd = new FormData()
  fd.append('name', input.name)
  if (input.caption != null) fd.append('caption', input.caption)
  if (input.link_url != null) fd.append('link_url', input.link_url)
  if (input.position != null) fd.append('position', String(input.position))
  if (input.is_active != null) fd.append('is_active', input.is_active ? '1' : '0')
  if (input.logo) fd.append('logo', input.logo)
  // POST + _method=PUT: PHP only populates uploaded files for POST.
  if (method) fd.append('_method', method)
  return fd
}

// Unset the JSON default so axios sets multipart with the correct boundary.
const MULTIPART = { headers: { 'Content-Type': undefined } }

export async function createBrandStore(input: BrandStoreInput): Promise<BrandStore> {
  const { data } = await api.post('/admin/brand-stores', toFormData(input), MULTIPART)
  return brandStoreSchema.parse(data.data)
}

export async function updateBrandStore(id: number, input: BrandStoreInput): Promise<BrandStore> {
  const { data } = await api.post(`/admin/brand-stores/${id}`, toFormData(input, 'PUT'), MULTIPART)
  return brandStoreSchema.parse(data.data)
}

export async function deleteBrandStore(id: number): Promise<void> {
  await api.delete(`/admin/brand-stores/${id}`)
}
