import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import ContactsManagement from "@/components/admin/contacts-management"

export default async function CompanyContactsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "superadmin") {
    redirect("/")
  }

  const resolvedParams = await params
  const companyId = resolvedParams.id

  // Obtener información de la empresa
  const { data: company } = await supabase.from("companies").select("*").eq("id", companyId).single()

  if (!company) {
    redirect("/admin/clients")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/clients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Clientes
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mb-2">Contactos de {company.razon_social}</h1>
        <p className="text-muted-foreground">Gestiona las personas de contacto dentro de esta empresa</p>
      </div>
      <ContactsManagement companyId={companyId} companyName={company.razon_social} />
    </div>
  )
}
