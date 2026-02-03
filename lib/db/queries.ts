import { createClient } from "@/lib/supabase/server"
import type {
  ProductWithCategories,
  Warehouse,
  UserRole,
  DistributorWithProfile,
  OrderWithItems,
  DistributorMonthlySales,
} from "./types"

// Obtener todos los silos con sus subcategorías
export async function getSilosWithSubcategories() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("silos")
    .select(`
      *,
      subcategories (*)
    `)
    .order("order_index")

  if (error) throw error
  return data
}

// Obtener productos por silo (usa las categorías para determinar pertenencia al silo)
export async function getProductsBySilo(siloSlug: string, limit = 100, includeHorecaExclusive = false) {
  const supabase = await createClient()

  let query = supabase
    .from("products")
    .select(
      `
      *,
      categories:product_categories!inner (
        *,
        subcategory:subcategories!inner (
          *,
          silo:silos!inner (
            slug
          )
        )
      ),
      warehouse_stock:product_warehouse_stock(
        available_quantity,
        warehouse:warehouses(show_in_frontend)
      )
    `
    )
    .eq("categories.subcategory.silo.slug", siloSlug)
    .eq("is_active", true)

  // Excluir productos EXCLUSIVO de HoReCa en secciones retail
  if (!includeHorecaExclusive) {
    query = query.or("horeca.is.null,horeca.neq.EXCLUSIVO")
  }

  const { data, error } = await query.order("pdt_descripcion").limit(limit)

  if (error) {
    console.log("[v0] Error fetching products by silo:", error)
    return []
  }

  return data || []
}

// Obtener un producto por slug con todas sus relaciones
export async function getProductBySlug(slug: string): Promise<ProductWithCategories | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      collection:collections(*),
      categories:product_categories (
        *,
        subcategory:subcategories (
          *,
          silo:silos (*)
        )
      ),
      product_types:product_product_types (
        *,
        product_type:product_types (*)
      ),
      product_media (*),
      product_similar (
        similar_product:products (*)
      ),
      product_complement (
        complement_product:products (*)
      ),
      warehouse_stock:product_warehouse_stock (
        *,
        warehouse:warehouses (*)
      )
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (error) {
    console.log("[v0] Error fetching product:", error)
    return null
  }
  return data
}

// Obtener productos por categoría (excluye productos EXCLUSIVO de HoReCa para retail)
export async function getProductsBySubcategory(subcategorySlug: string, limit = 20, includeHorecaExclusive = false) {
  const supabase = await createClient()

  let query = supabase
    .from("products")
    .select(`
      *,
      product_categories!inner (
        subcategory:subcategories!inner (
          slug
        )
      )
    `)
    .eq("product_categories.subcategory.slug", subcategorySlug)
    .eq("is_active", true)
  
  // Excluir productos EXCLUSIVO de HoReCa en secciones retail
  if (!includeHorecaExclusive) {
    query = query.or('horeca.is.null,horeca.neq.EXCLUSIVO')
  }
  
  const { data, error } = await query
    .order("pdt_descripcion")
    .limit(limit)

  if (error) {
    return []
  }

  return data || []
}

