import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { getWishlistById } from "@/lib/db/user-features"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Globe, Lock, Plus } from "lucide-react"

type WishlistDetailPageProps = {
  params: { id: string }
}

export default async function WishlistDetailPage({ params }: WishlistDetailPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/perfil/wishlists")
  }

  const wishlist = await getWishlistById(params.id)
  if (!wishlist || wishlist.user_id !== user.id) {
    redirect("/perfil/wishlists")
  }

  const items = wishlist.wishlist_items || []

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button variant="ghost" asChild className="w-fit">
          <Link href="/perfil/wishlists">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a mis listas
          </Link>
        </Button>

        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{wishlist.name}</h1>
            <p className="text-muted-foreground mt-1">
              Creada el {new Date(wishlist.created_at).toLocaleDateString("es-CO")}
            </p>
          </div>
          <Badge variant="outline" className={wishlist.is_public ? "text-green-600 border-green-200" : ""}>
            {wishlist.is_public ? (
              <>
                <Globe className="h-3 w-3 mr-1" />
                Pública
              </>
            ) : (
              <>
                <Lock className="h-3 w-3 mr-1" />
                Privada
              </>
            )}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
          <CardDescription>Información general de la lista</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {wishlist.description ? (
            <div>
              <p className="text-sm text-muted-foreground">Descripción</p>
              <p>{wishlist.description}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Esta lista no tiene descripción.</p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Productos agregados</p>
              <p className="font-semibold">{items.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Token de compartir</p>
              <p className="font-mono text-sm break-all">{wishlist.share_token || "No disponible"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Productos guardados</CardTitle>
          <CardDescription>Ítems que quieres comprar más adelante</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Aún no has agregado productos a esta lista.</p>
              <Button asChild>
                <Link href="/productos">
                  <Plus className="h-4 w-4 mr-2" />
                  Ver productos
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item: any) => {
                const product = item.product
                if (!product) return null

                return (
                  <div key={item.id} className="rounded-lg border p-3 flex gap-3">
                    <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted shrink-0">
                      {product.imagen_principal_url ? (
                        <Image
                          src={product.imagen_principal_url}
                          alt={product.nombre_comercial || "Producto"}
                          fill
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.nombre_comercial || "Producto"}</p>
                      <p className="text-sm text-muted-foreground">${Number(product.precio || 0).toLocaleString("es-CO")}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Cantidad: {item.quantity || 1}
                        {typeof item.priority === "number" ? ` · Prioridad: ${item.priority}` : ""}
                      </p>
                      {item.notes ? <p className="text-xs text-muted-foreground mt-1 italic">"{item.notes}"</p> : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
