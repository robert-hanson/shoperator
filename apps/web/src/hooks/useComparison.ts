import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useComparison(variantIds: string[]) {
  return useQuery({
    queryKey: ['comparison', ...variantIds.sort()],
    queryFn: () => api.comparison.compare(variantIds),
    enabled: variantIds.length >= 2,
  })
}
