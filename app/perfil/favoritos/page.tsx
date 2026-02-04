import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserFavorites } from "@/lib/db/user-features"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingCart } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { FavoriteButton } from "@/components/products/favorite-button"
import { getImageKitUrl } from "@/lib/imagekit"

export default async function FavoritosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/perfil/favoritos")
  }

  const favorites = await getUserFavorites(user.id)

  return (
    <div className="container max-w-6xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Heart className="h-8 w-8 text-red-500" />
          Mis Favoritos
        </h1>
        <p className="text-muted-foreground mt-2">
          {favorites.length} producto{favorites.length !== 1 ? "s" : ""} guardado{favorites.length !== 1 ? "s" : ""}
        </p>
      </div>

      {favorites.length === 0 ? (
        <Card className="p-12 text-center">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No tienes favoritos aún</h2>
          <p className="text-muted-foreground mb-6">
            Explora nuestro catálogo y guarda los productos que te gusten
          </p>
          <Button asChild>
            <Link href="/productos">Ver productos</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((fav) => {
            const product = fav.product as any
            if (!product) return null

            const primaryCategory = product.categories?.find((c: any) => c.is_primary)
            const siloRelation = primaryCategory?.subcategory?.silo
            const siloSlug = Array.isArray(siloRelation) ? siloRelation[0]?.slug : siloRelation?.slug
            const productHref = siloSlug ? `/productos/${siloSlug}/${product.slug}` : "/productos"

            return (
              <Card key={fav.id} className="group overflow-hidden">
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
                    <FavoriteButton productId={product.id} initialIsFavorite={true} />
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
                  <Button className="w-full mt-4" size="sm" disabled={product.upp_existencia <= 0}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Agregar al carrito
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
