import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Building2, 
  AlertCircle, 
  TrendingUp, 
  DollarSign,
  Calendar,
  Eye
} from "lucide-react"

export default async function AliadoDistributorsPage() {
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
    .select("*")
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

  // Obtener distribuidores asignados con métricas
  const admin = createAdminClient()
  const { data: distributors, error: distributorsError } = await admin
    .from("distributors")
    .select(
      "id, company_name, business_type, discount_percentage, is_active, credit_limit, current_balance, created_at, contact_name, contact_phone, contact_email, last_purchase_date, total_purchases",
    )
    .eq("aliado_id", aliado.id)
    .order("company_name")

  if (distributorsError) {
    console.error("Error loading aliado clients:", distributorsError)
  }

  const safeDistributors = distributorsError ? [] : distributors || []
  const activeDistributors = safeDistributors.filter((d: any) => d.is_active).length || 0
  const totalSales = safeDistributors.reduce((sum: number, d: any) => sum + (d.total_purchases || 0), 0) || 0

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mis Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona y evalúa los clientes asignados a tu cartera
          </p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeDistributors.length || 0}</div>
            <p className="text-xs text-muted-foreground">{activeDistributors} activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">De tus clientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio por Cliente</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${safeDistributors.length ? (totalSales / safeDistributors.length).toLocaleString() : 0}
            </div>
            <p className="text-xs text-muted-foreground">Compras promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de distribuidores */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Clientes</CardTitle>
          <CardDescription>
            Todos los clientes asignados a tu cartera
          </CardDescription>
        </CardHeader>
        <CardContent>
          {safeDistributors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No tienes clientes asignados</p>
              <p className="text-sm">
                Contacta al administrador para que te asigne clientes
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead>Última Compra</TableHead>
                  <TableHead>Total Compras</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeDistributors.map((distributor: any) => (
                  <TableRow key={distributor.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{distributor.company_name}</p>
                          {distributor.business_type && (
                            <p className="text-xs text-muted-foreground">{distributor.business_type}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {distributor.contact_name && (
                          <p className="text-sm">{distributor.contact_name}</p>
                        )}
                        {distributor.contact_email && (
                          <p className="text-xs text-muted-foreground">{distributor.contact_email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {distributor.discount_percentage}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {distributor.last_purchase_date 
                          ? new Date(distributor.last_purchase_date).toLocaleDateString()
                          : "Sin compras"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-bold">${(distributor.total_purchases || 0).toLocaleString()}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={distributor.is_active ? "default" : "secondary"}>
                        {distributor.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/aliado/distributors/${distributor.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                        </Link>
                      </Button>
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
