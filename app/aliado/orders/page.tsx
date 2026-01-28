import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { CreateOrderForDistributorForm } from "@/components/aliado/create-order-for-distributor-form"

export default async function AliadoOrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Obtener aliado
  const { data: aliado } = await supabase
    .from("aliados")
    .select("*")
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

  // Obtener distribuidores asignados al aliado
  const admin = createAdminClient()
  const { data: distributors, error: distributorsError } = await admin
    .from("distributors")
    .select("id, company_name, discount_percentage, contact_email, contact_phone, is_active, user_id")
    .eq("aliado_id", aliado.id)
    .eq("is_active", true)
    .order("company_name")

  if (distributorsError) {
    console.error("Error loading aliado active clients for orders:", distributorsError)
  }

  const safeDistributors = distributorsError ? [] : distributors || []

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Crear Pedido para Cliente</h1>
        <p className="text-muted-foreground">
          Crea pedidos a nombre de tus clientes asignados
        </p>
      </div>

      {safeDistributors.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tienes clientes activos asignados. Contacta al administrador para que te asigne clientes.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo Pedido</CardTitle>
            <CardDescription>
              Selecciona el cliente y agrega los productos al pedido
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateOrderForDistributorForm 
              distributors={safeDistributors}
              aliadoId={aliado.id}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
