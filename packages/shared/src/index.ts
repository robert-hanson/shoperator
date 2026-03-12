export type { StoreId, Store } from './types/store.js'
export { STORES, STORE_IDS } from './types/store.js'

export type { UnitType, Category, StoreVariant, NewStoreVariant, UpdateStoreVariant } from './types/product.js'

export type { NormalizedPrice, ComparisonResult } from './types/comparison.js'

export { conversionFactor, convertUnit, unitLabel } from './utils/unitNormalizer.js'
export { calcNormalizedPrice, formatPrice, calcSavingsPercent } from './utils/priceCalc.js'
