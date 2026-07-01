import { api } from '@/lib/api'
import type { Category } from '@/types/api'
import { categoriesResponseSchema } from './categorySchemas'

/**
 * GET /categories — public storefront taxonomy. Returns the top-level
 * categories with one nested level of children. Parsed at the boundary so a
 * contract drift surfaces here, not three components deep.
 */
export async function listCategories(): Promise<Category[]> {
  const { data } = await api.get('/categories')
  return categoriesResponseSchema.parse(data).data
}
