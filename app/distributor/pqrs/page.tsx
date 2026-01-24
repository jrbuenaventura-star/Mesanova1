import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreateTicketForm } from '@/components/pqrs/create-ticket-form'
import { TicketsList } from '@/components/pqrs/tickets-list'

export default async function DistributorPQRSPage() {
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

  if (!profile || !['distributor', 'canal', 'aliado'].includes(profile.role)) {
    redirect('/')
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Soporte y PQRs</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tus peticiones, quejas, reclamos y sugerencias
        </p>
      </div>

      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tickets">Mis Tickets</TabsTrigger>
          <TabsTrigger value="nuevo">Crear Nuevo Ticket</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <TicketsList />
        </TabsContent>

        <TabsContent value="nuevo">
          <CreateTicketForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
