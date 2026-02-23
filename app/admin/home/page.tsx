import BannerHomePage from "@/app/admin/banner-home/page"
import ProductosDestacadosPage from "@/app/admin/productos-destacados/page"
import { AdminSectionTabs, type AdminSectionTab } from "@/components/admin/admin-section-tabs"

const HOME_TABS: AdminSectionTab[] = [
  { value: "banner-home", label: "Banner de inicio" },
  { value: "productos-destacados", label: "Productos destacados" },
]

export default async function AdminHomeTabsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const currentTab = HOME_TABS.some((tab) => tab.value === params.tab) ? (params.tab as string) : "banner-home"

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold">Inicio</h1>
        <p className="text-muted-foreground">Gestiona el contenido principal de la página de inicio desde un solo lugar.</p>
      </div>

      <AdminSectionTabs basePath="/admin/home" activeTab={currentTab} tabs={HOME_TABS} />

      {currentTab === "banner-home" ? <BannerHomePage /> : <ProductosDestacadosPage />}
    </div>
  )
}
