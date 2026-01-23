import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { AliadoStatsDashboard } from "@/components/aliado/stats-dashboard"

export default async function AliadoStatsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: aliado } = await supabase
    .from("aliados")
    .select("id, company_name")
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

  const { data: distributors } = await supabase
    .from("distributors")
    .select("id, company_name, is_active, last_purchase_date, total_purchases")
    .eq("aliado_id", aliado.id)
    .order("total_purchases", { ascending: false })

  let leads: any[] = []
  try {
    const { data } = await supabase
      .from("leads")
      .select("id, stage, next_follow_up_date")
      .eq("aliado_id", aliado.id)
    leads = data || []
  } catch (e) {
    leads = []
  }

  const distributorsList = distributors || []
  const totalDistributors = distributorsList.length
  const activeDistributors = distributorsList.filter((d) => d.is_active).length
  const totalSales = distributorsList.reduce((sum, d) => sum + (d.total_purchases || 0), 0)

  const leadsByStage: Record<string, number> = {}
  leads.forEach((lead) => {
    const stage = lead.stage || "sin_etapa"
    leadsByStage[stage] = (leadsByStage[stage] || 0) + 1
  })

  const pendingFollowUps = leads.filter((lead) => {
    if (!lead.next_follow_up_date) return false
    return new Date(lead.next_follow_up_date) <= new Date()
  }).length

  return (
    <div className="container mx-auto py-8 px-4">
      <AliadoStatsDashboard
        summary={{
          companyName: aliado.company_name,
          distributors: {
            total: totalDistributors,
            active: activeDistributors,
            totalSales,
            top: distributorsList.slice(0, 10),
          },
          leads: {
            total: leads.length,
            byStage: leadsByStage,
            pendingFollowUps,
          },
        }}
      />
    </div>
  )
}
