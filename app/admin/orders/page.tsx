import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import OrdersManagement from "@/components/admin/orders-management"

export default async function AdminOrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Verificar que es superadmin
  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "superadmin") {
    redirect("/")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestión de Órdenes</h1>
        <p className="text-muted-foreground">
          Administra todas las órdenes de compra, aprueba pedidos y gestiona el estado de envíos
        </p>
      </div>
      <OrdersManagement userRole="superadmin" userId={user.id} />
    </div>
  )
}
