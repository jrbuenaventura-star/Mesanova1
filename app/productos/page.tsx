import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChefHat, UtensilsCrossed, Coffee, Briefcase, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getImageKitUrl } from "@/lib/imagekit"

const silos = [
  {
    id: "cocina",
    slug: "cocina",
    name: "Cocina",
    description: "Organización, preparación y todo para cocinar con estilo",
    icon: ChefHat,
    color: "bg-primary text-primary-foreground",
  },
  {
    id: "mesa",
    slug: "mesa",
    name: "Mesa",
    description: "Vajillas, platos, cubiertos y decoración elegante",
    icon: UtensilsCrossed,
    color: "bg-accent text-accent-foreground",
  },
  {
    id: "cafe-te-bar",
    slug: "cafe-te-bar",
    name: "Café, Té y Bar",
    description: "Copas, vasos y accesorios para bebidas",
    icon: Coffee,
    color: "bg-secondary text-secondary-foreground",
  },
  {
    id: "profesional",
    slug: "profesional",
    name: "HoReCa",
    description: "Soluciones profesionales para hoteles, restaurantes y cafeterías",
    icon: Briefcase,
    color: "bg-foreground text-background",
  },
]

export const metadata = {
  title: "Productos - Vajillas, Copas, Vasos y Platos | Mesanova",
  description:
    "Descubre nuestra colección de artículos para mesa y cocina. Vajillas, copas, vasos, platos y utensilios de la más alta calidad.",
}

async function getFeaturedProductsBySilo(siloSlug: string) {
  const supabase = await createClient()
  
  const { data: silo } = await supabase
    .from('silos')
    .select('id')
    .eq('slug', siloSlug)
    .single()
  
  if (!silo) return []
  
  const { data: featured } = await supabase
    .from('featured_category_products')
    .select(`
      id,
      order_index,
      product:products (
        id,
        pdt_codigo,
        nombre_comercial,
        pdt_descripcion,
        precio,
        imagen_principal_url,
        slug
      )
    `)
    .eq('silo_id', silo.id)
    .eq('is_active', true)
    .order('order_index', { ascending: true })
    .limit(4)
  
  return featured || []
}

export default async function ProductosPage() {
  // Obtener productos destacados para cada categoría
  const [cocinaProducts, mesaProducts, cafeProducts, profesionalProducts] = await Promise.all([
    getFeaturedProductsBySilo('cocina'),
    getFeaturedProductsBySilo('mesa'),
    getFeaturedProductsBySilo('cafe-te-bar'),
    getFeaturedProductsBySilo('profesional'),
  ])

  const silosWithProducts = [
    { ...silos[0], products: cocinaProducts },
    { ...silos[1], products: mesaProducts },
    { ...silos[2], products: cafeProducts },
    { ...silos[3], products: profesionalProducts },
  ]

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 px-4 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="container mx-auto text-center">
          <Badge className="mb-4">Calidad Premium desde 1995</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Nuestros Productos
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Explora nuestras categorías y descubre los productos más representativos de cada una
          </p>
        </div>
      </section>

      {/* Categorías con Productos Destacados */}
      <section className="py-16 px-4">
        <div className="container mx-auto space-y-20">
          {silosWithProducts.map((silo) => {
            const Icon = silo.icon
            const hasProducts = silo.products && silo.products.length > 0
            
            return (
              <div key={silo.id} className="space-y-8">
                {/* Header de Categoría */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-xl ${silo.color} flex items-center justify-center`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">{silo.name}</h2>
                      <p className="text-muted-foreground">{silo.description}</p>
                    </div>
                  </div>
                  <Button asChild variant="outline">
                    <Link href={`/productos/${silo.slug}`}>
                      Ver categoría
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                {/* Grid de Productos Destacados */}
                {hasProducts ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {silo.products.map((item: any) => {
                      const product = item.product
                      return (
                        <Link key={product.id} href={`/productos/${silo.slug}/${product.slug || product.pdt_codigo}`} aria-label="Ver producto">
                          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                            <CardHeader className="p-0">
                              <div className="relative h-48 bg-muted rounded-t-lg overflow-hidden">
                                {product.imagen_principal_url ? (
                                  <Image
                                    src={getImageKitUrl(product.imagen_principal_url, { width: 800, height: 480, quality: 80, format: "auto" })}
                                    alt={product.nombre_comercial || product.pdt_descripcion}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Icon className="h-16 w-16 text-muted-foreground/30" />
                                  </div>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="p-4">
                              <CardTitle className="text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                {product.nombre_comercial || product.pdt_descripcion}
                              </CardTitle>
                              {product.precio && (
                                <p className="text-lg font-bold text-primary">
                                  ${Number(product.precio).toLocaleString('es-CO')}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                Código: {product.pdt_codigo}
                              </p>
                            </CardContent>
                          </Card>
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">
                      No hay productos destacados configurados para esta categoría.
                    </p>
                    <Button asChild variant="outline" className="mt-4">
                      <Link href={`/productos/${silo.slug}`}>
                        Ver categoría
                      </Link>
                    </Button>
                  </Card>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
