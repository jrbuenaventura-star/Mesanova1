import AdminOrdersPage from "@/app/admin/orders/page"
import OrdersApprovalPage from "@/app/admin/orders/approval/page"
import DeliveryConfirmationsPage from "@/app/admin/orders/delivery-confirmations/page"
import { AdminSectionTabs, type AdminSectionTab } from "@/components/admin/admin-section-tabs"

const ORDENES_TABS: AdminSectionTab[] = [
  { value: "ordenes", label: "Órdenes" },
  { value: "aprobar-ordenes", label: "Aprobar Órdenes" },
  { value: "confirmacion-entrega-qr", label: "Confirmación Entrega QR" },
]

export default async function AdminOrdenesTabsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const currentTab = ORDENES_TABS.some((tab) => tab.value === params.tab) ? (params.tab as string) : "ordenes"

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold">Órdenes</h1>
        <p className="text-muted-foreground">Centraliza gestión y aprobación de órdenes en un flujo único.</p>
      </div>

      <AdminSectionTabs basePath="/admin/ordenes" activeTab={currentTab} tabs={ORDENES_TABS} />

      {currentTab === "ordenes" && <AdminOrdersPage />}
      {currentTab === "aprobar-ordenes" && <OrdersApprovalPage />}
      {currentTab === "confirmacion-entrega-qr" && <DeliveryConfirmationsPage />}
    </div>
  )
}
