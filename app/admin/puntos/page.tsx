import { redirect } from "next/navigation"

import { LoyaltyManagementDashboard } from "@/components/admin/loyalty-management-dashboard"
import { createClient } from "@/lib/supabase/server"

export default async function AdminPointsPage() {
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
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Puntos</h1>
        <p className="text-muted-foreground">
          Administra reglas del programa, aplica ajustes manuales y audita transacciones con filtros/exportación.
        </p>
      </div>
      <LoyaltyManagementDashboard />
    </div>
  )
}
