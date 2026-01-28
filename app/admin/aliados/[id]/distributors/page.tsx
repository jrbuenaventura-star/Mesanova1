import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  Search,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"

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

  const { data: aliado } = await supabase
    .from("aliados")
    .select("*")
    .eq("id", id)
    .single()

  if (!aliado) {
    notFound()
  }

  let distributors: any[] = []
  try {
    const { data: distData, error: distError } = await supabase
      .from("distributors")
      .select("*")
      .eq("aliado_id", id)
      .order("created_at", { ascending: false })

    if (distError) {
      const message = distError.message || "Error al cargar clientes"
      if (message.toLowerCase().includes("aliado_id") && message.toLowerCase().includes("does not exist")) {
        distributors = []
      } else {
        console.error("Error loading aliado clients:", distError)
        distributors = []
      }
    } else {
      const userIds = (distData || [])
        .map((d: any) => d?.user_id)
        .filter((v: any): v is string => typeof v === "string" && v.length > 0)

      const { data: profilesData, error: profilesError } = userIds.length
        ? await supabase.from("user_profiles").select("id, full_name").in("id", userIds)
        : { data: [], error: null }

      if (profilesError) {
        console.error("Error loading user_profiles for aliado clients:", profilesError)
      }

      const profileById = new Map<string, any>()
      for (const p of profilesData || []) {
        if (p?.id) profileById.set(p.id, p)
      }

      distributors = (distData || []).map((d: any) => ({
        ...d,
        user: d?.user_id ? profileById.get(d.user_id) || null : null,
      }))
    }
  } catch (e) {
    console.error("Unexpected error loading aliado clients:", e)
    distributors = []
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Activo
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="secondary" className="gap-1">
            <XCircle className="h-3 w-3" />
            Inactivo
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/aliados/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Clientes de {aliado.company_name}</h1>
          <p className="text-muted-foreground">
            Gestiona los clientes asignados a este aliado comercial
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{distributors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {distributors.filter(d => d.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {distributors.filter(d => d.status === "pending").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar clientes..." className="pl-10" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Clientes</CardTitle>
          <CardDescription>
            Clientes asignados a {aliado.company_name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {distributors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay clientes asignados</p>
              <p className="text-sm">
                Este aliado aún no tiene clientes asociados
              </p>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {distributors.map((distributor) => (
                  <TableRow key={distributor.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{distributor.company_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {distributor.contact_name || distributor.user?.full_name || "-"}
                    </TableCell>
                    <TableCell>
                      {distributor.contact_email && (
                        <a 
                          href={`mailto:${distributor.contact_email}`} 
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <Mail className="h-3 w-3" />
                          {distributor.contact_email}
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      {distributor.contact_phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {distributor.contact_phone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {distributor.city && distributor.state ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {distributor.city}, {distributor.state}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(distributor.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
