import { api } from '@/lib/api'
import type { RegisterInput, User } from '@/types/api'
import { authResponseSchema, meResponseSchema } from './authSchemas'

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResult {
  user: User
  token: string
}

/** POST /login — returns a flat `{ user, token }` (user is not data-wrapped). */
export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  const { data } = await api.post('/login', credentials)
  return authResponseSchema.parse(data)
}

/** POST /register — creates a customer account, same flat `{ user, token }`. */
export async function register(input: RegisterInput): Promise<LoginResult> {
  const { data } = await api.post('/register', input)
  return authResponseSchema.parse(data)
}

/** GET /me — resource is the top-level response, so it's `{ data: user }`. */
export async function fetchMe(): Promise<User> {
  const { data } = await api.get('/me')
  return meResponseSchema.parse(data).data
}

/** POST /logout — revokes the current token server-side. */
export async function logout(): Promise<void> {
  await api.post('/logout')
}
