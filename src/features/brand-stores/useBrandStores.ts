import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/query/keys'
import {
  listBrandStores,
  listAdminBrandStores,
  createBrandStore,
  updateBrandStore,
  deleteBrandStore,
  type BrandStoreInput,
} from './brandStoreService'

/** Public storefront brand-store tiles. Long staleTime — CMS content. */
export function useBrandStores() {
  return useQuery({
    queryKey: queryKeys.brandStores.list(),
    queryFn: listBrandStores,
    staleTime: 5 * 60 * 1000,
  })
}

/** Admin CMS list — includes inactive tiles. */
export function useAdminBrandStores() {
  return useQuery({
    queryKey: queryKeys.brandStores.admin(),
    queryFn: listAdminBrandStores,
  })
}

export function useCreateBrandStore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: BrandStoreInput) => createBrandStore(input),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.brandStores.all() }),
  })
}

export function useUpdateBrandStore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: BrandStoreInput }) =>
      updateBrandStore(id, input),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.brandStores.all() }),
  })
}

export function useDeleteBrandStore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteBrandStore(id),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.brandStores.all() }),
  })
}
