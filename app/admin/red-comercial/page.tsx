import DistributorsPage from "@/app/admin/distributors/page"
import CSVDistributorsPage from "@/app/admin/distributors/csv/page"
import AliadosManagementPage from "@/app/admin/aliados/page"
import { AdminSectionTabs, type AdminSectionTab } from "@/components/admin/admin-section-tabs"

const RED_COMERCIAL_TABS: AdminSectionTab[] = [
  { value: "clientes", label: "Clientes" },
  { value: "clientes-csv", label: "Clientes CSV" },
  { value: "aliados", label: "Aliados" },
]

export default async function AdminRedComercialTabsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const currentTab = RED_COMERCIAL_TABS.some((tab) => tab.value === params.tab) ? (params.tab as string) : "clientes"

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold">Red Comercial</h1>
        <p className="text-muted-foreground">Administra clientes, importaciones CSV y aliados desde una sola vista.</p>
      </div>

      <AdminSectionTabs basePath="/admin/red-comercial" activeTab={currentTab} tabs={RED_COMERCIAL_TABS} />

      {currentTab === "clientes" && <DistributorsPage />}
      {currentTab === "clientes-csv" && <CSVDistributorsPage />}
      {currentTab === "aliados" && <AliadosManagementPage />}
    </div>
  )
}
