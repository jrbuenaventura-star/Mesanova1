import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TicketDetail } from '@/components/pqrs/ticket-detail'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function DistributorTicketDetailPage({
  params,
}: {
  params: { id: string }
}) {
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

  if (!profile || !['distributor', 'aliado'].includes(profile.role)) {
    redirect('/')
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/distributor/pqrs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a mis tickets
          </Link>
        </Button>
      </div>

      <TicketDetail ticketId={params.id} />
    </div>
  )
}
