import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { AliadoProfileForm } from "@/components/aliado/profile-form"

export default async function AliadoProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: aliado } = await supabase
    .from("aliados")
    .select("id, company_name, contact_name, email, phone")
    .eq("user_id", user.id)
    .single()

  if (!aliado) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tienes un perfil de aliado configurado. Contacta al administrador.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("id, full_name, phone")
    .eq("id", user.id)
    .single()

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">Administra la información de tu cuenta</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del aliado</CardTitle>
          <CardDescription>Actualiza la información de contacto</CardDescription>
        </CardHeader>
        <CardContent>
          <AliadoProfileForm aliado={aliado} userProfile={userProfile || { id: user.id, full_name: null, phone: null }} />
        </CardContent>
      </Card>
    </div>
  )
}
