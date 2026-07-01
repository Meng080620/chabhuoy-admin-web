import { api } from '@/lib/api'
import type { Banner, BannerType } from '@/types/api'
import { bannerSchema, bannersResponseSchema } from './bannerSchemas'

/** Fields an admin edits. `image` is the raw File; everything else is scalar. */
export interface BannerInput {
  type: BannerType
  title: string
  subtitle?: string | null
  link_url?: string | null
  cta_label?: string | null
  position?: number
  is_active?: boolean
  image?: File | null
}

/** GET /banners — active storefront banners, optionally one slot type. */
export async function listBanners(type?: BannerType): Promise<Banner[]> {
  const { data } = await api.get('/banners', { params: type ? { type } : undefined })
  return bannersResponseSchema.parse(data).data
}

/** GET /admin/banners — every banner, active or not, ordered for editing. */
export async function listAdminBanners(): Promise<Banner[]> {
  const { data } = await api.get('/admin/banners')
  return bannersResponseSchema.parse(data).data
}

/**
 * Build multipart form data. Booleans are sent as '1'/'0' because PHP reads
 * multipart values as strings — `false` would otherwise arrive as the truthy
 * string "false". Null/undefined fields are omitted so `nullable` rules pass.
 */
function toFormData(input: BannerInput, method?: 'PUT'): FormData {
  const fd = new FormData()
  fd.append('type', input.type)
  fd.append('title', input.title)
  if (input.subtitle != null) fd.append('subtitle', input.subtitle)
  if (input.link_url != null) fd.append('link_url', input.link_url)
  if (input.cta_label != null) fd.append('cta_label', input.cta_label)
  if (input.position != null) fd.append('position', String(input.position))
  if (input.is_active != null) fd.append('is_active', input.is_active ? '1' : '0')
  if (input.image) fd.append('image', input.image)
  // Laravel method spoofing: PHP only populates uploaded files for POST, so a
  // real PUT would drop the image. POST + _method=PUT keeps the file intact.
  if (method) fd.append('_method', method)
  return fd
}

// The shared axios instance defaults to JSON; unset it so axios detects the
// FormData body and sets `multipart/form-data` with the correct boundary.
const MULTIPART = { headers: { 'Content-Type': undefined } }

export async function createBanner(input: BannerInput): Promise<Banner> {
  const { data } = await api.post('/admin/banners', toFormData(input), MULTIPART)
  return bannerSchema.parse(data.data)
}

export async function updateBanner(id: number, input: BannerInput): Promise<Banner> {
  const { data } = await api.post(`/admin/banners/${id}`, toFormData(input, 'PUT'), MULTIPART)
  return bannerSchema.parse(data.data)
}

export async function deleteBanner(id: number): Promise<void> {
  await api.delete(`/admin/banners/${id}`)
}
