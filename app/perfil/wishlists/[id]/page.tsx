import { redirect } from "next/navigation"
import Link from "next/link"

import { createClient } from "@/lib/supabase/server"
import { getUserWishlists, getWishlistById } from "@/lib/db/user-features"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShareButton } from "@/components/ui/share-button"
import { WishlistItemsList } from "@/components/profile/wishlist-items-list"

import { ArrowLeft, Globe, Lock, Plus } from "lucide-react"

type WishlistDetailPageProps = {
  params: Promise<{ id: string }>
}

function toSingleRecord<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] || null : value
}

export default async function WishlistDetailPage({ params }: WishlistDetailPageProps) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/perfil/wishlists")
  }

  const [wishlist, userWishlists] = await Promise.all([getWishlistById(id), getUserWishlists(user.id)])
  if (!wishlist || wishlist.user_id !== user.id) {
    redirect("/perfil/wishlists")
  }

  const moveTargetWishlists = (userWishlists || [])
    .filter((userWishlist: any) => userWishlist.id !== id)
    .map((userWishlist: any) => ({ id: userWishlist.id, name: userWishlist.name }))

  const items = (wishlist.wishlist_items || []).map((item: any) => {
    const product = toSingleRecord(item.product)

    if (!product) {
      return { ...item, product: null }
    }

    const categories = (product.categories || []).map((category: any) => {
      const subcategory = toSingleRecord(category?.subcategory)
      const silo = toSingleRecord(subcategory?.silo)

      return {
        ...category,
        subcategory: subcategory
          ? {
              ...subcategory,
              silo: silo ? { ...silo } : null,
            }
          : null,
      }
    })

    return {
      ...item,
      product: {
        ...product,
        categories,
      },
    }
  })
  const shareUrl = wishlist.share_token ? `/wishlist/${wishlist.share_token}` : undefined

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
            <p className="text-muted-foreground mt-1">Creada el {new Date(wishlist.created_at).toLocaleDateString("es-CO")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
            <ShareButton
              variant="outline"
              url={shareUrl}
              title={wishlist.name}
              text={`Mira esta lista de deseos en Mesanova: ${wishlist.name}`}
              label="Compartir lista"
              disabled={!wishlist.is_public || !shareUrl}
            />
          </div>
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

          {!wishlist.is_public && (
            <p className="text-sm text-muted-foreground">
              Para compartir esta lista, configúrala como pública al crear/editar la wishlist.
            </p>
          )}
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
            <WishlistItemsList wishlistId={id} items={items} targetWishlists={moveTargetWishlists} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
