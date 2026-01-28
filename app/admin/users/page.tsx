import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserManagementTable } from "@/components/admin/user-management-table"
import { InviteUserForm } from "@/components/admin/invite-user-form"

export default async function AdminUsersPage() {
  const supabase = await createClient()

  // Verificar autenticación y rol
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "superadmin") {
    redirect("/")
  }

  // Obtener todos los usuarios
  const { data: users } = await supabase
    .from("user_profiles")
    .select(`
      id,
      full_name,
      role,
      is_active,
      created_at,
      last_login_at
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Usuarios</CardTitle>
          <CardDescription>
            Gestiona usuarios superadmin. Los clientes se gestionan desde "Clientes" o "Clientes CSV", 
            y los aliados desde "Aliados".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteUserForm />
          <UserManagementTable users={users || []} />
        </CardContent>
      </Card>
    </div>
  )
}
