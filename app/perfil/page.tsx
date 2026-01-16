import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Calendar, ShieldCheck, LogOut, Settings, LayoutDashboard } from "lucide-react"
import Link from "next/link"

export default async function PerfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userProfile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "No disponible"
    try {
      return new Date(dateString).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return "No disponible"
    }
  }

  const getRoleDisplay = (role: string | null) => {
    const roles = {
      superadmin: { name: "Superadministrador", color: "bg-red-500" },
      distributor: { name: "Distribuidor", color: "bg-blue-500" },
      end_user: { name: "Usuario Final", color: "bg-green-500" },
    }
    return roles[role as keyof typeof roles] || { name: "Usuario", color: "bg-gray-500" }
  }

  const roleInfo = getRoleDisplay(userProfile?.role)
  const displayName =
    userProfile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Usuario"

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/")
  }

  return (
    <div className="container max-w-5xl py-12 px-4">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Mi Perfil</h1>
          <p className="text-muted-foreground mt-2">Información de tu cuenta</p>
        </div>
        <Badge className={`${roleInfo.color} text-white h-8 px-4 text-sm font-semibold`}>{roleInfo.name}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Profile Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
            <CardDescription>Detalles de tu cuenta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Nombre Completo</label>
                <p className="text-lg font-semibold">{displayName}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Correo Electrónico
                </label>
                <p className="text-lg font-semibold break-all">{user.email}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Tipo de Cuenta
                </label>
                <p className="text-lg font-semibold">{roleInfo.name}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Miembro desde
                </label>
                <p className="text-lg font-semibold">{formatDate(userProfile?.created_at || user.created_at)}</p>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Estado de la Cuenta</label>
              <Badge variant={userProfile?.is_active ? "default" : "destructive"}>
                {userProfile?.is_active ? "Activa" : "Inactiva"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Actions Sidebar */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {userProfile?.role === "superadmin" && (
                <Button asChild className="w-full" variant="default">
                  <Link href="/admin">
                    <Settings className="h-4 w-4 mr-2" />
                    Panel Admin
                  </Link>
                </Button>
              )}

              {userProfile?.role === "distributor" && (
                <Button asChild className="w-full" variant="default">
                  <Link href="/distribuidor/dashboard">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Mi Dashboard
                  </Link>
                </Button>
              )}

              <form action={handleSignOut} className="w-full">
                <Button type="submit" variant="destructive" className="w-full">
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Role-specific Info */}
          {userProfile?.role === "distributor" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de Distribuidor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Accede a precios especiales, gestiona pedidos y consulta estadísticas desde tu dashboard.
                </p>
              </CardContent>
            </Card>
          )}

          {userProfile?.role === "superadmin" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Privilegios de Admin</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Gestionar usuarios</li>
                  <li>• Administrar productos</li>
                  <li>• Editar blog</li>
                  <li>• Configuración del sitio</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
