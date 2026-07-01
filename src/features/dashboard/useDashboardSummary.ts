import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/query/keys'
import { getDashboardSummary } from './dashboardService'

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: getDashboardSummary,
    staleTime: 60_000,
  })
}
