import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCategories } from '@/hooks/useCategories'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight, Search } from 'lucide-react'

export function HomePage() {
  const { data: categories, isLoading, error } = useCategories()
  const [query, setQuery] = useState('')

  const visible =
    query.trim() === ''
      ? categories
      : categories?.filter((c) =>
          c.name.toLowerCase().includes(query.toLowerCase()),
        )

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

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          placeholder="Search categories…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Category grid */}
      {error ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Could not load categories. Is the API running?</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl" />
                ))
              : visible?.map((cat) => (
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
          {!isLoading && query.trim() !== '' && visible?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <p>No categories match &ldquo;{query}&rdquo;.</p>
              <p className="mt-1">Use the admin page to add a new category.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
