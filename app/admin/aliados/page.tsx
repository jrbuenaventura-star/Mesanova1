import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
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
  Users, 
  UserPlus, 
  Search,
  Mail,
  Phone,
  Building2,
  MoreVertical,
  Edit,
  Trash2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CleanupUserDialog } from "@/components/admin/cleanup-user-dialog"

export default async function AliadosManagementPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Verificar que es superadmin
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "superadmin") {
    redirect("/")
  }

  // Obtener aliados con info de usuario
  let aliados: any[] = []
  try {
    const { data } = await supabase
      .from("aliados")
      .select(`
        *,
        user:user_profiles(full_name, email:id)
      `)
      .order("created_at", { ascending: false })
    aliados = data || []
  } catch (e) {
    // Tabla aún no existe
  }

  // Obtener usuarios con rol aliado que no tienen perfil de aliado
  const { data: aliadoUsers } = await supabase
    .from("user_profiles")
    .select("id, full_name, role")
    .eq("role", "aliado")

  // Contar distribuidores por aliado
  let distributorCounts: Record<string, number> = {}
  try {
    const { data } = await supabase
      .from("distributors")
      .select("aliado_id")
      .not("aliado_id", "is", null)
    
    if (data) {
      data.forEach(d => {
        if (d.aliado_id) {
          distributorCounts[d.aliado_id] = (distributorCounts[d.aliado_id] || 0) + 1
        }
      })
    }
  } catch (e) {
    // Columna aún no existe
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Aliados</h1>
          <p className="text-muted-foreground">
            Administra los aliados comerciales y sus clientes asignados
          </p>
        </div>
        <div className="flex gap-2">
          <CleanupUserDialog />
          <Button asChild>
            <Link href="/admin/aliados/nuevo">
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo Aliado
            </Link>
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aliados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aliados.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aliados Activos</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aliados.filter(a => a.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Asignados</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(distributorCounts).reduce((a, b) => a + b, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar aliados..." className="pl-10" />
        </div>
      </div>

      {/* Tabla de aliados */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Aliados</CardTitle>
          <CardDescription>
            Todos los aliados comerciales registrados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {aliados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay aliados registrados</p>
              <p className="text-sm">
                {aliadoUsers && aliadoUsers.length > 0 
                  ? `Hay ${aliadoUsers.length} usuarios con rol "aliado" sin perfil configurado`
                  : "Crea el primer aliado para comenzar"}
              </p>
              <Button asChild className="mt-4">
                <Link href="/admin/aliados/nuevo">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Crear Aliado
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Clientes</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aliados.map((aliado) => (
                  <TableRow key={aliado.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{aliado.company_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{aliado.contact_name || "-"}</TableCell>
                    <TableCell>
                      {aliado.email && (
                        <a href={`mailto:${aliado.email}`} className="text-primary hover:underline">
                          {aliado.email}
                        </a>
                      )}
                    </TableCell>
                    <TableCell>{aliado.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {distributorCounts[aliado.id] || 0} clientes
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={aliado.is_active ? "default" : "secondary"}>
                        {aliado.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/aliados/${aliado.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/aliados/${aliado.id}/distributors`}>
                              <Users className="mr-2 h-4 w-4" />
                              Ver clientes
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
