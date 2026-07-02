import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/query/keys'
import type { Paginated, Product } from '@/types/api'
import {
  getProduct,
  listAdminProducts,
  listProducts,
  removeProductImage,
  updateProductVisibility,
  uploadProductImage,
  type ListAdminProductsParams,
  type ListProductsParams,
} from './productService'

export function useProducts(params: ListProductsParams) {
  return useQuery({
    queryKey: queryKeys.products.list({ search: params.search, page: params.page }),
    queryFn: () => listProducts(params),
    placeholderData: (prev) => prev,
  })
}

/** Single product by UUID. Disabled until an id is present (route param). */
export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.products.detail(id ?? ''),
    queryFn: () => getProduct(id as string),
    enabled: !!id,
  })
}

/** Admin moderation list — every vendor's products, active or not. */
export function useAdminProducts(params: ListAdminProductsParams) {
  return useQuery({
    queryKey: queryKeys.products.admin({
      status: params.status,
      vendorId: params.vendorId,
      search: params.search,
      page: params.page,
    }),
    queryFn: () => listAdminProducts(params),
    placeholderData: (prev) => prev,
  })
}

interface UpdateVisibilityVars {
  id: string
  isActive: boolean
}

/**
 * Optimistically flips a product's `is_active` across every cached admin
 * list, then reconciles on settle. Enable/disable is an immediate-feedback
 * action, so the table updates before the round-trip; on error we roll back.
 */
export function useUpdateProductVisibility() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: UpdateVisibilityVars) => updateProductVisibility(id, isActive),

    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: queryKeys.products.all() })

      const snapshots = qc.getQueriesData<Paginated<Product>>({
        queryKey: queryKeys.products.all(),
      })

      for (const [key, page] of snapshots) {
        if (!page) continue
        qc.setQueryData<Paginated<Product>>(key, {
          ...page,
          data: page.data.map((p) => (p.id === id ? { ...p, is_active: isActive } : p)),
        })
      }

      return { snapshots }
    },

    onError: (_err, _vars, context) => {
      context?.snapshots.forEach(([key, page]) => qc.setQueryData(key, page))
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products.all() })
    },
  })
}

/**
 * Upload/replace a product's image. No optimistic update — the final `image_url`
 * is server-derived (we don't know it until the round-trip). On settle we
 * invalidate the whole `products` tree so the admin list, detail, and public
 * storefront all pick up the new image.
 */
export function useUploadProductImage() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, image }: { id: string; image: File }) => uploadProductImage(id, image),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.products.all() }),
  })
}

/** Remove a product's image; same tree-wide invalidation on settle. */
export function useRemoveProductImage() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => removeProductImage(id),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.products.all() }),
  })
}
