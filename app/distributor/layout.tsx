import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Home, Package, Users, ShoppingCart, FileText, UserCog, AlertCircle, MessageSquare } from "lucide-react"

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

  // Verificar que es distribuidor
  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "distributor") {
    redirect("/")
  }

  // Obtener info del distribuidor para mostrar alertas
  const { data: distributor } = await supabase
    .from("distributors")
    .select("company_name, is_active, requires_approval")
    .eq("user_id", user.id)
    .single()

  const showSetupAlert = !distributor || distributor.requires_approval

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-muted/40">
        <div className="p-6">
          <h2 className="text-lg font-semibold">Panel Distribuidor</h2>
          {distributor && (
            <p className="text-sm text-muted-foreground truncate">{distributor.company_name}</p>
          )}
        </div>
        
        {showSetupAlert && (
          <div className="mx-4 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-medium">Perfil incompleto</p>
                <p>Completa tu perfil para activar tu cuenta</p>
              </div>
            </div>
          </div>
        )}
        
        <nav className="space-y-1 px-4">
          <Link
            href="/distributor"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent"
          >
            <Home className="h-4 w-4" />
            Inicio
          </Link>
          <Link
            href="/distributor/orders"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent"
          >
            <ShoppingCart className="h-4 w-4" />
            Mis Órdenes
          </Link>
          <Link
            href="/distributor/invoices"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent"
          >
            <FileText className="h-4 w-4" />
            Facturas
          </Link>
          <Link
            href="/distributor/clients"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent"
          >
            <Users className="h-4 w-4" />
            Mis Clientes
          </Link>
          <Link
            href="/productos"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent"
          >
            <Package className="h-4 w-4" />
            Catálogo
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
              href="/distributor/profile"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent"
            >
              <UserCog className="h-4 w-4" />
              Perfil y Documentos
            </Link>
          </div>
        </nav>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  )
}
