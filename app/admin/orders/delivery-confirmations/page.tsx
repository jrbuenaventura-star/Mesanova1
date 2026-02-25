import { redirect } from "next/navigation"

import { DeliveryConfirmationsDashboard } from "@/components/admin/delivery-confirmations-dashboard"
import { createClient } from "@/lib/supabase/server"

export default async function DeliveryConfirmationsPage() {
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
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Confirmación de Entrega QR</h1>
        <p className="text-muted-foreground">
          Controla la trazabilidad legal de entregas, incidencias y sincronización offline.
        </p>
      </div>
      <DeliveryConfirmationsDashboard />
    </div>
  )
}
