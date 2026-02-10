import { createClient } from "@/lib/supabase/server"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientsDashboard } from "@/components/admin/clients-dashboard"
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
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clientes</h1>
        <p className="text-muted-foreground">
          Gestiona clientes, estadísticas de compra y segmentación
        </p>
      </div>
      <Tabs defaultValue="stats" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stats">Estadísticas y Filtros</TabsTrigger>
          <TabsTrigger value="manage">Gestionar Clientes</TabsTrigger>
        </TabsList>
        <TabsContent value="stats">
          <ClientsDashboard />
        </TabsContent>
        <TabsContent value="manage">
          <DistributorsManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
