import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { getGiftRegistryById } from "@/lib/db/user-features"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Eye, Gift, Share2 } from "lucide-react"

type GiftRegistryDetailPageProps = {
  params: Promise<{ id: string }>
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: "Boda",
  baby_shower: "Baby Shower",
  birthday: "Cumpleaños",
  housewarming: "Inauguración de Casa",
  other: "Otro",
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "Activa", color: "bg-green-500" },
  completed: { label: "Completada", color: "bg-blue-500" },
  expired: { label: "Expirada", color: "bg-gray-500" },
  cancelled: { label: "Cancelada", color: "bg-red-500" },
}

function formatDate(date?: string | null) {
  if (!date) return "No definida"
  return new Date(date).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default async function GiftRegistryDetailPage({ params }: GiftRegistryDetailPageProps) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/perfil/listas-regalo")
  }

  const registry = await getGiftRegistryById(id)
  if (!registry || registry.user_id !== user.id) {
    redirect("/perfil/listas-regalo")
  }

  const status = STATUS_LABELS[registry.status] || STATUS_LABELS.active
  const items = registry.gift_registry_items || []

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button variant="ghost" asChild className="w-fit">
          <Link href="/perfil/listas-regalo">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a listas
          </Link>
        </Button>

        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Gift className="h-8 w-8" />
              {registry.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              {EVENT_TYPE_LABELS[registry.event_type] || "Evento"} · {formatDate(registry.event_date)}
            </p>
          </div>
          <Badge className={`${status.color} text-white`}>{status.label}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del evento</CardTitle>
          <CardDescription>Datos generales de tu lista</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Tipo de evento</p>
              <p className="font-medium">{EVENT_TYPE_LABELS[registry.event_type] || "No definido"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha del evento</p>
              <p className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(registry.event_date)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pareja / anfitrión(a)</p>
              <p className="font-medium">{registry.partner_name || "No especificado"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Productos en la lista</p>
              <p className="font-medium">{items.length}</p>
            </div>
          </div>

          {registry.description ? (
            <div>
              <p className="text-sm text-muted-foreground">Descripción</p>
              <p>{registry.description}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={`/lista/${registry.share_token}`} target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4 mr-2" />
                Ver lista
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/lista/${registry.share_token}`}>
                <Share2 className="h-4 w-4 mr-2" />
                Ver lista
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Productos de la lista</CardTitle>
          <CardDescription>Seguimiento de regalos deseados y comprados</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no has agregado productos a esta lista.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item: any) => {
                const product = item.product
                if (!product) return null

                const desired = Number(item.quantity_desired || 0)
                const purchased = Number(item.quantity_purchased || 0)
                const remaining = Math.max(desired - purchased, 0)

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
                      <p className="text-sm text-muted-foreground">
                        ${Number(product.precio || 0).toLocaleString("es-CO")} · Deseados: {desired} · Regalados: {purchased}
                      </p>
                      <p className="text-sm mt-1">
                        {remaining > 0 ? `${remaining} pendiente${remaining > 1 ? "s" : ""}` : "Completado"}
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
