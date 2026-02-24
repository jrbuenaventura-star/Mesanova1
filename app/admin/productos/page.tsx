import ProductsAdminPage from "@/app/admin/products/page"
import CSVProductsPage from "@/app/admin/productos/csv/page"
import PriceIntelligenceAdminPage from "@/app/admin/productos/analisis-precios/page"
import { AdminSectionTabs, type AdminSectionTab } from "@/components/admin/admin-section-tabs"

const PRODUCTOS_TABS: AdminSectionTab[] = [
  { value: "productos", label: "Productos" },
  { value: "productos-csv", label: "Productos CSV" },
  { value: "analisis-precios-ia", label: "Análisis Precios IA" },
]

export default async function AdminProductosTabsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const currentTab = PRODUCTOS_TABS.some((tab) => tab.value === params.tab) ? (params.tab as string) : "productos"

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold">Productos</h1>
        <p className="text-muted-foreground">Gestiona catálogo y carga masiva desde una misma pantalla.</p>
      </div>

      <AdminSectionTabs basePath="/admin/productos" activeTab={currentTab} tabs={PRODUCTOS_TABS} />

      {currentTab === "productos" && <ProductsAdminPage />}
      {currentTab === "productos-csv" && <CSVProductsPage />}
      {currentTab === "analisis-precios-ia" && <PriceIntelligenceAdminPage />}
    </div>
  )
}
