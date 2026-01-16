import { Suspense } from "react"
import { ClientsManagement } from "@/components/admin/clients-management"

export default async function ClientsPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestión de Clientes</h2>
            <p className="text-muted-foreground">
              Administra empresas clientes, contactos y asignaciones de distribuidores
            </p>
          </div>
        </div>

        <Suspense fallback={<div>Cargando clientes...</div>}>
          <ClientsManagement />
        </Suspense>
      </div>
    </div>
  )
}
