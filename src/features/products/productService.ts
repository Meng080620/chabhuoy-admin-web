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
