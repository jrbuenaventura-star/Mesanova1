import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Percent, Tag, TrendingDown, Package } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import Image from "next/image"
import { getImageKitUrl } from "@/lib/imagekit"
import { calculateProductPricing, formatPrice } from "@/lib/pricing"

export const metadata = {
  title: "Ofertas - Mesanova",
  description: "Descubre nuestras mejores ofertas y promociones en productos para cocina, mesa y hogar",
}

export default async function OfertasPage() {
  const supabase = await createClient()

  const { data: ofertas } = await supabase
    .from("products")
    .select(`
      *,
      categories(
        subcategory:subcategories(
          name,
          silo:silos(name, slug)
        )
      ),
      warehouse_stock(available_quantity)
    `)
    .eq("is_on_sale", true)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(12)
  return (
    <main className="min-h-screen bg-background">
      <section className="py-12 px-4 bg-gradient-to-b from-destructive/10 to-background">
        <div className="container mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Percent className="h-8 w-8 text-destructive" />
            <h1 className="text-4xl md:text-5xl font-bold">Ofertas Especiales</h1>
          </div>
          <p className="text-center text-lg text-muted-foreground max-w-2xl mx-auto">
            Aprovecha nuestros descuentos exclusivos en productos seleccionados. Ofertas limitadas mientras dure el
            stock.
          </p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Tag className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Productos en Oferta</h2>
          </div>

          {!ofertas || ofertas.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay ofertas disponibles</h3>
                <p className="text-muted-foreground mb-4">
                  Actualmente no tenemos productos en oferta. Vuelve pronto para ver nuestras promociones.
                </p>
                <Button asChild variant="outline">
                  <Link href="/productos">Ver todos los productos</Link>
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ofertas.map((producto) => {
                const totalStock = producto.warehouse_stock?.reduce((sum: number, ws: any) => sum + ws.available_quantity, 0) || 0
                const primaryCategory = producto.categories?.find((c: any) => c.is_primary)
                const siloSlug = primaryCategory?.subcategory?.silo?.slug || "productos"
                const categoryName = primaryCategory?.subcategory?.silo?.name || "Producto"
                
                const pricing = calculateProductPricing(
                  {
                    precio: producto.precio,
                    descuento_porcentaje: producto.descuento_porcentaje,
                    precio_dist: producto.precio_dist,
                  },
                  null // Public catalog, no distributor
                )

                return (
                  <Card key={producto.id} className="overflow-hidden group">
                    <div className="relative h-48 w-full">
                      {producto.imagen_principal_url ? (
                        <Image
                          src={getImageKitUrl(producto.imagen_principal_url, { width: 900, height: 480, quality: 80, format: "auto" })}
                          alt={producto.nombre_comercial || producto.pdt_descripcion}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Package className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      {pricing.publicHasDiscount && (
                        <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground">
                          -{pricing.publicDiscount}%
                        </Badge>
                      )}
                    </div>
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{categoryName}</Badge>
                        {totalStock < 15 && totalStock > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Solo {totalStock} disponibles
                          </Badge>
                        )}
                        {totalStock === 0 && (
                          <Badge variant="destructive" className="text-xs">
                            Agotado
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg line-clamp-2">
                        {producto.nombre_comercial || producto.pdt_descripcion}
                      </CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-2xl font-bold text-foreground">
                            {formatPrice(pricing.publicPrice)}
                          </span>
                          {pricing.publicOriginalPrice && (
                            <span className="text-sm line-through text-muted-foreground">
                              {formatPrice(pricing.publicOriginalPrice)}
                            </span>
                          )}
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button className="w-full" asChild>
                        <Link href={`/productos/${siloSlug}/${producto.slug}`}>Ver Detalles</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section className="py-12 px-4 bg-muted/50">
        <div className="container mx-auto text-center">
          <TrendingDown className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">¿Eres distribuidor?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Los distribuidores registrados tienen acceso a descuentos adicionales y precios especiales. Regístrate para
            ver tus precios personalizados.
          </p>
          <Button size="lg" asChild>
            <Link href="/auth/login">Iniciar Sesión como Distribuidor</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
