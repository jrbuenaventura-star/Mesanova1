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

  // Obtener solo usuarios superadmin
  const { data: users } = await supabase
    .from("user_profiles")
    .select(`
      id,
      full_name,
      phone,
      role,
      is_active,
      created_at,
      last_login_at
    `)
    .eq("role", "superadmin")
    .order("created_at", { ascending: false })

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">
          Gestiona usuarios superadmin. Los clientes se gestionan desde "Clientes" o "Clientes CSV", y los aliados desde "Aliados".
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <InviteUserForm />
          <UserManagementTable users={users || []} />
        </CardContent>
      </Card>
    </div>
  )
}
