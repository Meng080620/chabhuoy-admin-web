import { z } from 'zod'
import type { Banner } from '@/types/api'
import { BANNER_TYPES } from '@/types/api'

/** Public/admin `GET …/banners` item shape — parsed at the network boundary. */
export const bannerSchema: z.ZodType<Banner> = z.object({
  id: z.number(),
  type: z.enum(BANNER_TYPES),
  title: z.string(),
  subtitle: z.string().nullable(),
  image_url: z.string().nullable(),
  link_url: z.string().nullable(),
  cta_label: z.string().nullable(),
  position: z.number(),
  is_active: z.boolean(),
})

/** Resource collection — `{ data: Banner[] }` (not paginated). */
export const bannersResponseSchema = z.object({
  data: z.array(bannerSchema),
})
