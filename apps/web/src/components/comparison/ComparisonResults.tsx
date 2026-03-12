import type { ComparisonResult, StoreVariant, NormalizedPrice } from '@shoperator/shared'
import { STORES, formatPrice } from '@shoperator/shared'
import { Badge } from '@/components/ui/badge'
import { Trophy, Package } from 'lucide-react'

interface ComparisonResultsProps {
  result: ComparisonResult
}

export function ComparisonResults({ result }: ComparisonResultsProps) {
  const { variants, normalizedPrices, winnerId, savingsPercent, category } = result

  return (
    <div className="mt-8 rounded-2xl border bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-primary/5 to-transparent border-b">
        <h2 className="font-semibold text-base">
          {category.iconEmoji} {category.name} — Price Comparison
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Comparing {variants.length} products · per {normalizedPrices[0]?.normalizedUnit.replace('_', ' ')}
        </p>
      </div>

      {/* Results */}
      <div className="divide-y">
        {variants.map((variant) => {
          const price = normalizedPrices.find((p) => p.variantId === variant.id)
          const isWinner = variant.id === winnerId
          return (
            <ResultRow
              key={variant.id}
              variant={variant}
              price={price}
              isWinner={isWinner}
            />
          )
        })}
      </div>

      {/* Savings summary */}
      {savingsPercent > 0 && (
        <div className="px-6 py-4 bg-green-50 border-t">
          <p className="text-sm font-medium text-green-800">
            <Trophy className="inline w-4 h-4 mr-1.5 -mt-0.5" />
            {STORES[variants.find((v) => v.id === winnerId)?.storeId ?? 'aldi']?.name} is{' '}
            <strong>{savingsPercent.toFixed(1)}% cheaper</strong> per {normalizedPrices[0]?.normalizedUnit.replace('_', ' ')}
          </p>
        </div>
      )}
    </div>
  )
}

function ResultRow({
  variant,
  price,
  isWinner,
}: {
  variant: StoreVariant
  price: NormalizedPrice | undefined
  isWinner: boolean
}) {
  const store = STORES[variant.storeId]

  return (
    <div className={`px-6 py-4 flex items-center gap-4 ${isWinner ? 'bg-green-50/60' : ''}`}>
      {/* Store color dot */}
      <div
        className="w-2 h-10 rounded-full flex-shrink-0"
        style={{ backgroundColor: store.color }}
      />

      {/* Product image */}
      <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
        {variant.imageUrl ? (
          <img src={variant.imageUrl} alt={variant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Package className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{store.name}</span>
          {isWinner && (
            <Badge variant="success" className="text-xs">
              Best value
            </Badge>
          )}
        </div>
        <p className="font-medium text-sm leading-snug mt-0.5 line-clamp-1">{variant.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatPrice(variant.priceCents)} total · {variant.unitAmount}{variant.unitType.replace('_', ' ')}{variant.unitCount > 1 ? ` × ${variant.unitCount}` : ''}
        </p>
      </div>

      {/* Unit price */}
      {price && (
        <div className="text-right flex-shrink-0">
          <p className={`text-lg font-bold ${isWinner ? 'text-green-700' : 'text-foreground'}`}>
            {price.displayString.split(' / ')[0]}
          </p>
          <p className="text-xs text-muted-foreground">per {price.normalizedUnit.replace('_', ' ')}</p>
        </div>
      )}
    </div>
  )
}
