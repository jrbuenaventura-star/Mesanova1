import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Building2, Mail, MapPin, Phone, UserPlus, Calendar } from "lucide-react"

type LeadDetailPageProps = {
  params: { id: string }
}

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

function formatDate(value?: string | null) {
  if (!value) return "No registrada"
  return new Date(value).toLocaleString("es-CO")
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: aliado } = await supabase.from("aliados").select("id").eq("user_id", user.id).single()
  if (!aliado) {
    redirect("/")
  }

  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", params.id)
    .eq("aliado_id", aliado.id)
    .maybeSingle()

  if (!lead) {
    redirect("/aliado/leads")
  }

  const { data: activities } = await supabase
    .from("lead_activities")
    .select("*")
    .eq("lead_id", lead.id)
    .order("created_at", { ascending: false })
    .limit(20)

  const stageInfo = STAGE_CONFIG[lead.stage] || { label: lead.stage || "Sin etapa", color: "bg-muted text-foreground" }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="space-y-4">
        <Button variant="ghost" asChild className="w-fit">
          <Link href="/aliado/leads">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Ver CRM
          </Link>
        </Button>

        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{lead.company_name}</h1>
            <p className="text-muted-foreground">Lead ID: {lead.id}</p>
          </div>
          <Badge className={stageInfo.color}>{stageInfo.label}</Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información del lead
            </CardTitle>
            <CardDescription>Datos comerciales y de contacto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Empresa</p>
                <p className="font-medium">{lead.company_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de negocio</p>
                <p className="font-medium">{lead.business_type || "No especificado"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contacto</p>
                <p className="font-medium">{lead.contact_name || "No especificado"}</p>
                {lead.contact_position ? <p className="text-sm text-muted-foreground">{lead.contact_position}</p> : null}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ubicación</p>
                <p className="font-medium">{lead.city || "Sin ciudad"}</p>
                <p className="text-sm text-muted-foreground">{lead.state || "Sin departamento"}</p>
              </div>
            </div>

            {lead.address ? (
              <div>
                <p className="text-sm text-muted-foreground">Dirección</p>
                <p className="font-medium">{lead.address}</p>
              </div>
            ) : null}

            {lead.notes ? (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Notas</p>
                  <p>{lead.notes}</p>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lead.contact_email ? (
              <Button variant="outline" asChild className="w-full justify-start">
                <a href={`mailto:${lead.contact_email}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar email
                </a>
              </Button>
            ) : null}
            {lead.contact_phone ? (
              <Button variant="outline" asChild className="w-full justify-start">
                <a href={`tel:${lead.contact_phone}`}>
                  <Phone className="mr-2 h-4 w-4" />
                  Llamar
                </a>
              </Button>
            ) : null}

            <Separator />

            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Creado: {formatDate(lead.created_at)}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <UserPlus className="h-4 w-4" />
                Actualizado: {formatDate(lead.updated_at)}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Próximo seguimiento: {formatDate(lead.next_follow_up_date)}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Último contacto: {formatDate(lead.last_contact_date)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
          <CardDescription>Historial de cambios y acciones sobre este lead</CardDescription>
        </CardHeader>
        <CardContent>
          {!activities || activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay actividades registradas.</p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="rounded-lg border p-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium text-sm">{activity.activity_type || "actividad"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(activity.created_at)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                  {activity.old_stage || activity.new_stage ? (
                    <p className="text-xs mt-2 text-muted-foreground">
                      Etapa: {activity.old_stage || "N/A"} → {activity.new_stage || "N/A"}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
