import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/query/keys'
import type { BannerType } from '@/types/api'
import {
  listBanners,
  listAdminBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  type BannerInput,
} from './bannerService'

/**
 * Public storefront banners. Long staleTime: CMS content changes rarely and a
 * homepage shouldn't refetch banners on every focus.
 */
export function useBanners(type?: BannerType) {
  return useQuery({
    queryKey: queryKeys.banners.list(type),
    queryFn: () => listBanners(type),
    staleTime: 5 * 60 * 1000,
  })
}

/** Admin CMS list — includes inactive banners. */
export function useAdminBanners() {
  return useQuery({
    queryKey: queryKeys.banners.admin(),
    queryFn: listAdminBanners,
  })
}

/**
 * Create/update/delete share one invalidation: any banner mutation can shift
 * ordering or active state, so the whole `banners` tree (admin list + every
 * public slot) is refetched on settle.
 */
export function useCreateBanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: BannerInput) => createBanner(input),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.banners.all() }),
  })
}

export function useUpdateBanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: BannerInput }) => updateBanner(id, input),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.banners.all() }),
  })
}

export function useDeleteBanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteBanner(id),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.banners.all() }),
  })
}
