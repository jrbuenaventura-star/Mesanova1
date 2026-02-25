import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdvancedProductEditor } from "@/components/admin/advanced-product-editor"

export const dynamic = 'force-dynamic'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Verificar autenticación
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Verificar rol de superadmin
  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "superadmin" && profile?.role !== "admin") {
    redirect("/")
  }

  // Obtener producto con todas sus relaciones
  const { data: product } = await supabase
    .from("products")
    .select(
      `
      *,
      collection:collections(*),
      categories:product_categories(
        *,
        subcategory:subcategories(
          *,
          silo:silos(*)
        )
      ),
      product_type:product_types(*),
      media:product_media(*)
    `,
    )
    .eq("id", id)
    .single()

  if (!product) {
    redirect("/admin/products")
  }

  const [{ data: silos }, { data: collections }] = await Promise.all([
    supabase.from("silos").select("*").order("order_index"),
    supabase.from("collections").select("*").order("order_index"),
  ])

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edición Avanzada de Producto</h1>
        <p className="text-muted-foreground">Edita todos los detalles del producto</p>
      </div>
      <Suspense fallback={<div>Cargando...</div>}>
        <AdvancedProductEditor product={product} silos={silos || []} collections={collections || []} />
      </Suspense>
    </div>
  )
}
