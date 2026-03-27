import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/lib/api'
import type { ScraperHealth, RefreshResult, RefreshFailure, DiscoveryResult, DiscoveryCandidate } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice, STORES } from '@shoperator/shared'
import type { StoreVariant, NewStoreVariant } from '@shoperator/shared'
import { useCategories } from '@/hooks/useCategories'
import { Lock, CheckCircle, Trash2, Link as LinkIcon, Loader2, RefreshCw, AlertCircle, Search } from 'lucide-react'

export function AdminPage() {
  const [token, setToken] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [tokenInput, setTokenInput] = useState('')

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setToken(tokenInput)
    setAuthenticated(true)
  }

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Admin Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <Input
                type="password"
                placeholder="Admin token"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
              />
              <Button type="submit" disabled={!tokenInput}>
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <AdminDashboard token={token} />
}

function AdminDashboard({ token }: { token: string }) {
  const client = adminApi(token)
  const queryClient = useQueryClient()

  const { data: staleVariants, isLoading } = useQuery({
    queryKey: ['admin', 'stale'],
    queryFn: () => client.stale.list(),
  })

  const confirmMutation = useMutation({
    mutationFn: (id: string) => client.variants.update(id, { isStale: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'stale'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => client.variants.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'stale'] }),
  })

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage products and price data.</p>
      </div>

      {/* Scraper health */}
      <ScraperHealthSection token={token} />

      {/* Price refresh */}
      <PriceRefreshSection token={token} />

      {/* Stale queue */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          Stale Products
          {staleVariants && staleVariants.length > 0 && (
            <Badge variant="warning">{staleVariants.length} need review</Badge>
          )}
        </h2>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : !staleVariants || staleVariants.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            All prices are up to date.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {staleVariants.map((v) => (
              <StaleVariantRow
                key={v.id}
                variant={v}
                onConfirm={() => confirmMutation.mutate(v.id)}
                onDelete={() => deleteMutation.mutate(v.id)}
                isConfirming={confirmMutation.isPending && confirmMutation.variables === v.id}
                isDeleting={deleteMutation.isPending && deleteMutation.variables === v.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Discover products */}
      <DiscoverProductsSection token={token} />

      {/* Add product */}
      <AddProductSection token={token} />
    </div>
  )
}

function ScraperHealthSection({ token }: { token: string }) {
  const client = adminApi(token)

  const { data: health, isLoading } = useQuery<ScraperHealth>({
    queryKey: ['admin', 'scraper-health'],
    queryFn: () => client.scraperHealth(),
  })

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Scraper Health</h2>
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : !health ? (
            <p className="text-sm text-muted-foreground">Unable to load scraper status.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {(['costco', 'aldi'] as const).map((storeId) => {
                const store = STORES[storeId]
                const status = health[storeId]
                return (
                  <div key={storeId} className="flex items-start gap-3">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: store.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{store.name}</span>
                        {status.healthy ? (
                          <Badge variant="default" className="text-xs bg-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Healthy
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Broken
                          </Badge>
                        )}
                      </div>
                      {status.lastChecked && (
                        <p className="text-xs text-muted-foreground">
                          Last checked: {new Date(status.lastChecked).toLocaleString()}
                        </p>
                      )}
                      {!status.healthy && status.error && (
                        <p className="text-xs text-destructive mt-0.5">{status.error}</p>
                      )}
                    </div>
                  </div>
                )
              })}
              {!health.costco.lastChecked && !health.aldi.lastChecked && (
                <p className="text-xs text-muted-foreground">
                  First health check runs on server startup — check back shortly.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function PriceRefreshSection({ token }: { token: string }) {
  const client = adminApi(token)
  const queryClient = useQueryClient()
  const [lastResult, setLastResult] = useState<RefreshResult | null>(null)

  const refreshMutation = useMutation({
    mutationFn: () => client.refreshPrices(),
    onSuccess: (result) => {
      setLastResult(result)
      queryClient.invalidateQueries({ queryKey: ['admin', 'stale'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'scraper-health'] })
    },
  })

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Price Refresh</h2>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-4">
            Re-scrape all products with a source URL and update prices in the database. Runs
            automatically every Sunday at 3am.
          </p>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
              className="flex items-center gap-2"
            >
              {refreshMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {refreshMutation.isPending ? 'Refreshing...' : 'Refresh All Prices'}
            </Button>
            {lastResult && !refreshMutation.isPending && (
              <p className="text-sm text-muted-foreground">
                {lastResult.updated} updated, {lastResult.failed} failed ({lastResult.durationMs}ms)
              </p>
            )}
          </div>
          {refreshMutation.isError && (
            <p className="text-sm text-destructive mt-2">
              {refreshMutation.error instanceof Error
                ? refreshMutation.error.message
                : 'Refresh failed'}
            </p>
          )}
          {lastResult && !refreshMutation.isPending && lastResult.failures.length > 0 && (
            <RefreshFailureList failures={lastResult.failures} />
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function RefreshFailureList({ failures }: { failures: RefreshFailure[] }) {
  const anomalies = failures.filter((f) => f.kind === 'anomaly')
  const errors = failures.filter((f) => f.kind !== 'anomaly')
  return (
    <div className="mt-4 space-y-3">
      {anomalies.length > 0 && (
        <div className="rounded-xl border border-yellow-400/40 bg-yellow-50 p-3">
          <p className="text-xs font-medium text-yellow-700 mb-2">
            {anomalies.length} price anomal{anomalies.length !== 1 ? 'ies' : 'y'} — marked stale for review
          </p>
          <ul className="flex flex-col gap-2">
            {anomalies.map((f, i) => (
              <li key={i} className="text-xs">
                <span className="font-medium">{f.name}</span>
                <span className="text-muted-foreground"> · {f.storeId}</span>
                <span className="text-yellow-700"> · {f.reason}</span>
                {f.sourceUrl && (
                  <>
                    {' · '}
                    <a href={f.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline text-muted-foreground hover:text-foreground">
                      view page
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {errors.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-xs font-medium text-destructive mb-2">
            {errors.length} product{errors.length !== 1 ? 's' : ''} failed to refresh
          </p>
          <ul className="flex flex-col gap-2">
            {errors.map((f, i) => (
              <li key={i} className="text-xs">
                <span className="font-medium">{f.name}</span>
                <span className="text-muted-foreground"> · {f.storeId}</span>
                <span className="text-muted-foreground"> · {f.reason}</span>
                {f.sourceUrl && (
                  <>
                    {' · '}
                    <a href={f.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline text-muted-foreground hover:text-foreground">
                      view page
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function StaleVariantRow({
  variant,
  onConfirm,
  onDelete,
  isConfirming,
  isDeleting,
}: {
  variant: StoreVariant
  onConfirm: () => void
  onDelete: () => void
  isConfirming: boolean
  isDeleting: boolean
}) {
  const store = STORES[variant.storeId]
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border bg-white">
      <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: store.color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{store.name}</span>
          <Badge variant="warning" className="text-xs">Stale</Badge>
        </div>
        <p className="text-sm font-medium leading-tight line-clamp-1">{variant.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatPrice(variant.priceCents)} · last updated{' '}
          {new Date(variant.lastUpdated).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {variant.sourceUrl && (
          <a
            href={variant.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground"
            title="View product page"
          >
            <LinkIcon className="w-4 h-4" />
          </a>
        )}
        <Button size="sm" variant="outline" onClick={onConfirm} disabled={isConfirming}>
          {isConfirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
          Confirm
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete} disabled={isDeleting} className="text-destructive hover:text-destructive">
          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </div>
  )
}

function DiscoverProductsSection({ token }: { token: string }) {
  const client = adminApi(token)
  const { data: categories } = useCategories()
  const [categorySlug, setCategorySlug] = useState('')
  const [urlsText, setUrlsText] = useState('')
  const [result, setResult] = useState<DiscoveryResult | null>(null)
  const [addedUrls, setAddedUrls] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [isDiscovering, setIsDiscovering] = useState(false)

  const selectedCategory = categories?.find((c) => c.slug === categorySlug)

  async function handleDiscover(e: React.FormEvent) {
    e.preventDefault()
    const urls = urlsText.split('\n').map((u) => u.trim()).filter(Boolean)
    if (urls.length === 0) return
    setIsDiscovering(true)
    setError('')
    setResult(null)
    setAddedUrls(new Set())
    try {
      const r = await client.discover(urls, categorySlug)
      setResult(r)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Discovery failed')
    } finally {
      setIsDiscovering(false)
    }
  }

  async function handleAdd(candidate: DiscoveryCandidate) {
    if (!selectedCategory || !candidate.scraped.priceCents) return
    const s = candidate.scraped
    const priceCents = s.priceCents as number
    await client.variants.create({
      categoryId: selectedCategory.id,
      storeId: (s.storeId ?? (candidate.store !== 'unknown' ? candidate.store : 'costco')) as NewStoreVariant['storeId'],
      name: s.name ?? 'Unknown product',
      brand: s.brand ?? '',
      imageUrl: s.imageUrl ?? null,
      priceCents,
      unitAmount: s.unitAmount ?? 1,
      unitType: (s.unitType ?? selectedCategory.preferredUnit) as NewStoreVariant['unitType'],
      unitCount: s.unitCount ?? 1,
      sourceUrl: candidate.sourceUrl,
      notes: null,
    })
    setAddedUrls((prev) => new Set([...prev, candidate.sourceUrl]))
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
        <Search className="w-4 h-4" />
        Discover Products
      </h2>
      <p className="text-sm text-muted-foreground mb-3">
        Paste product URLs (one per line) from Costco or Aldi. We'll scrape each one and show you candidates to add.
      </p>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleDiscover} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <select
                className="border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 flex-1"
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                required
              >
                <option value="">Select a category…</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.slug}>{c.iconEmoji} {c.name}</option>
                ))}
              </select>
            </div>
            <textarea
              className="w-full border rounded-md px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              rows={5}
              placeholder={"https://shop.aldi.us/store/aldi/products/19876332-little-journey-...\nhttps://shop.aldi.us/store/aldi/products/74120888-..."}
              value={urlsText}
              onChange={(e) => setUrlsText(e.target.value)}
            />
            <Button type="submit" disabled={!categorySlug || !urlsText.trim() || isDiscovering}>
              {isDiscovering ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Scraping…</>
              ) : (
                'Discover'
              )}
            </Button>
          </form>

          {error && <p className="text-sm text-destructive mt-3">{error}</p>}

          {result && (
            <div className="mt-4 flex flex-col gap-3">
              {result.skippedUrls.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Skipped {result.skippedUrls.length} invalid URL(s).
                </p>
              )}
              {result.candidates.length === 0 && (
                <p className="text-sm text-muted-foreground">No candidates found.</p>
              )}
              {result.candidates.map((c) => (
                <DiscoveryCandidateCard
                  key={c.sourceUrl}
                  candidate={c}
                  isAdded={addedUrls.has(c.sourceUrl)}
                  onAdd={() => void handleAdd(c)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function DiscoveryCandidateCard({
  candidate,
  isAdded,
  onAdd,
}: {
  candidate: DiscoveryCandidate
  isAdded: boolean
  onAdd: () => void
}) {
  const s = candidate.scraped
  const storeLabel = candidate.store === 'unknown' ? 'Unknown store' : STORES[candidate.store as 'costco' | 'aldi']?.name ?? candidate.store

  return (
    <div className={`rounded-xl border p-3 text-sm ${candidate.isDuplicate ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{s.name ?? '(no name)'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {storeLabel}
            {s.priceCents ? ` · ${formatPrice(s.priceCents)}` : ''}
            {s.unitAmount ? ` · ${s.unitAmount}${s.unitCount && s.unitCount > 1 ? ` × ${s.unitCount}` : ''} ${s.unitType ?? ''}` : ''}
          </p>
          {candidate.warning && (
            <p className="text-xs text-yellow-700 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {candidate.warning}
            </p>
          )}
          {candidate.isDuplicate && (
            <p className="text-xs text-muted-foreground mt-1">Already in catalog</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a href={candidate.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" title="View product">
            <LinkIcon className="w-3.5 h-3.5" />
          </a>
          {!candidate.isDuplicate && (
            <Button
              size="sm"
              variant={isAdded ? 'outline' : 'default'}
              disabled={isAdded || !candidate.valid}
              onClick={onAdd}
            >
              {isAdded ? <><CheckCircle className="w-3 h-3 mr-1" />Added</> : 'Add'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function AddProductSection({ token }: { token: string }) {
  const client = adminApi(token)
  const [url, setUrl] = useState('')
  const [isScraping, setIsScraping] = useState(false)
  const [suggestion, setSuggestion] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')

  async function handleScrape(e: React.FormEvent) {
    e.preventDefault()
    setIsScraping(true)
    setError('')
    try {
      const result = await client.scrapeAssist(url)
      setSuggestion(result as Record<string, unknown>)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scrape failed')
    } finally {
      setIsScraping(false)
    }
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Scrape-Assist</h2>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-4">
            Paste a product URL from Costco or Aldi to pre-fill product data. Review and save manually.
          </p>
          <form onSubmit={handleScrape} className="flex gap-2">
            <Input
              placeholder="https://www.costco.com/product..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!url || isScraping}>
              {isScraping ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch'}
            </Button>
          </form>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          {suggestion && (
            <pre className="mt-4 p-3 bg-muted rounded-lg text-xs overflow-auto">
              {JSON.stringify(suggestion, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
