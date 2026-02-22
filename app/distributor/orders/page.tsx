import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import OrdersManagement from "@/components/admin/orders-management"

export default async function DistributorOrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Verificar que es distribuidor
  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "distributor") {
    redirect("/")
  }

  // Obtener distribuidor
  const { data: distributor } = await supabase.from("distributors").select("id").eq("user_id", user.id).single()

  if (!distributor) {
    return <div>No tienes un perfil de distribuidor configurado</div>
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mis Órdenes</h1>
        <p className="text-muted-foreground">Crea y gestiona órdenes para tu negocio</p>
      </div>
      <OrdersManagement userRole="distributor" userId={user.id} distributorId={distributor.id} />
    </div>
  )
}
