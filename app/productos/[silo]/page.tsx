import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChefHat, UtensilsCrossed, Coffee, Thermometer, Briefcase, Package } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  getSilosWithSubcategories,
  getProductsBySubcategoryAndType,
  getAvailableProductTypesBySubcategory,
  getProductsForHoReCa,
  getProductsBySilo,
} from "@/lib/db/queries"
import { ProductCard } from "@/components/products/product-card"
import { ProductsWithFilters } from "@/components/products/products-with-filters"

const silosIconMap = {
  cocina: ChefHat,
  mesa: UtensilsCrossed,
  "cafe-te-bar": Coffee,
  "termos-neveras": Thermometer,
  profesional: Briefcase,
}

export async function generateMetadata({ params }: { params: Promise<{ silo: string }> }) {
  const { silo } = await params
  const silos = await getSilosWithSubcategories()
  const siloData = silos.find((s) => s.slug === silo)

  if (!siloData) return {}

  return {
    title: `${siloData.name} - Mesanova`,
    description: siloData.description || `Productos de ${siloData.name}`,
  }
}

export default async function SiloPage({
  params,
  searchParams,
}: {
  params: Promise<{ silo: string }>
  searchParams: Promise<{ subcategoria?: string; tipo?: string }>
}) {
  const { silo } = await params
  const search = await searchParams

  const silos = await getSilosWithSubcategories()
  const siloData = silos.find((s) => s.slug === silo)

  if (!siloData) {
    notFound()
  }

  const Icon = silosIconMap[silo as keyof typeof silosIconMap] || Package

  // Obtener subcategoría seleccionada
  const selectedSubcategory = search.subcategoria
    ? siloData.subcategories?.find((s: any) => s.slug === search.subcategoria)
    : null

  // Si hay una subcategoría seleccionada, obtener tipos disponibles y productos
  let availableTypes: any[] = []
  let products: any[] = []
  
  // Para HoReCa (silo "profesional"), mostrar productos con horeca = 'SI' o 'EXCLUSIVO'
  const isHoReCaSilo = silo === 'profesional'

  if (isHoReCaSilo) {
    // En la sección HoReCa, mostrar todos los productos con horeca SI o EXCLUSIVO
    products = await getProductsForHoReCa(100)
  } else if (selectedSubcategory) {
    availableTypes = await getAvailableProductTypesBySubcategory(selectedSubcategory.slug)
    products = await getProductsBySubcategoryAndType(selectedSubcategory.slug, search.tipo)
  } else {
    // Por defecto, mostrar todos los productos del silo
    products = await getProductsBySilo(silo, 200)
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-12 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Icon className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">{siloData.name}</h1>
          </div>
          <p className="text-center text-lg text-muted-foreground max-w-2xl mx-auto">
            {siloData.description || `Explora nuestra colección de productos de ${siloData.name}`}
          </p>
        </div>
      </section>

      {/* Subcategories Filter */}
      <section className="py-8 px-4 border-b bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-xl font-semibold mb-4">Subcategorías</h2>
          <div className="flex flex-wrap gap-2">
            {/* Botón para limpiar filtro */}
            {selectedSubcategory && (
              <Link href={`/productos/${silo}`}>
                <Badge variant="outline" className="text-sm px-4 py-2 cursor-pointer hover:bg-muted transition-colors">
                  Ver todas
                </Badge>
              </Link>
            )}

            {siloData.subcategories?.map((subcategory: any) => {
              const isSelected = selectedSubcategory?.id === subcategory.id
              return (
                <Link key={subcategory.id} href={`/productos/${silo}?subcategoria=${subcategory.slug}`}>
                  <Badge
                    variant={isSelected ? "default" : "secondary"}
                    className="text-sm px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {subcategory.name}
                  </Badge>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Product Types Filter - Solo visible si hay subcategoría seleccionada */}
      {selectedSubcategory && availableTypes.length > 0 && (
        <section className="py-6 px-4 border-b bg-background">
          <div className="container mx-auto">
            <h3 className="text-lg font-medium mb-3">Filtrar por tipo de producto en {selectedSubcategory.name}</h3>
            <div className="flex flex-wrap gap-2">
              {/* Botón para limpiar filtro de tipo */}
              {search.tipo && (
                <Link href={`/productos/${silo}?subcategoria=${selectedSubcategory.slug}`}>
                  <Badge
                    variant="outline"
                    className="text-sm px-3 py-1.5 cursor-pointer hover:bg-muted transition-colors"
                  >
                    Todos los productos
                  </Badge>
                </Link>
              )}

              {availableTypes.map((type) => {
                const isSelected = search.tipo === type.slug
                return (
                  <Link
                    key={type.id}
                    href={`/productos/${silo}?subcategoria=${selectedSubcategory.slug}&tipo=${type.slug}`}
                  >
                    <Badge
                      variant={isSelected ? "default" : "outline"}
                      className="text-sm px-3 py-1.5 cursor-pointer hover:bg-primary/10 transition-colors"
                    >
                      {type.name}
                      <span className="ml-1.5 text-xs opacity-70">({type.product_count})</span>
                    </Badge>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Products Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold">
                {selectedSubcategory
                  ? search.tipo
                    ? availableTypes.find((t) => t.slug === search.tipo)?.name
                    : selectedSubcategory.name
                  : `Todos los productos de ${siloData.name}`}
              </h2>
            </div>

            <ProductsWithFilters products={products} subcategories={siloData.subcategories || []} siloSlug={silo} />
          </>
        </div>
      </section>
    </main>
  )
}
