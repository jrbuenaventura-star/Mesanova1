import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getRecentlyViewed } from "@/lib/db/user-features"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, ShoppingCart } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { FavoriteButton } from "@/components/products/favorite-button"
import { getImageKitUrl } from "@/lib/imagekit"

export default async function VistosRecientementePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/perfil/vistos")
  }

  const recentlyViewed = await getRecentlyViewed(user.id, 24)

  const formatDate = (date: string) => {
    const now = new Date()
    const viewDate = new Date(date)
    const diffMs = now.getTime() - viewDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays} días`
    return viewDate.toLocaleDateString("es-CO", { month: "short", day: "numeric" })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Clock className="h-8 w-8" />
          Vistos Recientemente
        </h1>
        <p className="text-muted-foreground mt-2">
          Productos que has visitado recientemente
        </p>
      </div>

      {recentlyViewed.length === 0 ? (
        <Card className="p-12 text-center">
          <Clock className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No has visto productos aún</h2>
          <p className="text-muted-foreground mb-6">
            Cuando explores nuestro catálogo, los productos aparecerán aquí
          </p>
          <Button asChild>
            <Link href="/productos">Explorar productos</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recentlyViewed.map((item: any) => {
            const product = item.product
            if (!product) return null

            const primaryCategory = product.categories?.find((c: any) => c.is_primary)
            const siloRelation = primaryCategory?.subcategory?.silo
            const siloSlug = Array.isArray(siloRelation) ? siloRelation[0]?.slug : siloRelation?.slug
            const productHref = siloSlug ? `/productos/${siloSlug}/${product.slug}` : "/productos"

            return (
              <Card key={product.id} className="group overflow-hidden">
                <div className="relative aspect-square bg-muted">
                  <Link href={productHref}>
                    {product.imagen_principal_url ? (
                      <Image
                        src={getImageKitUrl(product.imagen_principal_url, { width: 700, height: 700, quality: 80, format: "auto" })}
                        alt={product.nombre_comercial || "Producto"}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        Sin imagen
                      </div>
                    )}
                  </Link>
                  <div className="absolute top-2 right-2">
                    <FavoriteButton productId={product.id} />
                  </div>
                  <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs">
                    {formatDate(item.viewed_at)}
                  </div>
                </div>
                <CardContent className="p-4">
                  <Link href={productHref}>
                    <h3 className="font-medium line-clamp-2 hover:text-primary transition-colors">
                      {product.nombre_comercial}
                    </h3>
                  </Link>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-lg font-bold">
                      ${Number(product.precio || 0).toLocaleString("es-CO")}
                    </span>
                    {product.upp_existencia > 0 ? (
                      <span className="text-xs text-green-600">En stock</span>
                    ) : (
                      <span className="text-xs text-red-500">Agotado</span>
                    )}
                  </div>
                  <Button className="w-full mt-3" size="sm" disabled={product.upp_existencia <= 0}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
