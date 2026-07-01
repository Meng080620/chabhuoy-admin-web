import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/query/keys'
import {
  createCategory,
  deleteCategory,
  listAdminCategories,
  updateCategory,
  type CategoryInput,
} from './categoryService'

export function useAdminCategories() {
  return useQuery({
    queryKey: queryKeys.categories.admin(),
    queryFn: listAdminCategories,
  })
}

/**
 * Create/rename/delete all reshape the tree (position, nesting, deletion
 * guards) in ways not worth optimistically patching — invalidate on settle,
 * same as the Banners CMS mutations.
 */
export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CategoryInput) => createCategory(input),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.categories.all() }),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CategoryInput }) => updateCategory(id, input),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.categories.all() }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.categories.all() }),
  })
}
