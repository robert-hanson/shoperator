import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b bg-white sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary">
          <ShoppingCart className="w-5 h-5" />
          Shoperator
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            Categories
          </Link>
          <Link to="/admin" className="hover:text-foreground transition-colors">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  )
}
