import { createClient } from "@/lib/supabase/server"
import { DistributorsManagement } from "@/components/admin/distributors-management"

export default async function DistributorsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Distribuidores</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona los distribuidores, sus datos de contacto y clientes asignados
        </p>
      </div>
      <DistributorsManagement />
    </div>
  )
}
