import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function NewProductPage() {
  const supabase = await createClient()

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

  return (
    <div className="flex-1 space-y-4 p-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agregar Nuevo Producto</h2>
          <p className="text-muted-foreground">Completa la información del producto</p>
        </div>
      </div>

      {/* TODO: Agregar formulario de creación de producto */}
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">Formulario de creación de producto en construcción</p>
      </div>
    </div>
  )
}
