import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Gift, Search, Calendar, Users, Eye, Trash2 } from "lucide-react"
import Link from "next/link"

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: "Activa", color: "bg-green-500" },
  completed: { label: "Completada", color: "bg-blue-500" },
  expired: { label: "Expirada", color: "bg-gray-500" },
  cancelled: { label: "Cancelada", color: "bg-red-500" },
}

const eventTypeLabels: Record<string, string> = {
  wedding: "Boda",
  baby_shower: "Baby Shower",
  birthday: "Cumpleaños",
  housewarming: "Inauguración",
  other: "Otro",
}

export default async function AdminGiftRegistriesPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string }
}) {
  const supabase = await createClient()

  let query = supabase
    .from("gift_registries")
    .select(`
      *,
      user_profiles:user_id (full_name, email:id),
      gift_registry_items (count)
    `)
    .order("created_at", { ascending: false })

  if (searchParams.q) {
    query = query.ilike("name", `%${searchParams.q}%`)
  }

  if (searchParams.status) {
    query = query.eq("status", searchParams.status)
  }

  const { data: registries } = await query.limit(50)

  // Estadísticas
  const { count: totalActive } = await supabase
    .from("gift_registries")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")

  const { count: totalAll } = await supabase
    .from("gift_registries")
    .select("*", { count: "exact", head: true })

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Listas de Regalo</h1>
        <p className="text-muted-foreground">
          Administra las listas de bodas y eventos
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Listas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAll || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Listas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalActive || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                name="q"
                placeholder="Buscar por nombre..."
                defaultValue={searchParams.q}
              />
            </div>
            <select
              name="status"
              className="px-3 py-2 border rounded-md bg-background"
              defaultValue={searchParams.status}
            >
              <option value="">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="completed">Completadas</option>
              <option value="expired">Expiradas</option>
              <option value="cancelled">Canceladas</option>
            </select>
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Registries List */}
      <Card>
        <CardHeader>
          <CardTitle>Listas Registradas</CardTitle>
          <CardDescription>
            {registries?.length || 0} listas encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!registries || registries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay listas de regalo registradas
            </p>
          ) : (
            <div className="space-y-4">
              {registries.map((registry: any) => {
                const status = statusLabels[registry.status] || statusLabels.active
                const itemCount = registry.gift_registry_items?.[0]?.count || 0

                return (
                  <div
                    key={registry.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{registry.name}</h3>
                        <Badge className={`${status.color} text-white text-xs`}>
                          {status.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {eventTypeLabels[registry.event_type] || "Evento"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {registry.user_profiles?.full_name || "Usuario"}
                          {registry.partner_name && ` & ${registry.partner_name}`}
                        </span>
                        {registry.event_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(registry.event_date)}
                          </span>
                        )}
                        <span>{itemCount} productos</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/lista/${registry.share_token}`} target="_blank">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
