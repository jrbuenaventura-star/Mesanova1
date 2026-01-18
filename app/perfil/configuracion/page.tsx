import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getNotificationPreferences } from "@/lib/db/user-features"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Settings, Bell, Mail, Shield } from "lucide-react"
import { NotificationPreferencesForm } from "@/components/profile/notification-preferences-form"

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/perfil/configuracion")
  }

  const preferences = await getNotificationPreferences(user.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Configuración
        </h1>
        <p className="text-muted-foreground mt-2">
          Administra tus preferencias de cuenta
        </p>
      </div>

      {/* Preferencias de notificación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones por Email
          </CardTitle>
          <CardDescription>
            Elige qué emails quieres recibir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPreferencesForm preferences={preferences} />
        </CardContent>
      </Card>

      {/* Información de cuenta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Información de Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Email</Label>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">ID de usuario</Label>
            <p className="font-mono text-sm text-muted-foreground">{user.id}</p>
          </div>
        </CardContent>
      </Card>

      {/* Seguridad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Para cambiar tu contraseña o eliminar tu cuenta, contacta a soporte.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
