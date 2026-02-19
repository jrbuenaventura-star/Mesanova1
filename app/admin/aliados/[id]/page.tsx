import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Building2, Users } from "lucide-react"
import { AliadoEditForm } from "@/components/admin/aliado-edit-form"

export default async function EditAliadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "superadmin") {
    redirect("/")
  }

  const { data: aliado } = await supabase
    .from("aliados")
    .select("*")
    .eq("id", id)
    .single()

  if (!aliado) {
    notFound()
  }

  let distributorCount = 0
  try {
    const { count } = await supabase
      .from("distributors")
      .select("*", { count: "exact", head: true })
      .eq("aliado_id", aliado.id)
    distributorCount = count || 0
  } catch (e) {
    // Columna aún no existe
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild aria-label="Abrir enlace">
          <Link href="/admin/aliados">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Editar Aliado</h1>
          <p className="text-muted-foreground">
            Actualiza la información del aliado comercial
          </p>
        </div>
        <Badge variant={aliado.is_active ? "default" : "secondary"}>
          {aliado.is_active ? "Activo" : "Inactivo"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Información del Aliado
              </CardTitle>
              <CardDescription>
                Modifica los datos comerciales y configuración del aliado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AliadoEditForm aliado={aliado} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Clientes asignados</p>
                <p className="text-2xl font-bold">{distributorCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ventas totales</p>
                <p className="text-2xl font-bold">
                  ${(aliado.total_sales || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Comisión</p>
                <p className="text-2xl font-bold">{aliado.commission_percentage}%</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/admin/aliados/${aliado.id}/distributors`} aria-label="Ver clientes">
                  <Users className="mr-2 h-4 w-4" />
                  Ver clientes ({distributorCount})
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
