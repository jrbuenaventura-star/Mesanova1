import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { DistributorClientsManagement } from "@/components/admin/distributor-clients-management"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function DistributorClientsPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Verify user is superadmin
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

  // Get distributor info
  const { data: distributor, error } = await supabase
    .from("distributors")
    .select(
      `
      *,
      profile:user_profiles(*)
    `,
    )
    .eq("id", id)
    .single()

  if (error || !distributor) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <Link href="/admin/distributors">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Clientes Asignados</h1>
              <p className="text-muted-foreground">
                Distribuidor: <strong>{distributor.company_name}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={<div>Cargando clientes...</div>}>
        <DistributorClientsManagement distributorId={id} distributorName={distributor.company_name} />
      </Suspense>
    </div>
  )
}
