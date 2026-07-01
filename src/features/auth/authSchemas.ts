import { z } from 'zod'
import { USER_ROLES } from '@/types/api'

/** Validates the shape of POST /login & /register at the network boundary. */
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.enum(USER_ROLES),
  created_at: z.string(),
})

export const authResponseSchema = z.object({
  user: userSchema,
  token: z.string().min(1),
})

/** GET /me returns the resource wrapped in `{ data }`. */
export const meResponseSchema = z.object({
  data: userSchema,
})
