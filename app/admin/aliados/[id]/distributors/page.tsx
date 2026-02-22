import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react"
import { DistributorAliadoAssignmentActions } from "@/components/admin/distributor-aliado-assignment-actions"

type DistributorRow = {
  id: string
  user_id: string
  company_name: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  city: string | null
  state: string | null
  main_city: string | null
  main_state: string | null
  aliado_id: string | null
  is_active: boolean
  requires_approval: boolean
  created_at: string
}

export default async function AliadoDistributorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "superadmin") {
    redirect("/")
  }

  const admin = createAdminClient()

  const [{ data: aliado }, { data: distData, error: distError }, { data: aliadosData }] = await Promise.all([
    admin.from("aliados").select("id, company_name").eq("id", id).single(),
    admin
      .from("distributors")
      .select(
        "id, user_id, company_name, contact_name, contact_email, contact_phone, city, state, main_city, main_state, aliado_id, is_active, requires_approval, created_at",
      )
      .eq("aliado_id", id)
      .order("created_at", { ascending: false }),
    admin.from("aliados").select("id, company_name, is_active").order("company_name"),
  ])

  if (!aliado) {
    notFound()
  }

  if (distError) {
    console.error("Error loading aliado clients:", distError)
  }

  const distributors = ((distData as DistributorRow[] | null) || [])

  const userIds = distributors.map((d) => d.user_id).filter((v): v is string => Boolean(v))

  const [{ data: profilesData, error: profilesError }, { data: usersData, error: usersError }] = await Promise.all([
    userIds.length > 0
      ? admin.from("user_profiles").select("id, full_name, phone").in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ])

  if (profilesError) {
    console.error("Error loading user_profiles for aliado clients:", profilesError)
  }

  if (usersError) {
    console.error("Error loading auth users for aliado clients:", usersError)
  }

  const profileByUserId = new Map<string, { id: string; full_name: string | null; phone: string | null }>()
  for (const p of profilesData || []) {
    if (p?.id) {
      profileByUserId.set(p.id, {
        id: p.id,
        full_name: p.full_name || null,
        phone: p.phone || null,
      })
    }
  }

  const emailByUserId = new Map<string, string>()
  for (const authUser of usersData?.users || []) {
    if (authUser.id && authUser.email) {
      emailByUserId.set(authUser.id, authUser.email)
    }
  }

  const enrichedDistributors = distributors.map((dist) => ({
    ...dist,
    profile: profileByUserId.get(dist.user_id) || null,
    email: emailByUserId.get(dist.user_id) || dist.contact_email || null,
  }))

  const aliados = (aliadosData || []) as Array<{ id: string; company_name: string; is_active: boolean }>

  const activeCount = enrichedDistributors.filter((d) => d.is_active && !d.requires_approval).length
  const pendingCount = enrichedDistributors.filter((d) => d.requires_approval).length

  const getStatusBadge = (isActive: boolean, requiresApproval: boolean) => {
    if (requiresApproval) {
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          Pendiente
        </Badge>
      )
    }

    if (isActive) {
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          Activo
        </Badge>
      )
    }

    return (
      <Badge variant="secondary" className="gap-1">
        <XCircle className="h-3 w-3" />
        Inactivo
      </Badge>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild aria-label="Abrir enlace">
          <Link href={`/admin/aliados/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Clientes de {aliado.company_name}</h1>
          <p className="text-muted-foreground">Gestiona los clientes asignados a este aliado comercial</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrichedDistributors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Clientes</CardTitle>
          <CardDescription>Superadmin puede reasignar o desvincular aliado desde esta tabla</CardDescription>
        </CardHeader>
        <CardContent>
          {enrichedDistributors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay clientes asignados</p>
              <p className="text-sm">Este aliado aún no tiene clientes asociados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Gestión de aliado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedDistributors.map((distributor) => {
                  const phone = distributor.contact_phone || distributor.profile?.phone || "-"
                  const city = distributor.main_city || distributor.city
                  const state = distributor.main_state || distributor.state
                  const location = city || state ? [city, state].filter(Boolean).join(", ") : "-"

                  return (
                    <TableRow key={distributor.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{distributor.company_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{distributor.contact_name || distributor.profile?.full_name || "-"}</TableCell>
                      <TableCell>
                        {distributor.email ? (
                          <a href={`mailto:${distributor.email}`} className="text-primary hover:underline flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {distributor.email}
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {phone !== "-" ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {phone}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {location !== "-" ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {location}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(distributor.is_active, distributor.requires_approval)}</TableCell>
                      <TableCell>
                        <DistributorAliadoAssignmentActions
                          distributorId={distributor.id}
                          currentAliadoId={distributor.aliado_id}
                          aliados={aliados}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