// Obtener productos para la sección HoReCa (solo productos con horeca = 'SI' o 'EXCLUSIVO')
export async function getProductsForHoReCa(limit = 50) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      product_categories (
        subcategory:subcategories (
          *,
          silo:silos (*)
        )
      )
    `)
    .in("horeca", ["SI", "EXCLUSIVO"])
    .eq("is_active", true)
    .order("pdt_descripcion")
    .limit(limit)

  if (error) {
    console.log("[v0] Error fetching HoReCa products:", error)
    return []
  }

  return data || []
}

// Obtener tipos de producto disponibles por subcategoría (solo los que tienen productos)
export async function getAvailableProductTypesBySubcategory(subcategorySlug: string) {
  const supabase = await createClient()

  const { error: checkError } = await supabase.from("product_types").select("id").limit(1)

  if (checkError) {
    console.log("[v0] product_types table doesn't exist yet, returning empty array")
    return []
  }

  try {
    const { data, error } = await supabase
      .from("product_types")
      .select(
        `
        *,
        subcategory:subcategories!inner (
          slug
        ),
        product_product_types!inner (
          product:products!inner (
            is_active
          )
        )
      `,
      )
      .eq("subcategory.slug", subcategorySlug)
      .eq("product_product_types.product.is_active", true)
      .order("order_index")

    if (error) {
      console.log("[v0] Error fetching product types:", error)
      return []
    }

    return data || []
  } catch (err) {
    console.log("[v0] Exception fetching product types:", err)
    return []
  }
}

// Obtener productos filtrados por subcategoría y tipo de producto (excluye EXCLUSIVO HoReCa en retail)
export async function getProductsBySubcategoryAndType(subcategorySlug: string, productTypeSlug?: string, includeHorecaExclusive = false) {
  const supabase = await createClient()

  const { error: checkError } = await supabase.from("product_types").select("id").limit(1)

  if (checkError) {
    console.log("[v0] product_types table doesn't exist yet, falling back to subcategory only")
    return getProductsBySubcategory(subcategorySlug, 20, includeHorecaExclusive)
  }

  // Si no hay tipo de producto, obtener todos los productos de la subcategoría
  if (!productTypeSlug) {
    return getProductsBySubcategory(subcategorySlug, 100, includeHorecaExclusive)
  }

  try {
    let query = supabase
      .from("products")
      .select(
        `
        *,
        product_categories!inner (
          subcategory:subcategories!inner (
            slug
          )
        ),
        product_product_types!inner (
          product_type:product_types!inner (
            slug
          )
        )
      `,
      )
      .eq("product_categories.subcategory.slug", subcategorySlug)
      .eq("product_product_types.product_type.slug", productTypeSlug)
      .eq("is_active", true)
    
    // Excluir productos EXCLUSIVO de HoReCa en secciones retail
    if (!includeHorecaExclusive) {
      query = query.or('horeca.is.null,horeca.neq.EXCLUSIVO')
    }
    
    const { data, error } = await query.order("pdt_descripcion")

    if (error) {
      // Si falla el filtrado por tipo, intentar solo por subcategoría
      return getProductsBySubcategory(subcategorySlug, 100, includeHorecaExclusive)
    }

    return data || []
  } catch (err) {
    console.log("[v0] Exception in getProductsBySubcategoryAndType:", err)
    return getProductsBySubcategory(subcategorySlug, 100, includeHorecaExclusive)
  }
}

// Obtener productos destacados
export async function getFeaturedProducts(limit = 10) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("is_featured", true)
    .limit(limit)

  if (error) throw error
  return data
}

// Buscar productos
export async function searchProducts(query: string, limit = 20) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .or(`pdt_descripcion.ilike.%${query}%,nombre_comercial.ilike.%${query}%,pdt_codigo.ilike.%${query}%`)
    .limit(limit)

  if (error) throw error
  return data
}

// Obtener disponibilidad de un producto (sincronizado con ERP)
export async function getProductAvailability(productCode: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select("pdt_codigo, upp_existencia, pdt_empaque")
    .eq("pdt_codigo", productCode)
    .single()

  if (error) throw error
  return data
}

// Obtener todos los almacenes activos
export async function getActiveWarehouses() {
  const supabase = await createClient()

  const { data, error } = await supabase.from("warehouses").select("*").eq("is_active", true).order("order_index")

  if (error) throw error
  return data
}

// Obtener stock de un producto en todos los almacenes
export async function getProductStockByWarehouses(productId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("product_warehouse_stock")
    .select(`
      *,
      warehouse:warehouses (*)
    `)
    .eq("product_id", productId)
    .order("warehouse.order_index")

  if (error) throw error
  return data
}

// Obtener stock disponible en almacenes que pueden despachar
export async function getAvailableStockForShipping(productId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("product_warehouse_stock")
    .select(`
      *,
      warehouse:warehouses!inner (*)
    `)
    .eq("product_id", productId)
    .eq("warehouse.can_ship", true)
    .eq("warehouse.is_active", true)
    .gt("available_quantity", 0)

  if (error) throw error
  return data
}

// Actualizar stock de un producto en un almacén específico
export async function updateWarehouseStock(
  productId: string,
  warehouseId: string,
  quantity: number,
  reservedQuantity = 0,
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("product_warehouse_stock")
    .upsert({
      product_id: productId,
      warehouse_id: warehouseId,
      quantity,
      reserved_quantity: reservedQuantity,
      last_sync_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Obtener productos con stock bajo por almacén
export async function getLowStockProducts(warehouseId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from("product_warehouse_stock")
    .select(`
      *,
      product:products (*),
      warehouse:warehouses (*)
    `)
    .filter("available_quantity", "lte", "min_stock")
    .gt("min_stock", 0)

  if (warehouseId) {
    query = query.eq("warehouse_id", warehouseId)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

// Crear o actualizar almacén
export async function upsertWarehouse(warehouse: Partial<Warehouse>) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("warehouses").upsert(warehouse).select().single()

  if (error) throw error
  return data
}

// Obtener resumen de todos los almacenes con estadísticas
export async function getWarehouseSummary() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("warehouses")
    .select(`
      *,
      stock:product_warehouse_stock (
        quantity,
        available_quantity,
        min_stock
      )
    `)
    .eq("is_active", true)
    .order("order_index")

  if (error) throw error
  return data
}

// Obtener perfil de usuario actual
export async function getCurrentUserProfile() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()

  if (error) throw error
  return data
}

// Obtener perfil con información de distribuidor si aplica
export async function getCurrentUserWithDistributor() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("user_profiles")
    .select(`
      *,
      distributor:distributors (*)
    `)
    .eq("id", user.id)
    .single()

  if (error) throw error
  return data
}

// Crear o actualizar perfil de usuario
export async function upsertUserProfile(
  userId: string,
  profile: {
    role?: UserRole
    full_name?: string
    phone?: string
    document_type?: string
    document_number?: string
    shipping_address?: string
    shipping_city?: string
    shipping_state?: string
    shipping_postal_code?: string
    shipping_country?: string
  },
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert({
      id: userId,
      ...profile,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Obtener todos los distribuidores (solo superadmin)
export async function getAllDistributors() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("distributors")
    .select(`
      *,
      profile:user_profiles (*)
    `)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as DistributorWithProfile[]
}

// Obtener información de distribuidor del usuario actual
export async function getCurrentDistributor() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("distributors")
    .select(`
      *,
      profile:user_profiles (*)
    `)
    .eq("user_id", user.id)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null // No distributor found
    throw error
  }
  return data as DistributorWithProfile
}

// Crear o actualizar distribuidor
export async function upsertDistributor(distributor: {
  user_id: string
  company_name: string
  company_rif?: string
  business_type?: string
  discount_percentage?: number
  monthly_budget_cocina?: number
  monthly_budget_mesa?: number
  monthly_budget_cafe_te_bar?: number
  monthly_budget_termos_neveras?: number
  monthly_budget_profesional?: number
  credit_limit?: number
}) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("distributors").upsert(distributor).select().single()

  if (error) throw error
  return data
}

// Obtener precio para distribuidor (considerando precios personalizados)
export async function getPriceForDistributor(productId: string, distributorId: string) {
  const supabase = await createClient()

  // Primero buscar precio personalizado activo
  const { data: customPrice } = await supabase
    .from("distributor_custom_prices")
    .select("custom_price, discount_percentage")
    .eq("distributor_id", distributorId)
    .eq("product_id", productId)
    .eq("is_active", true)
    .lte("valid_from", new Date().toISOString())
    .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)
    .single()

  if (customPrice) {
    return customPrice
  }

  // Si no hay precio personalizado, usar descuento general del distribuidor
  const { data: distributor } = await supabase
    .from("distributors")
    .select("discount_percentage")
    .eq("id", distributorId)
    .single()

  return {
    custom_price: null,
    discount_percentage: distributor?.discount_percentage || 0,
  }
}

// Obtener productos con mayor rotación (top selling)
export async function getTopSellingProducts(limit = 20) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("top_selling_products")
    .select(`
      *,
      product:products (*)
    `)
    .eq("is_featured", true)
    .order("order_index")
    .limit(limit)

  if (error) throw error
  return data
}

// Crear nueva orden
export async function createOrder(
  order: {
    user_id: string
    distributor_id?: string
    subtotal: number
    discount_amount?: number
    tax_amount?: number
    shipping_cost?: number
    total: number
    shipping_full_name?: string
    shipping_phone?: string
    shipping_address?: string
    shipping_city?: string
    shipping_state?: string
    shipping_postal_code?: string
    shipping_country?: string
    notes?: string
  },
  items: {
    product_id: string
    quantity: number
    unit_price: number
    discount_percentage?: number
    discount_amount?: number
    subtotal: number
    warehouse_id?: string
  }[],
) {
  const supabase = await createClient()

  // Generar número de orden único
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

  // Crear la orden
  const { data: newOrder, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      ...order,
    })
    .select()
    .single()

  if (orderError) throw orderError

  // Crear los items de la orden
  const orderItems = items.map((item) => ({
    order_id: newOrder.id,
    ...item,
  }))

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

  if (itemsError) throw itemsError

  return newOrder
}

// Obtener órdenes del usuario actual
export async function getCurrentUserOrders(limit = 50) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      items:order_items (
        *,
        product:products (*),
        warehouse:warehouses (*)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as OrderWithItems[]
}

// Obtener una orden específica con todos sus detalles
export async function getOrderById(orderId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      items:order_items (
        *,
        product:products (*),
        warehouse:warehouses (*)
      ),
      user:user_profiles (*),
      distributor:distributors (
        *,
        profile:user_profiles (*)
      )
    `)
    .eq("id", orderId)
    .single()

  if (error) throw error
  return data as OrderWithItems
}

