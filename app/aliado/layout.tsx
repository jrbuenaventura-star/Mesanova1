import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Home, Users, UserPlus, ShoppingCart, BarChart3, UserCog, MessageSquare } from "lucide-react"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"

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

  const navLinks = (
    <>
      <NavLink href="/aliado" icon={<Home className="h-4 w-4" />} label="Inicio" />
      <NavLink href="/aliado/distributors" icon={<Users className="h-4 w-4" />} label="Mis Clientes" />
      <NavLink href="/aliado/leads" icon={<UserPlus className="h-4 w-4" />} label="CRM / Leads" />
      <NavLink href="/aliado/orders" icon={<ShoppingCart className="h-4 w-4" />} label="Crear Pedido" />
      <NavLink href="/aliado/stats" icon={<BarChart3 className="h-4 w-4" />} label="Estadísticas" />
      <NavLink href="/distributor/pqrs" icon={<MessageSquare className="h-4 w-4" />} label="Soporte / PQRs" />
      <div className="my-3 border-t" />
      <NavLink href="/aliado/profile" icon={<UserCog className="h-4 w-4" />} label="Mi Perfil" />
    </>
  )

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Mobile sidebar */}
      <MobileSidebar title="Panel Aliado" subtitle={aliado?.company_name || undefined}>
        {navLinks}
      </MobileSidebar>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 border-r bg-muted/40 shrink-0">
        <div className="p-6">
          <h2 className="text-lg font-semibold">Panel Aliado</h2>
          {aliado && (
            <p className="text-sm text-muted-foreground truncate">{aliado.company_name}</p>
          )}
        </div>
        <nav className="space-y-1 px-4">
          {navLinks}
        </nav>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent"
    >
      {icon}
      {label}
    </Link>
  )
}
