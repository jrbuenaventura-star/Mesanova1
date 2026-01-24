import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Home, Users, UserPlus, ShoppingCart, BarChart3, UserCog, MessageSquare } from "lucide-react"

export default async function AliadoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Verificar que es aliado
  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "aliado") {
    redirect("/")
  }

  // Obtener info del aliado
  const { data: aliado } = await supabase
    .from("aliados")
    .select("company_name")
    .eq("user_id", user.id)
    .single()

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-muted/40">
        <div className="p-6">
          <h2 className="text-lg font-semibold">Panel Aliado</h2>
          {aliado && (
            <p className="text-sm text-muted-foreground truncate">{aliado.company_name}</p>
          )}
        </div>
        
        <nav className="space-y-1 px-4">
          <Link
            href="/aliado"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent"
          >
            <Home className="h-4 w-4" />
            Inicio
          </Link>
          <Link
            href="/aliado/distributors"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent"
          >
            <Users className="h-4 w-4" />
            Mis Distribuidores
          </Link>
          <Link
            href="/aliado/leads"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent"
          >
            <UserPlus className="h-4 w-4" />
            CRM / Leads
          </Link>
          <Link
            href="/aliado/orders"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent"
          >
            <ShoppingCart className="h-4 w-4" />
            Crear Pedido
          </Link>
          <Link
            href="/aliado/stats"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent"
          >
            <BarChart3 className="h-4 w-4" />
            Estadísticas
          </Link>
          <Link
            href="/distributor/pqrs"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent"
          >
            <MessageSquare className="h-4 w-4" />
            Soporte / PQRs
          </Link>
          
          <div className="pt-4 mt-4 border-t">
            <Link
              href="/aliado/profile"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent"
            >
              <UserCog className="h-4 w-4" />
              Mi Perfil
            </Link>
          </div>
        </nav>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  )
}
