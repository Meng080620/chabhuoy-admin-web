import { z } from 'zod'
import type { Category } from '@/types/api'

/**
 * Admin `/admin/categories` tree shape — top-level alphabetical with children
 * nested one level. `z.lazy` keeps this parseable even if the backend ever
 * nests deeper than the documented one level.
 */
export const categoryNodeSchema: z.ZodType<Category> = z.lazy(() =>
  z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    children: z.array(categoryNodeSchema).optional(),
  }),
)

/** `{ data: Category[] }` — not paginated. */
export const categoryTreeResponseSchema = z.object({
  data: z.array(categoryNodeSchema),
})

/** A single resource returned as the top-level response — POST/PUT. */
export const categoryResponseSchema = z.object({
  data: categoryNodeSchema,
})
