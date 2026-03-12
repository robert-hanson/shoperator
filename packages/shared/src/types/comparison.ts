import type { Category, StoreVariant, UnitType } from './product.js'

export interface NormalizedPrice {
  variantId: string
  priceCentsPerUnit: number
  normalizedUnit: UnitType
  displayString: string
}

export interface ComparisonResult {
  category: Category
  variants: StoreVariant[]
  normalizedPrices: NormalizedPrice[]
  winnerId: string
  savingsPercent: number
}
