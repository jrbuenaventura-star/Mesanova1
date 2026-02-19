import { Suspense } from "react"
import { searchProducts } from "@/lib/db/queries"
import { ProductCard } from "@/components/products/product-card"
import { Search } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

async function SearchResults({ query }: { query: string }) {
  if (!query || query.trim().length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Ingresa un término de búsqueda</h2>
        <p className="text-muted-foreground">Usa la barra de búsqueda para encontrar productos</p>
      </div>
    )
  }

  const products = await searchProducts(query, 50)

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No se encontraron resultados</h2>
        <p className="text-muted-foreground mb-6">No encontramos productos que coincidan con "{query}"</p>
        <Button asChild>
          <Link href="/productos">Ver productos</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <p className="text-muted-foreground mb-6">
        Se encontraron {products.length} producto{products.length !== 1 ? "s" : ""} para "{query}"
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const query = params.q || ""

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Resultados de búsqueda</h1>
        {query && (
          <p className="text-muted-foreground">
            Buscando: <span className="font-medium text-foreground">{query}</span>
          </p>
        )}
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        }
      >
        <SearchResults query={query} />
      </Suspense>
    </div>
  )
}
