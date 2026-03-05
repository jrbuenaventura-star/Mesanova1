import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

import { createClient } from "@/lib/supabase/server"
import { getGiftRegistryById } from "@/lib/db/user-features"
import { deleteGiftRegistryAction } from "@/lib/actions/gift-registry"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShareButton } from "@/components/ui/share-button"
import { GiftRegistrySettingsForm } from "@/components/profile/gift-registry-settings-form"

import { ArrowLeft, Eye, Gift, Trash2 } from "lucide-react"

type GiftRegistryDetailPageProps = {
  params: Promise<{ id: string }>
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Borrador", color: "bg-amber-500" },
  borrador: { label: "Borrador", color: "bg-amber-500" },
  active: { label: "Activa", color: "bg-green-500" },
  archived: { label: "Archivada", color: "bg-zinc-600" },
  completed: { label: "Completada", color: "bg-blue-500" },
  expired: { label: "Expirada", color: "bg-gray-500" },
  cancelled: { label: "Cancelada", color: "bg-red-500" },
}

function getPrivacyLabel(isSearchable?: boolean | null) {
  return isSearchable === false ? "Privada" : "Pública"
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
  const publicListUrl = registry.share_token ? `/lista/${registry.share_token}` : null
  const canSharePublicly = registry.status === "active" && !!publicListUrl

  async function deleteRegistryFormAction() {
    "use server"
    const result = await deleteGiftRegistryAction(id)
    if (!result?.error) {
      redirect("/perfil/listas-regalo")
    }
  }

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
            <p className="text-muted-foreground mt-1">Gestiona estado, privacidad y datos del evento</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`${status.color} text-white`}>{status.label}</Badge>
            <form action={deleteRegistryFormAction}>
              <Button type="submit" variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </form>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del evento</CardTitle>
          <CardDescription>Edita los datos del evento y el estado de la lista</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Productos en la lista</p>
              <p className="font-semibold text-lg">{items.length}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Privacidad</p>
              <p className="font-semibold text-lg">{getPrivacyLabel(registry.is_searchable)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Estado actual</p>
              <p className="font-semibold text-lg">{status.label}</p>
            </div>
          </div>

          <GiftRegistrySettingsForm
            registryId={id}
            initialData={{
              name: registry.name,
              event_type: registry.event_type,
              event_date: registry.event_date,
              partner_name: registry.partner_name,
              description: registry.description,
              event_address: registry.event_address,
              notification_email: registry.notification_email,
              status: registry.status,
              is_searchable: registry.is_searchable,
            }}
          />

          <div className="flex flex-wrap gap-2 pt-2">
            {canSharePublicly ? (
              <Button variant="outline" asChild>
                <Link href={publicListUrl || "#"}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver lista pública
                </Link>
              </Button>
            ) : (
              <Button variant="outline" disabled>
                <Eye className="h-4 w-4 mr-2" />
                Ver lista pública
              </Button>
            )}
            <ShareButton
              variant="outline"
              url={publicListUrl || undefined}
              title={registry.name}
              text={`Mira esta lista de regalos en Mesanova: ${registry.name}`}
              label="Compartir lista"
              disabled={!canSharePublicly}
            />
          </div>

          {!canSharePublicly && (
            <p className="text-sm text-muted-foreground">
              Esta lista debe estar en estado <span className="font-medium">Activa</span> para poder compartirse públicamente.
            </p>
          )}
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
                      {item.notes ? <p className="text-xs text-muted-foreground mt-1 italic">&ldquo;{item.notes}&rdquo;</p> : null}
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
