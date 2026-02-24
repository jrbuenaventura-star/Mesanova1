import { ChefHat, UtensilsCrossed, Coffee, Thermometer, Briefcase, Package } from "lucide-react"
import { notFound } from "next/navigation"
import {
  getSilosWithSubcategories,
  getProductsForHoReCa,
  getProductsBySilo,
} from "@/lib/db/queries"
import { ProductsWithFilters } from "@/components/products/products-with-filters"
import { createClient } from "@/lib/supabase/server"
import { getCurrentDistributorPricingContext } from "@/lib/distributor-pricing-context"

const silosIconMap = {
  cocina: ChefHat,
  mesa: UtensilsCrossed,
  "cafe-te-bar": Coffee,
  "termos-neveras": Thermometer,
  profesional: Briefcase,
}
const HORECA_CATEGORY_SLUGS = ["mesa", "cocina", "cafe-te-bar"] as const
const HORECA_CATEGORY_FALLBACK_NAMES: Record<(typeof HORECA_CATEGORY_SLUGS)[number], string> = {
  mesa: "Mesa",
  cocina: "Cocina",
  "cafe-te-bar": "Café, té y bar",
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
}: {
  params: Promise<{ silo: string }>
}) {
  const { silo } = await params

  const silos = await getSilosWithSubcategories()
  const siloData = silos.find((s) => s.slug === silo)

  if (!siloData) {
    notFound()
  }

  const Icon = silosIconMap[silo as keyof typeof silosIconMap] || Package

  // Para HoReCa (silo "profesional"), mostrar productos con horeca = 'SI' o 'EXCLUSIVO'
  const isHoReCaSilo = silo === 'profesional'
  const silosBySlug = new Map((silos || []).map((item: any) => [item.slug, item]))
  const categoriesForFilters = isHoReCaSilo
    ? HORECA_CATEGORY_SLUGS.map((categorySlug) => ({
        slug: categorySlug,
        name: silosBySlug.get(categorySlug)?.name || HORECA_CATEGORY_FALLBACK_NAMES[categorySlug],
      }))
    : []
  const subcategoriesForFilters = isHoReCaSilo
    ? HORECA_CATEGORY_SLUGS.flatMap((categorySlug) => {
        const categorySilo = silosBySlug.get(categorySlug)
        const orderedSubcategories = [...(categorySilo?.subcategories || [])].sort(
          (a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)
        )
        return orderedSubcategories.map((subcategory: any) => ({
          id: subcategory.id,
          name: subcategory.name,
          slug: subcategory.slug,
          siloSlug: categorySlug,
        }))
      })
    : [...(siloData.subcategories || [])]
        .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
        .map((subcategory: any) => ({
          id: subcategory.id,
          name: subcategory.name,
          slug: subcategory.slug,
          siloSlug: silo,
        }))

  const products = isHoReCaSilo
    ? await getProductsForHoReCa(100)
    : await getProductsBySilo(silo, 200)
  const distributorForPricing = await getCurrentDistributorPricingContext()

  // Load product types for this silo's subcategories
  const subcategoryIds = subcategoriesForFilters.map((s: any) => s.id)
  let productTypes: any[] = []
  if (subcategoryIds.length > 0) {
    const supabase = await createClient()
    const { data } = await supabase
      .from("product_types")
      .select("*")
      .in("subcategory_id", subcategoryIds)
      .order("order_index")
    productTypes = data || []
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

      {/* Products Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">
              Todos los productos de {siloData.name}
            </h2>
          </div>

          <ProductsWithFilters
            products={products}
            categories={categoriesForFilters}
            subcategories={subcategoriesForFilters}
            productTypes={productTypes}
            siloSlug={silo}
            distributor={distributorForPricing}
          />
        </div>
      </section>
    </main>
  )
}
