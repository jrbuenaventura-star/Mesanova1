import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserGiftRegistries } from "@/lib/db/user-features"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gift, Plus, Calendar, Eye, Settings } from "lucide-react"
import Link from "next/link"
import { ShareButton } from "@/components/ui/share-button"

const eventTypeLabels: Record<string, string> = {
  wedding: "Boda",
  baby_shower: "Baby Shower",
  birthday: "Cumpleaños",
  housewarming: "Inauguración de Casa",
  other: "Otro",
}

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "Borrador", color: "bg-amber-500" },
  borrador: { label: "Borrador", color: "bg-amber-500" },
  active: { label: "Activa", color: "bg-green-500" },
  completed: { label: "Completada", color: "bg-blue-500" },
  expired: { label: "Expirada", color: "bg-gray-500" },
  cancelled: { label: "Cancelada", color: "bg-red-500" },
}

export default async function ListasRegaloPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/perfil/listas-regalo")
  }

  const registries = await getUserGiftRegistries(user.id)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gift className="h-8 w-8" />
            Listas de Regalo
          </h1>
          <p className="text-muted-foreground mt-2">
            Crea listas para bodas, baby showers y más
          </p>
        </div>
        <Button asChild>
          <Link href="/perfil/listas-regalo/nueva">
            <Plus className="h-4 w-4 mr-2" />
            Nueva lista
          </Link>
        </Button>
      </div>

      {registries.length === 0 ? (
        <Card className="p-12 text-center">
          <Gift className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No tienes listas de regalo</h2>
          <p className="text-muted-foreground mb-6">
            Crea una lista para tu boda, baby shower o cualquier evento especial
          </p>
          <Button asChild>
            <Link href="/perfil/listas-regalo/nueva">
              <Plus className="h-4 w-4 mr-2" />
              Nueva lista
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {registries.map((registry: any) => {
            const status = statusLabels[registry.status] || statusLabels.active
            const itemCount = registry.gift_registry_items?.[0]?.count || 0
            const publicListUrl = registry.share_token ? `/lista/${registry.share_token}` : null

            return (
              <Card key={registry.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{registry.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {eventTypeLabels[registry.event_type] || "Evento"}
                      </p>
                    </div>
                    <Badge className={`${status.color} text-white`}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {registry.event_date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Calendar className="h-4 w-4" />
                      {formatDate(registry.event_date)}
                    </div>
                  )}

                  <p className="text-sm mb-4">
                    {itemCount} producto{itemCount !== 1 ? "s" : ""} en la lista
                  </p>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/perfil/listas-regalo/${registry.id}`}>
                        <Settings className="h-4 w-4 mr-1" />
                        Gestionar
                      </Link>
                    </Button>
                    {publicListUrl ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={publicListUrl} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver lista
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        <Eye className="h-4 w-4 mr-1" />
                        Ver lista
                      </Button>
                    )}
                    <ShareButton
                      variant="ghost"
                      size="sm"
                      iconOnly
                      label="Compartir lista"
                      url={publicListUrl || undefined}
                      title={registry.name}
                      text={`Mira esta lista de regalos en Mesanova: ${registry.name}`}
                      disabled={!publicListUrl}
                    />
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