// Actualizar estado de orden
export async function updateOrderStatus(
  orderId: string,
  updates: {
    status?: string
    payment_status?: string
    tracking_number?: string
    tracking_url?: string
    carrier?: string
    shipped_at?: string
    delivered_at?: string
    internal_notes?: string
  },
) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("orders").update(updates).eq("id", orderId).select().single()

  if (error) throw error
  return data
}

// Obtener ventas mensuales del distribuidor actual
export async function getDistributorMonthlySales(year?: number, months = 12) {
  const supabase = await createClient()

  const distributor = await getCurrentDistributor()
  if (!distributor) return []

  const currentYear = year || new Date().getFullYear()

  const { data, error } = await supabase
    .from("distributor_monthly_sales")
    .select("*")
    .eq("distributor_id", distributor.id)
    .gte("year", currentYear - 1) // Últimos 2 años
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(months)

  if (error) throw error
  return data as DistributorMonthlySales[]
}

// Obtener ventas del distribuidor comparadas con presupuesto (mes actual)
export async function getDistributorCurrentMonthPerformance() {
  const supabase = await createClient()

  const distributor = await getCurrentDistributor()
  if (!distributor) return null

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const { data: sales } = await supabase
    .from("distributor_monthly_sales")
    .select("*")
    .eq("distributor_id", distributor.id)
    .eq("year", year)
    .eq("month", month)
    .single()

  return {
    sales: sales || {
      sales_cocina: 0,
      sales_mesa: 0,
      sales_cafe_te_bar: 0,
      sales_termos_neveras: 0,
      sales_profesional: 0,
      total_sales: 0,
      total_orders: 0,
    },
    budget: {
      cocina: distributor.monthly_budget_cocina,
      mesa: distributor.monthly_budget_mesa,
      cafe_te_bar: distributor.monthly_budget_cafe_te_bar,
      termos_neveras: distributor.monthly_budget_termos_neveras,
      profesional: distributor.monthly_budget_profesional,
      total:
        distributor.monthly_budget_cocina +
        distributor.monthly_budget_mesa +
        distributor.monthly_budget_cafe_te_bar +
        distributor.monthly_budget_termos_neveras +
        distributor.monthly_budget_profesional,
    },
    distributor,
  }
}

