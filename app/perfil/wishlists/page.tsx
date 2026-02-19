import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserWishlists } from "@/lib/db/user-features"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ListChecks, Plus, Lock, Globe, Eye } from "lucide-react"
import Link from "next/link"
import { CreateWishlistDialog } from "@/components/profile/create-wishlist-dialog"
import { ShareButton } from "@/components/ui/share-button"

export default async function WishlistsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/perfil/wishlists")
  }

  const wishlists = await getUserWishlists(user.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ListChecks className="h-8 w-8" />
            Mis Listas de Deseos
          </h1>
          <p className="text-muted-foreground mt-2">
            Guarda productos que quieres comprar y compártelos
          </p>
        </div>
        <CreateWishlistDialog>
          <Button type="button">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Lista
          </Button>
        </CreateWishlistDialog>
      </div>

      {wishlists.length === 0 ? (
        <Card className="p-12 text-center">
          <ListChecks className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No tienes listas de deseos</h2>
          <p className="text-muted-foreground mb-6">
            Crea listas para organizar los productos que quieres comprar
          </p>
          <CreateWishlistDialog>
            <Button type="button">
              <Plus className="h-4 w-4 mr-2" />
              Crear mi primera lista
            </Button>
          </CreateWishlistDialog>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {wishlists.map((wishlist: any) => {
            const itemCount = wishlist.wishlist_items?.[0]?.count || 0

            return (
              <Card key={wishlist.id} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{wishlist.name}</CardTitle>
                    {wishlist.is_public ? (
                      <Badge variant="outline" className="text-green-600">
                        <Globe className="h-3 w-3 mr-1" />
                        Pública
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        <Lock className="h-3 w-3 mr-1" />
                        Privada
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {wishlist.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {wishlist.description}
                    </p>
                  )}

                  <p className="text-sm mb-4">
                    {itemCount} producto{itemCount !== 1 ? "s" : ""}
                  </p>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/perfil/wishlists/${wishlist.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Link>
                    </Button>
                    {wishlist.share_token && (
                      <ShareButton
                        variant="ghost"
                        size="sm"
                        iconOnly
                        label={`Compartir lista ${wishlist.name}`}
                        url={`/wishlist/${wishlist.share_token}`}
                        title={wishlist.name}
                        text={`Mira esta lista de deseos en Mesanova: ${wishlist.name}`}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
