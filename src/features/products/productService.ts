import { api } from '@/lib/api'
import type { Paginated, Product, ProductStatus, Wrapped } from '@/types/api'

export interface ListProductsParams {
  search?: string
  page?: number
  perPage?: number
}

export interface ListAdminProductsParams {
  status?: ProductStatus
  /** Vendor's public uuid — not the internal bigint (see API_CONTRACT.md Priority 2). */
  vendorId?: string
  search?: string
  page?: number
  perPage?: number
}

/** GET /products — public, paginated resource collection. */
export async function listProducts(
  params: ListProductsParams,
): Promise<Paginated<Product>> {
  const { data } = await api.get<Paginated<Product>>('/products', {
    params: {
      search: params.search || undefined,
      page: params.page,
      per_page: params.perPage,
    },
  })
  return data
}

/**
 * GET /products/{uuid} — public single product (category + vendor loaded).
 * `id` is the product's public UUID, not the internal numeric key. The API
 * 404s on inactive products or suspended vendors, so callers must handle it.
 */
export async function getProduct(id: string): Promise<Product> {
  const { data } = await api.get<Wrapped<Product>>(`/products/${id}`)
  return data.data
}

/**
 * GET /admin/products — every vendor's products, ignoring storefront
 * visibility (moderation needs to see disabled/suspended-vendor rows).
 */
export async function listAdminProducts(
  params: ListAdminProductsParams,
): Promise<Paginated<Product>> {
  const { data } = await api.get<Paginated<Product>>('/admin/products', {
    params: {
      status: params.status,
      vendor_id: params.vendorId,
      search: params.search || undefined,
      page: params.page,
      per_page: params.perPage,
    },
  })
  return data
}

/**
 * PATCH /admin/products/{uuid} — visibility toggle only. Price/stock stay the
 * vendor's to edit; the moderator only flips `is_active`.
 */
export async function updateProductVisibility(
  id: string,
  isActive: boolean,
): Promise<Product> {
  const { data } = await api.patch<Wrapped<Product>>(`/admin/products/${id}`, {
    is_active: isActive,
  })
  return data.data
}

// Unsetting Content-Type lets axios detect the FormData body and set
// `multipart/form-data` with the correct boundary (same trick as bannerService).
const MULTIPART = { headers: { 'Content-Type': undefined } }

/**
 * POST /admin/products/{uuid}/image — multipart, field `image` (the raw File).
 * Replaces any existing image server-side. Returns the updated product with its
 * new absolute `image_url`.
 */
export async function uploadProductImage(id: string, image: File): Promise<Product> {
  const fd = new FormData()
  fd.append('image', image)
  const { data } = await api.post<Wrapped<Product>>(`/admin/products/${id}/image`, fd, MULTIPART)
  return data.data
}

/**
 * DELETE /admin/products/{uuid}/image — clears the image (file + column).
 * Idempotent server-side; returns the product with `image_url: null`.
 */
export async function removeProductImage(id: string): Promise<Product> {
  const { data } = await api.delete<Wrapped<Product>>(`/admin/products/${id}/image`)
  return data.data
}
