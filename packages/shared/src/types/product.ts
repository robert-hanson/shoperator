import type { StoreId } from './store.js'

export type UnitType =
  | 'oz'
  | 'fl_oz'
  | 'lbs'
  | 'kg'
  | 'g'
  | 'count'
  | 'ml'
  | 'l'
  | 'sq_ft'
  | 'sheets'

export interface Category {
  id: string
  name: string
  slug: string
  iconEmoji: string
  preferredUnit: UnitType
  createdAt: string
}

export interface StoreVariant {
  id: string
  categoryId: string
  storeId: StoreId
  name: string
  brand: string
  imageUrl: string | null
  priceCents: number
  unitAmount: number
  unitType: UnitType
  unitCount: number
  sourceUrl: string | null
  lastUpdated: string
  isStale: boolean
  notes: string | null
  createdAt: string
}

export type NewStoreVariant = Omit<StoreVariant, 'id' | 'lastUpdated' | 'isStale' | 'createdAt'>
export type UpdateStoreVariant = Partial<NewStoreVariant> & { isStale?: boolean }
