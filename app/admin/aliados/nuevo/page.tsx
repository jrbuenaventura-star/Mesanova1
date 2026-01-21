import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AliadoCreateForm } from "@/components/admin/aliado-create-form"

export default async function NuevoAliadoPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "superadmin") {
    redirect("/")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo Aliado</CardTitle>
          <CardDescription>Crear aliado y enviar invitación por email</CardDescription>
        </CardHeader>
        <CardContent>
          <AliadoCreateForm />
        </CardContent>
      </Card>
    </div>
  )
}
