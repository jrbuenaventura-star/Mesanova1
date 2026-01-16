import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProductsManagement } from "@/components/admin/products-management"

export default async function ProductsAdminPage() {
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

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })

  if (productsError) {
    console.error("[v0] Error loading products:", productsError)
  }

  // Obtener silos y subcategorías para los selectores
  const { data: silos } = await supabase.from("silos").select("*").order("order_index")

  const { data: subcategories } = await supabase.from("subcategories").select("*, silo:silos(*)").order("order_index")

  const { data: collections } = await supabase.from("collections").select("*").eq("is_active", true).order("name")

  return (
    <div className="flex-1 space-y-4 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Productos</h2>
          <p className="text-muted-foreground">
            Administra tu catálogo de productos, precios, ofertas y disponibilidad
          </p>
        </div>
      </div>

      <ProductsManagement
        initialProducts={products || []}
        silos={silos || []}
        subcategories={subcategories || []}
        collections={collections || []}
      />
    </div>
  )
}
