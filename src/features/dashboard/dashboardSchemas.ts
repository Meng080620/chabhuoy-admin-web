import { z } from 'zod'
import type { DashboardSummary } from '@/types/api'
import { ORDER_STATUSES } from '@/types/api'

/**
 * GET /admin/dashboard item shape — parsed at the network boundary. Money
 * fields are fixed 2-decimal strings (never numbers); `by_status` always
 * carries all 5 order statuses so it's safe to index directly.
 */
export const dashboardSummarySchema: z.ZodType<DashboardSummary> = z.object({
  revenue: z.object({
    captured: z.string(),
    today: z.string(),
  }),
  orders: z.object({
    total: z.number(),
    by_status: z.object(
      Object.fromEntries(ORDER_STATUSES.map((status) => [status, z.number()])) as Record<
        (typeof ORDER_STATUSES)[number],
        z.ZodNumber
      >,
    ),
  }),
  customers: z.object({
    total: z.number(),
    new_this_week: z.number(),
  }),
  payouts: z.object({
    pending_amount: z.string(),
    pending_count: z.number(),
  }),
  catalog: z.object({
    low_stock_count: z.number(),
    top_products: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        revenue: z.string(),
        units: z.number(),
      }),
    ),
  }),
})
