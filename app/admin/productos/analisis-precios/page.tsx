import { PriceIntelligenceDashboard } from "@/components/admin/price-intelligence-dashboard"

export default function PriceIntelligenceAdminPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Análisis de Precios IA</h2>
        <p className="text-muted-foreground">
          Compara precios Mesanova vs mercado colombiano y detecta diferencias relevantes frente a competidores de Alumar.
        </p>
      </div>
      <PriceIntelligenceDashboard />
    </div>
  )
}

