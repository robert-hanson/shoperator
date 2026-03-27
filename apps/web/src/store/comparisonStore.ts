import { create } from 'zustand'
import type { StoreId } from '@shoperator/shared'

interface ComparisonState {
  selectedVariants: Partial<Record<StoreId, string>>
  setVariant: (storeId: StoreId, variantId: string) => void
  clearVariant: (storeId: StoreId) => void
  clearVariants: () => void
  canCompare: () => boolean
}

export const useComparisonStore = create<ComparisonState>((set, get) => ({
  selectedVariants: {},

  setVariant: (storeId, variantId) =>
    set((state) => ({
      selectedVariants: { ...state.selectedVariants, [storeId]: variantId },
    })),

  clearVariant: (storeId) =>
    set((state) => {
      const next = { ...state.selectedVariants }
      delete next[storeId]
      return { selectedVariants: next }
    }),

  clearVariants: () => set({ selectedVariants: {} }),

  canCompare: () => {
    const selected = get().selectedVariants
    const count = Object.values(selected).filter(Boolean).length
    return count >= 2
  },
}))
