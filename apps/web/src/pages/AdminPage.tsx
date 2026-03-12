import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice, STORES } from '@shoperator/shared'
import type { StoreVariant } from '@shoperator/shared'
import { Lock, CheckCircle, Trash2, Link as LinkIcon, Loader2 } from 'lucide-react'

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

      {/* Add product */}
      <AddProductSection token={token} />
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
