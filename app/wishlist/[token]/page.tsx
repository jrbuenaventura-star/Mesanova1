import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { getWishlistByToken } from "@/lib/db/user-features"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingCart } from "lucide-react"
import { ShareButton } from "@/components/ui/share-button"

type PublicWishlistPageProps = {
  params: Promise<{ token: string }>
}

export default async function PublicWishlistPage({ params }: PublicWishlistPageProps) {
  const { token } = await params
  const wishlist = await getWishlistByToken(token)

  if (!wishlist || !wishlist.is_public) {
    notFound()
  }

  const ownerName =
    (Array.isArray((wishlist as any).user_profiles)
      ? (wishlist as any).user_profiles[0]?.full_name
      : (wishlist as any).user_profiles?.full_name) || null

  const items = wishlist.wishlist_items || []

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-background border-b">
        <div className="container max-w-4xl py-12 px-4 text-center space-y-4">
          <Badge variant="outline" className="mx-auto">
            <Heart className="h-3 w-3 mr-1" />
            Lista de deseos pública
          </Badge>
          <h1 className="text-4xl font-bold">{wishlist.name}</h1>
          <p className="text-muted-foreground">
            Creada por {ownerName || "Usuario Mesanova"}
          </p>
          {wishlist.description ? (
            <p className="text-muted-foreground max-w-xl mx-auto">{wishlist.description}</p>
          ) : null}
          <div className="flex justify-center">
            <ShareButton
              url={`/wishlist/${wishlist.share_token}`}
              title={wishlist.name}
              text={`Mira esta lista de deseos en Mesanova: ${wishlist.name}`}
              label="Compartir lista"
            />
          </div>
        </div>
      </div>

      <div className="container max-w-6xl py-8 px-4">
        {items.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Esta lista no tiene productos aún</h2>
            <p className="text-muted-foreground">Vuelve pronto para ver nuevos productos guardados.</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item: any) => {
              const product = item.product
              if (!product) return null

              return (
                <Card key={item.id} className="overflow-hidden">
                  <div className="relative aspect-square bg-muted">
                    {product.imagen_principal_url ? (
                      <Image
                        src={product.imagen_principal_url}
                        alt={product.nombre_comercial || "Producto"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        Sin imagen
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-medium line-clamp-2">{product.nombre_comercial || "Producto"}</h3>
                    <p className="text-lg font-bold">${Number(product.precio || 0).toLocaleString("es-CO")}</p>
                    <p className="text-sm text-muted-foreground">Cantidad deseada: {item.quantity || 1}</p>
                    {item.notes ? <p className="text-sm text-muted-foreground italic">"{item.notes}"</p> : null}
                    <Button asChild className="w-full" disabled={product.upp_existencia <= 0}>
                      <Link href={`/buscar?q=${encodeURIComponent(product.nombre_comercial || product.slug || "")}`}>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Ver producto
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
