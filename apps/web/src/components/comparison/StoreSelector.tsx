import { cn } from '@/lib/utils'
import { STORES } from '@shoperator/shared'
import type { StoreId } from '@shoperator/shared'

interface StoreSelectorProps {
  allStoreIds: StoreId[]
  activeStoreIds: StoreId[]
  onChange: (active: StoreId[]) => void
}

export function StoreSelector({ allStoreIds, activeStoreIds, onChange }: StoreSelectorProps) {
  const activeSet = new Set(activeStoreIds)

  function toggle(storeId: StoreId) {
    if (activeSet.has(storeId)) {
      if (activeStoreIds.length <= 1) return // can't deselect last store
      onChange(activeStoreIds.filter((id) => id !== storeId))
    } else {
      onChange([...activeStoreIds, storeId])
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground">Compare at:</span>
      {allStoreIds.map((storeId) => {
        const store = STORES[storeId]
        const isActive = activeSet.has(storeId)
        const isOnlyActive = isActive && activeStoreIds.length === 1

        return (
          <button
            key={storeId}
            onClick={() => toggle(storeId)}
            disabled={isOnlyActive}
            aria-pressed={isActive}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors min-h-[44px]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:pointer-events-none disabled:opacity-60',
              isActive
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: store.color }}
              aria-hidden="true"
            />
            {store.name}
          </button>
        )
      })}
    </div>
  )
}
