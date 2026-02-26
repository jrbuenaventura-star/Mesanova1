import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdvancedProductEditor } from "@/components/admin/advanced-product-editor"

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

  // Crear un producto vacío para el formulario de creación
  const newProduct = {
    id: "new",
    pdt_codigo: "",
    pdt_descripcion: "",
    pdt_empaque: "",
    upp_existencia: 0,
    upp_costou: 0,
    upp_costop: 0,
    valorinv: 0,
    ubicacion: "",
    precio: 0,
    horeca: "NO",
    nombre_comercial: "",
    descripcion_larga: "",
    caracteristicas: "",
    especificaciones_tecnicas: {},
    reposicion_cuando: "",
    reposicion_cuanto: 0,
    outer_pack: 0,
    pertenece_coleccion: false,
    nombre_coleccion: "",
    collection_id: null,
    material: "",
    color: "",
    dimensiones: "",
    peso: 0,
    capacidad: "",
    fecha_reposicion: "",
    cantidad_reposicion: 0,
    instrucciones_uso: "",
    instrucciones_cuidado: "",
    garantia: "",
    pais_origen: "",
    marca: "",
    linea_producto: "",
    slug: "",
    seo_title: "",
    seo_description: "",
    seo_keywords: [],
    is_active: true,
    is_featured: false,
    is_new: true,
    is_on_sale: false,
    imagen_principal_url: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: user.id,
    updated_by: user.id,
    collection: null,
    categories: [],
    product_types: [],
    media: [],
  }

  const [{ data: silos }, { data: collections }] = await Promise.all([
    supabase.from("silos").select("*").order("order_index"),
    supabase.from("collections").select("*").order("order_index"),
  ])

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Agregar Nuevo Producto</h1>
        <p className="text-muted-foreground">Completa la información del producto</p>
      </div>
      <Suspense fallback={<div>Cargando...</div>}>
        <AdvancedProductEditor product={newProduct as any} silos={silos || []} collections={collections || []} />
      </Suspense>
    </div>
  )
}
