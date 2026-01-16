import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import CreateOrderForm from "@/components/distributor/create-order-form"

export default async function NewOrderPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Obtener distribuidor
  const { data: distributor } = await supabase.from("distributors").select("*").eq("user_id", user.id).single()

  if (!distributor) {
    return <div>No tienes un perfil de distribuidor configurado</div>
  }

  // Obtener clientes asignados
  const { data: companies } = await supabase
    .from("companies")
    .select("*")
    .eq("distribuidor_asignado_id", distributor.id)
    .eq("is_active", true)
    .order("razon_social")

  // Obtener productos activos
  const { data: products } = await supabase
    .from("products")
    .select("id, pdt_codigo, pdt_descripcion, nombre_comercial, precio, imagen_principal_url, upp_existencia")
    .eq("is_active", true)
    .order("pdt_descripcion")

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Nueva Orden</h1>
        <p className="text-muted-foreground">Crea una nueva orden para uno de tus clientes</p>
      </div>
      <CreateOrderForm
        distributorId={distributor.id}
        companies={companies || []}
        products={products || []}
        userId={user.id}
      />
    </div>
  )
}
