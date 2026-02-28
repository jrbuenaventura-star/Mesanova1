import { notFound } from "next/navigation"
import { getGiftRegistryByToken } from "@/lib/db/user-features"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gift, Calendar, ShoppingCart, Check } from "lucide-react"
import Image from "next/image"
import { ShareButton } from "@/components/ui/share-button"

const eventTypeLabels: Record<string, string> = {
  wedding: "Lista de Boda",
  baby_shower: "Lista de Baby Shower",
  birthday: "Lista de Cumpleaños",
  housewarming: "Lista de Inauguración",
  other: "Lista de Regalos",
}

export default async function GiftRegistryPublicPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const registry = await getGiftRegistryByToken(token)

  if (!registry) {
    notFound()
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const items = registry.gift_registry_items || []
  const availableItems = items.filter((item: any) => item.quantity_purchased < item.quantity_desired)
  const completedItems = items.filter((item: any) => item.quantity_purchased >= item.quantity_desired)

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="container max-w-4xl py-12 px-4 text-center">
          {registry.cover_image_url && (
            <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-background shadow-lg">
              <Image
                src={registry.cover_image_url}
                alt={registry.name}
                width={128}
                height={128}
                className="object-cover"
              />
            </div>
          )}

          <Badge variant="outline" className="mb-4">
            <Gift className="h-3 w-3 mr-1" />
            {eventTypeLabels[registry.event_type] || "Lista de Regalos"}
          </Badge>

          <h1 className="text-4xl font-bold mb-2">{registry.name}</h1>

          {registry.partner_name && (
            <p className="text-xl text-muted-foreground mb-4">
              & {registry.partner_name}
            </p>
          )}

          {registry.event_date && (
            <p className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
              <Calendar className="h-4 w-4" />
              {formatDate(registry.event_date)}
            </p>
          )}

          {registry.description && (
            <p className="text-muted-foreground max-w-xl mx-auto">
              {registry.description}
            </p>
          )}

          <div className="flex justify-center gap-4 mt-6">
            <ShareButton
              variant="outline"
              size="sm"
              url={`/lista/${token}`}
              title={registry.name}
              text={`Mira esta lista de regalos en Mesanova: ${registry.name}`}
              label="Compartir"
            />
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="container max-w-6xl py-8 px-4">
        {items.length === 0 ? (
          <Card className="p-12 text-center">
            <Gift className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">La lista está vacía</h2>
            <p className="text-muted-foreground">
              Aún no se han agregado productos a esta lista
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Available items */}
            {availableItems.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Productos disponibles ({availableItems.length})
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {availableItems.map((item: any) => {
                    const product = item.product
                    if (!product) return null

                    const remaining = item.quantity_desired - item.quantity_purchased

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
                          {item.priority > 0 && (
                            <Badge className="absolute top-2 left-2 bg-primary">
                              {item.priority === 2 ? "Muy deseado" : "Prioridad"}
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-medium line-clamp-2 mb-2">
                            {product.nombre_comercial}
                          </h3>
                          <p className="text-lg font-bold mb-2">
                            ${Number(product.precio || 0).toLocaleString("es-CO")}
                          </p>
                          {item.notes && (
                            <p className="text-sm text-muted-foreground mb-3 italic">
                              "{item.notes}"
                            </p>
                          )}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-muted-foreground">
                              {item.quantity_purchased} de {item.quantity_desired} regalados
                            </span>
                          </div>
                          <Button className="w-full" disabled={product.upp_existencia <= 0}>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Regalar ({remaining} {remaining === 1 ? "disponible" : "disponibles"})
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Completed items */}
            {completedItems.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
                  Ya regalados ({completedItems.length})
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {completedItems.map((item: any) => {
                    const product = item.product
                    if (!product) return null

                    return (
                      <Card key={item.id} className="overflow-hidden opacity-60">
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
                          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                            <Badge className="bg-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              Regalado
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <h3 className="font-medium text-sm line-clamp-1">
                            {product.nombre_comercial}
                          </h3>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
