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
  categoryEmoji?: string | undefined
}

export function StoreProductPicker({
  storeId,
  variants,
  selectedVariantId,
  onSelect,
  loading,
  categoryEmoji,
}: StoreProductPickerProps) {
  const store = STORES[storeId]

  return (
    <div className="flex flex-col rounded-2xl border overflow-hidden">
      {/* Store header — colored top accent + label */}
      <div
        className="px-4 py-3 flex items-center gap-2.5"
        style={{
          borderTop: `4px solid ${store.color}`,
          backgroundColor: `${store.color}0d`,
        }}
      >
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: store.color }}
          aria-hidden="true"
        />
        <h3 className="font-semibold text-base">{store.name}</h3>
      </div>

      {/* Product list */}
      <div className="flex flex-col gap-3 p-3">
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
              accentColor={store.color}
              onSelect={() => onSelect(v.id)}
              categoryEmoji={categoryEmoji}
            />
          ))
        )}
      </div>
    </div>
  )
}
