import { Link } from 'react-router-dom'
import { useCategories } from '@/hooks/useCategories'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight } from 'lucide-react'

export function HomePage() {
  const { data: categories, isLoading, error } = useCategories()

  return (
    <div>
      {/* Hero */}
      <div className="text-center py-12 px-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Compare grocery prices instantly
        </h1>
        <p className="text-muted-foreground mt-3 max-w-md mx-auto">
          Find the best deal per oz, per count, and more — across Costco and Aldi.
        </p>
      </div>

      {/* Category grid */}
      {error ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Could not load categories. Is the API running?</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))
            : categories?.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/compare/${cat.slug}`}
                  className="group rounded-2xl border bg-white p-5 flex flex-col gap-2 hover:border-primary/50 hover:shadow-sm transition-all duration-150"
                >
                  <span className="text-3xl">{cat.iconEmoji}</span>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm leading-tight">{cat.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
        </div>
      )}
    </div>
  )
}
