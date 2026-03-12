import type { StoreVariant, StoreId } from '@shoperator/shared'
import { STORES } from '@shoperator/shared'
import { ProductCard } from './ProductCard'
import { Skeleton } from '@/components/ui/skeleton'

interface StoreProductPickerProps {
  storeId: StoreId
  variants: StoreVariant[]
  selectedVariantId: string | undefined
  onSelect: (variantId: string) => void
  loading?: boolean
}

export function StoreProductPicker({
  storeId,
  variants,
  selectedVariantId,
  onSelect,
  loading,
}: StoreProductPickerProps) {
  const store = STORES[storeId]

  return (
    <div className="flex flex-col gap-3">
      {/* Store header */}
      <div className="flex items-center gap-2 pb-1 border-b">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: store.color }}
        />
        <h3 className="font-semibold text-sm">{store.name}</h3>
      </div>

      {loading ? (
        <>
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </>
      ) : variants.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No products found for this category
        </div>
      ) : (
        variants.map((v) => (
          <ProductCard
            key={v.id}
            variant={v}
            selected={selectedVariantId === v.id}
            onSelect={() => onSelect(v.id)}
          />
        ))
      )}
    </div>
  )
}
