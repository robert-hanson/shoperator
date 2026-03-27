import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useStoreVariants } from '@/hooks/useStoreVariants'
import { useComparison } from '@/hooks/useComparison'
import { useComparisonStore } from '@/store/comparisonStore'
import { StoreProductPicker } from '@/components/comparison/StoreProductPicker'
import { StoreSelector } from '@/components/comparison/StoreSelector'
import { ComparisonResults } from '@/components/comparison/ComparisonResults'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, RotateCcw } from 'lucide-react'
import type { StoreId } from '@shoperator/shared'
import { STORE_IDS } from '@shoperator/shared'

export function ComparePage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const [activeStores, setActiveStores] = useState<StoreId[]>(STORE_IDS)
  const { data: allVariants, isLoading } = useStoreVariants(slug)
  const { selectedVariants, setVariant, clearVariant, clearVariants, canCompare } =
    useComparisonStore()

  function handleStoresChange(next: StoreId[]) {
    const removed = activeStores.filter((id) => !next.includes(id))
    removed.forEach((id) => clearVariant(id))
    setActiveStores(next)
  }

  const selectedIds = Object.values(selectedVariants).filter((id): id is string => Boolean(id))
  const { data: comparisonResult, isFetching: isComparing } = useComparison(
    canCompare() ? selectedIds : [],
  )

  // Split variants by store
  const variantsByStore = (storeId: StoreId) =>
    allVariants?.filter((v) => v.storeId === storeId) ?? []

  // Derive category name from first variant or slug
  const categoryName =
    allVariants?.[0]
      ? slug
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      : slug

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          All categories
        </Link>
        <h1 className="text-2xl font-bold mt-1">{categoryName}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select one product from each store to compare unit prices.
        </p>
      </div>

      <div className="mb-6">
        <StoreSelector
          allStoreIds={STORE_IDS}
          activeStoreIds={activeStores}
          onChange={handleStoresChange}
        />
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          {/* Store pickers */}
          <div className={activeStores.length > 1 ? 'grid md:grid-cols-2 gap-6' : 'grid gap-6'}>
            {activeStores.map((storeId) => (
              <StoreProductPicker
                key={storeId}
                storeId={storeId}
                variants={variantsByStore(storeId)}
                selectedVariantId={selectedVariants[storeId]}
                onSelect={(id) => setVariant(storeId, id)}
              />
            ))}
          </div>

          {/* Compare / reset actions */}
          <div className="mt-6 flex items-center gap-3">
            {Object.keys(selectedVariants).length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearVariants}>
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Reset
              </Button>
            )}
            {!canCompare() && (
              <p className="text-sm text-muted-foreground">
                Select one product from each store to compare.
              </p>
            )}
          </div>

          {/* Results */}
          {isComparing && (
            <div className="mt-8">
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          )}
          {comparisonResult && !isComparing && (
            <ComparisonResults result={comparisonResult} />
          )}
        </>
      )}
    </div>
  )
}
