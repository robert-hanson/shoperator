import type {
  Category,
  StoreVariant,
  ComparisonResult,
  NewStoreVariant,
  UpdateStoreVariant,
} from '@shoperator/shared'

export interface ScraperHealth {
  costco: { healthy: boolean; lastChecked: string | null; error?: string }
  aldi: { healthy: boolean; lastChecked: string | null; error?: string }
}

export interface RefreshFailure {
  name: string
  storeId: string
  sourceUrl: string
  reason: string
  kind: 'no_price' | 'anomaly' | 'scrape_error'
}

export interface DiscoveryCandidate {
  sourceUrl: string
  store: 'costco' | 'aldi' | 'unknown'
  scraped: Partial<NewStoreVariant>
  isDuplicate: boolean
  valid: boolean
  warning?: string
}

export interface DiscoveryResult {
  candidates: DiscoveryCandidate[]
  skippedUrls: string[]
}

export interface RefreshResult {
  updated: number
  failed: number
  durationMs: number
  failures: RefreshFailure[]
}

const BASE = '/api/v1'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ─── Public ─────────────────────────────────────────────────────────────────

export const api = {
  categories: {
    list: () => request<Category[]>('/categories'),
    get: (slug: string) => request<Category>(`/categories/${slug}`),
  },
  variants: {
    listByCategory: (slug: string, stores?: string[]) => {
      const qs = stores ? `?store=${stores.join(',')}` : ''
      return request<StoreVariant[]>(`/categories/${slug}/variants${qs}`)
    },
  },
  comparison: {
    compare: (variantIds: string[]) =>
      request<ComparisonResult>(`/comparison?variantIds=${variantIds.join(',')}`),
  },
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export function adminApi(token: string) {
  const headers = { Authorization: `Bearer ${token}` }

  return {
    stale: {
      list: () => request<StoreVariant[]>('/admin/stale', { headers }),
    },
    variants: {
      create: (data: NewStoreVariant) =>
        request<StoreVariant>('/admin/variants', {
          method: 'POST',
          body: JSON.stringify(data),
          headers,
        }),
      update: (id: string, data: UpdateStoreVariant) =>
        request<StoreVariant>(`/admin/variants/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
          headers,
        }),
      delete: (id: string) =>
        request<void>(`/admin/variants/${id}`, { method: 'DELETE', headers }),
    },
    scrapeAssist: (url: string) =>
      request<Partial<NewStoreVariant>>('/admin/scrape-assist', {
        method: 'POST',
        body: JSON.stringify({ url }),
        headers,
      }),
    scraperHealth: () => request<ScraperHealth>('/admin/scraper-health', { headers }),
    refreshPrices: () =>
      request<RefreshResult>('/admin/refresh-prices', { method: 'POST', headers }),
    discover: (urls: string[], categorySlug: string) =>
      request<DiscoveryResult>('/admin/discover', {
        method: 'POST',
        body: JSON.stringify({ urls, categorySlug }),
        headers,
      }),
  }
}
