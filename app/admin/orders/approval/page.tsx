import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { OrdersApproval } from "@/components/admin/orders-approval"

export default async function OrdersApprovalPage() {
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

  // Obtener órdenes pendientes de aprobación con relaciones
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      *,
      distributor:distributors(id, company_name, discount_percentage),
      aliado:aliados(id, company_name, contact_name),
      user:user_profiles(id, full_name)
    `)
    .eq("status", "por_aprobar")
    .order("created_at", { ascending: false })

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Aprobación de Órdenes</h1>
        <p className="text-muted-foreground">
          Revisa y aprueba las órdenes creadas por aliados
        </p>
      </div>

      <OrdersApproval orders={orders || []} userId={user.id} />
    </div>
  )
}
