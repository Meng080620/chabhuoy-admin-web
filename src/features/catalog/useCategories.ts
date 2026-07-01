import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/query/keys'
import { listCategories } from './categoryService'

/**
 * Public category tree for the storefront. Taxonomy changes rarely, so it gets
 * a long staleTime — no point refetching navigation on every mount.
 */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.tree(),
    queryFn: listCategories,
    staleTime: 1000 * 60 * 10, // 10 min — navigation taxonomy is near-static
  })
}
