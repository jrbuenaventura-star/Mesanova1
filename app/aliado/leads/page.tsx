import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  UserPlus, 
  Search,
  Phone,
  Mail,
  Building2,
  Calendar,
  ChevronRight
} from "lucide-react"

const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  prospecto: { label: "Prospecto", color: "bg-gray-100 text-gray-800" },
  contactado: { label: "Contactado", color: "bg-blue-100 text-blue-800" },
  interesado: { label: "Interesado", color: "bg-cyan-100 text-cyan-800" },
  docs_comerciales_enviados: { label: "Docs. comerciales enviados", color: "bg-indigo-100 text-indigo-800" },
  docs_analisis_solicitados: { label: "Docs. análisis solicitados", color: "bg-purple-100 text-purple-800" },
  docs_analisis_recibidos: { label: "Docs. análisis recibidos", color: "bg-pink-100 text-pink-800" },
  aprobado: { label: "Aprobado", color: "bg-green-100 text-green-800" },
  rechazado: { label: "Rechazado", color: "bg-red-100 text-red-800" },
}

export default async function LeadsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Obtener aliado
  const { data: aliado } = await supabase
    .from("aliados")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!aliado) {
    redirect("/")
  }

  // Obtener leads
  let leads: any[] = []
  try {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("aliado_id", aliado.id)
      .order("updated_at", { ascending: false })
    leads = data || []
  } catch (e) {
    // Tabla aún no existe
  }

  // Agrupar leads por etapa
  const leadsByStage = Object.keys(STAGE_CONFIG).reduce((acc, stage) => {
    acc[stage] = leads.filter(l => l.stage === stage)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">CRM - Leads</h1>
          <p className="text-muted-foreground">Gestiona tus prospectos de distribuidores</p>
        </div>
        <Button asChild>
          <Link href="/aliado/leads/nuevo">
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo lead
          </Link>
        </Button>
      </div>

      {/* Búsqueda */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar leads..." className="pl-10" />
        </div>
      </div>

      {/* Pipeline Kanban */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {Object.entries(STAGE_CONFIG).map(([stage, config]) => {
            const stageLeads = leadsByStage[stage] || []
            return (
              <div key={stage} className="w-72 flex-shrink-0">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
                      <Badge variant="secondary">{stageLeads.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {stageLeads.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-4">
                        Sin leads
                      </p>
                    ) : (
                      stageLeads.map((lead) => (
                        <Link 
                          key={lead.id} 
                          href={`/aliado/leads/${lead.id}`}
                          className="block"
                        >
                          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium text-sm truncate max-w-[150px]">
                                    {lead.company_name}
                                  </span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                              
                              {lead.contact_name && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {lead.contact_name}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {lead.contact_phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {lead.contact_phone}
                                  </span>
                                )}
                              </div>
                              
                              {lead.next_follow_up_date && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Calendar className="h-3 w-3" />
                                  <span className={
                                    new Date(lead.next_follow_up_date) <= new Date()
                                      ? "text-red-600 font-medium"
                                      : "text-muted-foreground"
                                  }>
                                    {new Date(lead.next_follow_up_date).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </Link>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lista alternativa para móviles */}
      <div className="md:hidden space-y-4">
        <h2 className="font-semibold">Todos los leads</h2>
        {leads.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No tienes leads registrados</p>
              <Button variant="link" asChild className="mt-2">
                <Link href="/aliado/leads/nuevo">Nuevo lead</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          leads.map((lead) => (
            <Link key={lead.id} href={`/aliado/leads/${lead.id}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{lead.company_name}</p>
                      <p className="text-sm text-muted-foreground">{lead.contact_name}</p>
                    </div>
                    <Badge className={STAGE_CONFIG[lead.stage]?.color || ""}>
                      {STAGE_CONFIG[lead.stage]?.label || lead.stage}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