// Calcular ventas mensuales de un distribuidor (función auxiliar para admin)
export async function calculateDistributorMonthlySales(distributorId: string, year: number, month: number) {
  const supabase = await createClient()

  const { error } = await supabase.rpc("calculate_distributor_monthly_sales", {
    p_distributor_id: distributorId,
    p_year: year,
    p_month: month,
  })

  if (error) throw error
  return true
}

// Blog queries

// Get all published blog posts with pagination
export async function getBlogPosts(limit = 10, offset = 0) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      *,
      author:user_profiles (*),
      blog_post_categories (
        category:blog_categories (*)
      )
    `)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data
}

// Get a single blog post by slug
export async function getBlogPostBySlug(slug: string) {
  const supabase = await createClient()

  console.log("[v0] Searching for blog post with slug:", slug)

  // Get the post first
  const { data: post, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  console.log("[v0] Blog post query result:", { found: !!post, error: error?.message })

  if (error) {
    console.error("[v0] Error fetching blog post:", error)
    return null
  }

  if (!post) {
    console.log("[v0] No post found with slug:", slug)
    return null
  }

  // Get author separately to avoid RLS recursion
  let author = null
  if (post.author_id) {
    const { data: authorData } = await supabase
      .from("user_profiles")
      .select("id, full_name, avatar_url")
      .eq("id", post.author_id)
      .single()

    author = authorData
  }

  // Get categories separately
  const { data: postCategories } = await supabase
    .from("blog_post_categories")
    .select(`
      category:blog_categories (
        id,
        name,
        slug
      )
    `)
    .eq("post_id", post.id)

  // Increment views count asynchronously (don't wait for it)
  supabase
    .from("blog_posts")
    .update({ views_count: (post.views_count || 0) + 1 })
    .eq("id", post.id)
    .then(() => {})

  return {
    ...post,
    author,
    blog_post_categories: postCategories || [],
  }
}

// Get blog posts by category
export async function getBlogPostsByCategory(categorySlug: string, limit = 10) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      *,
      author:user_profiles (*),
      blog_post_categories!inner (
        category:blog_categories!inner (slug)
      )
    `)
    .eq("blog_post_categories.blog_categories.slug", categorySlug)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// Get all blog categories with post count
