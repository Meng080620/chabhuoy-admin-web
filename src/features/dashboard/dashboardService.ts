import { api } from '@/lib/api'
import type { DashboardSummary } from '@/types/api'
import { dashboardSummarySchema } from './dashboardSchemas'

/** GET /admin/dashboard — plain JSON, not wrapped in `data`. */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get('/admin/dashboard')
  return dashboardSummarySchema.parse(data)
}
