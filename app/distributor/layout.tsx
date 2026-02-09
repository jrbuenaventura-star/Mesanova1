import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Home, Package, Users, ShoppingCart, FileText, UserCog, AlertCircle, MessageSquare, DollarSign } from "lucide-react"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"

export default async function DistributorLayout({
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

  // Verificar que es distribuidor o aliado
  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

  if (!profile || !['distributor', 'aliado'].includes(profile.role)) {
    redirect("/")
  }

  // Obtener info del distribuidor o aliado
  const { data: distributor } = await supabase
    .from("distributors")
    .select("company_name, is_active, requires_approval")
    .eq("user_id", user.id)
    .single()

  const { data: aliado } = await supabase
    .from("aliados")
    .select("company_name")
    .eq("user_id", user.id)
    .single()

  const showSetupAlert = profile.role === 'distributor' && (!distributor || distributor.requires_approval)
  const companyName = distributor?.company_name || aliado?.company_name
  const panelTitle = profile.role === 'aliado' ? 'Panel Aliado' : 'Panel Distribuidor'

  const setupAlert = showSetupAlert ? (
    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
        <div className="text-xs text-amber-800">
          <p className="font-medium">Perfil incompleto</p>
          <p>Completa tu perfil para activar tu cuenta</p>
        </div>
      </div>
    </div>
  ) : null

  const navLinks = (
    <>
      {setupAlert && <div className="mb-2">{setupAlert}</div>}
      <NavLink href="/distributor" icon={<Home className="h-4 w-4" />} label="Inicio" />
      <NavLink href="/distributor/orders" icon={<ShoppingCart className="h-4 w-4" />} label="Mis Órdenes" />
      <NavLink href="/distributor/invoices" icon={<FileText className="h-4 w-4" />} label="Facturas" />
      <NavLink href="/distributor/clients" icon={<Users className="h-4 w-4" />} label="Mis Clientes" />
      <NavLink href="/productos" icon={<Package className="h-4 w-4" />} label="Catálogo" />
      <NavLink href="/distributor/precios" icon={<DollarSign className="h-4 w-4" />} label="Mi Lista de Precios" />
      <NavLink href="/distributor/pqrs" icon={<MessageSquare className="h-4 w-4" />} label="Soporte / PQRs" />
      <div className="my-3 border-t" />
      <NavLink href="/distributor/profile" icon={<UserCog className="h-4 w-4" />} label="Perfil y Documentos" />
    </>
  )

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Mobile sidebar */}
      <MobileSidebar title={panelTitle} subtitle={companyName || undefined}>
        {navLinks}
      </MobileSidebar>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 border-r bg-muted/40 shrink-0">
        <div className="p-6">
          <h2 className="text-lg font-semibold">{panelTitle}</h2>
          {companyName && (
            <p className="text-sm text-muted-foreground truncate">{companyName}</p>
          )}
        </div>
        <nav className="space-y-1 px-4">
          {navLinks}
        </nav>
      </aside>
      <main className="flex-1 min-w-0 panel-typography">{children}</main>
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
