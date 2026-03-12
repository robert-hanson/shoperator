import type { StoreVariant } from '@shoperator/shared'
import { formatPrice } from '@shoperator/shared'
import { cn } from '@/lib/utils'
import { Package } from 'lucide-react'

interface ProductCardProps {
  variant: StoreVariant
  selected: boolean
  onSelect: () => void
}

export function ProductCard({ variant, selected, onSelect }: ProductCardProps) {
  const totalOz = `${variant.unitAmount}${variant.unitType.replace('_', ' ')}${variant.unitCount > 1 ? ` × ${variant.unitCount}` : ''}`

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-xl border-2 p-4 transition-all duration-150',
        'hover:border-primary/50 hover:shadow-sm',
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-white',
      )}
    >
      <div className="flex gap-3 items-start">
        {/* Product image or placeholder */}
        <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
          {variant.imageUrl ? (
            <img
              src={variant.imageUrl}
              alt={variant.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Package className="w-6 h-6" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-tight line-clamp-2">{variant.name}</p>
          {variant.brand && (
            <p className="text-xs text-muted-foreground mt-0.5">{variant.brand}</p>
          )}
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-base font-bold">{formatPrice(variant.priceCents)}</span>
            <span className="text-xs text-muted-foreground">{totalOz}</span>
          </div>
        </div>

        {/* Selection indicator */}
        <div
          className={cn(
            'w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors',
            selected ? 'border-primary bg-primary' : 'border-muted-foreground/30',
          )}
        >
          {selected && (
            <svg className="w-full h-full text-white p-0.5" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>

      {variant.notes && (
        <p className="text-xs text-muted-foreground mt-2 pl-[76px]">{variant.notes}</p>
      )}
    </button>
  )
}
