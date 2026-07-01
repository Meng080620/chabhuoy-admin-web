import { z } from 'zod'
import type { Category } from '@/types/api'

/**
 * Public `GET /categories` shape. The tree is two levels deep (top-level
 * categories each with their immediate `children`); we type `children` as a
 * recursive schema so deeper nesting still parses rather than throwing.
 */
export const categorySchema: z.ZodType<Category> = z.lazy(() =>
  z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    children: z.array(categorySchema).optional(),
  }),
)

/** Resource collection — `{ data: Category[] }` (not paginated). */
export const categoriesResponseSchema = z.object({
  data: z.array(categorySchema),
})
