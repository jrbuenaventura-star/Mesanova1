import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminTicketsDashboard } from '@/components/pqrs/admin-tickets-dashboard'

export default async function AdminPQRSPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'superadmin') {
    redirect('/')
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Gestión de PQRs</h1>
        <p className="text-muted-foreground mt-2">
          Administra todos los tickets de soporte del sistema
        </p>
      </div>

      <AdminTicketsDashboard />
    </div>
  )
}
