import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DistributorClientsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Obtener distribuidor
  const { data: distributor } = await supabase
    .from("distributors")
    .select("id, company_name")
    .eq("user_id", user.id)
    .single()

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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mis Clientes</h1>
        <p className="text-muted-foreground">Clientes asignados a {distributor.company_name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies?.map((company) => (
          <div key={company.id} className="border rounded-lg p-4">
            <h3 className="font-semibold">{company.razon_social}</h3>
            {company.nombre_comercial && <p className="text-sm text-muted-foreground">{company.nombre_comercial}</p>}
            <div className="mt-2 space-y-1 text-sm">
              <p>
                <strong>NIT:</strong> {company.nit}
              </p>
              {company.ciudad && (
                <p>
                  <strong>Ciudad:</strong> {company.ciudad}
                </p>
              )}
              {company.telefono_principal && (
                <p>
                  <strong>Tel:</strong> {company.telefono_principal}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
