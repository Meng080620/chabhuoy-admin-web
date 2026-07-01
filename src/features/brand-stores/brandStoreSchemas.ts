import { z } from 'zod'
import type { BrandStore } from '@/types/api'

/** `GET …/brand-stores` item shape — parsed at the network boundary. */
export const brandStoreSchema: z.ZodType<BrandStore> = z.object({
  id: z.number(),
  name: z.string(),
  caption: z.string().nullable(),
  logo_url: z.string().nullable(),
  link_url: z.string().nullable(),
  position: z.number(),
  is_active: z.boolean(),
})

/** Resource collection — `{ data: BrandStore[] }` (not paginated). */
export const brandStoresResponseSchema = z.object({
  data: z.array(brandStoreSchema),
})
