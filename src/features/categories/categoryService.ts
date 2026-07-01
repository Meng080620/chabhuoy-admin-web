import { api } from '@/lib/api'
import type { Category } from '@/types/api'
import { categoryResponseSchema, categoryTreeResponseSchema } from './categorySchemas'

/** GET /admin/categories — full tree, including empty branches. */
export async function listAdminCategories(): Promise<Category[]> {
  const { data } = await api.get('/admin/categories')
  return categoryTreeResponseSchema.parse(data).data
}

export interface CategoryInput {
  name: string
  /** Server-derives the slug from `name` — never send it. */
  parent_id: number | null
}

/** POST /admin/categories — `201`. */
export async function createCategory(input: CategoryInput): Promise<Category> {
  const { data } = await api.post('/admin/categories', input)
  return categoryResponseSchema.parse(data).data
}

/** PUT /admin/categories/{id} — `{category}` resolves by integer id, not slug. */
export async function updateCategory(id: number, input: CategoryInput): Promise<Category> {
  const { data } = await api.put(`/admin/categories/${id}`, input)
  return categoryResponseSchema.parse(data).data
}

/**
 * DELETE /admin/categories/{id} — `204`. The backend guards this with `422`
 * when the category still has products or sub-categories; let that reject and
 * surface via `apiErrorMessage` rather than swallowing it here.
 */
export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/admin/categories/${id}`)
}
