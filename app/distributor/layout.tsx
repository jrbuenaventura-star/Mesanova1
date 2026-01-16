import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Home, Package, Users, ShoppingCart } from "lucide-react"

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

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-muted/40">
        <div className="p-6">
          <h2 className="text-lg font-semibold">Panel Distribuidor</h2>
        </div>
        <nav className="space-y-2 px-4">
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
        </nav>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  )
}