export async function getBlogCategories() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("blog_categories")
    .select(`
      *,
      blog_post_categories (count)
    `)
    .order("name")

  if (error) throw error
  return data
}

// Search blog posts
export async function searchBlogPosts(query: string, limit = 20) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      *,
      author:user_profiles (*),
      blog_post_categories (
        category:blog_categories (*)
      )
    `)
    .eq("status", "published")
    .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`)
    .order("published_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// Get recent blog posts
export async function getRecentBlogPosts(limit = 5) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, featured_image_url, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// Get related blog posts based on categories
export async function getRelatedBlogPosts(postId: string, limit = 3) {
  const supabase = await createClient()

  // Get categories of current post
  const { data: currentCategories } = await supabase
    .from("blog_post_categories")
    .select("category_id")
    .eq("post_id", postId)

  if (!currentCategories || currentCategories.length === 0) {
    // If no categories, return recent posts
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, featured_image_url, published_at")
      .eq("status", "published")
      .neq("id", postId)
      .order("published_at", { ascending: false })
      .limit(limit)

    return data || []
  }

  const categoryIds = currentCategories.map((c) => c.category_id)

  // Get posts with same categories
  const { data: relatedPostIds } = await supabase
    .from("blog_post_categories")
    .select("post_id")
    .in("category_id", categoryIds)
    .neq("post_id", postId)

  if (!relatedPostIds || relatedPostIds.length === 0) {
    return []
  }

  const postIds = [...new Set(relatedPostIds.map((p) => p.post_id))]

  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, featured_image_url, published_at")
    .eq("status", "published")
    .in("id", postIds)
    .order("published_at", { ascending: false })
    .limit(limit)

  return data || []
}

// Admin: Create or update blog post
export async function upsertBlogPost(post: {
  id?: string
  slug: string
  title: string
  excerpt?: string
  content: string
  featured_image_url?: string
  status?: "draft" | "published" | "archived"
  published_at?: string
  author_id?: string
}) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("blog_posts").upsert(post).select().single()

  if (error) throw error
  return data
}

// Admin: Delete blog post
export async function deleteBlogPost(postId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("blog_posts").delete().eq("id", postId)

  if (error) throw error
  return true
}
