import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useStoreVariants(categorySlug: string) {
  return useQuery({
    queryKey: ['variants', categorySlug],
    queryFn: () => api.variants.listByCategory(categorySlug),
    enabled: Boolean(categorySlug),
  })
}
