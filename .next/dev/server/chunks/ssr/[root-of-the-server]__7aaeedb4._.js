module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/app/not-found.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/not-found.tsx [app-rsc] (ecmascript)"));
}),
"[project]/components/ui/badge.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Badge",
    ()=>Badge,
    "badgeVariants",
    ()=>badgeVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-rsc] (ecmascript)");
;
;
;
;
const badgeVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cva"])('inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden', {
    variants: {
        variant: {
            default: 'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
            secondary: 'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
            destructive: 'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
            outline: 'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground'
        }
    },
    defaultVariants: {
        variant: 'default'
    }
});
function Badge({ className, variant, asChild = false, ...props }) {
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Slot"] : 'span';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        "data-slot": "badge",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cn"])(badgeVariants({
            variant
        }), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/badge.tsx",
        lineNumber: 38,
        columnNumber: 5
    }, this);
}
;
}),
"[project]/lib/db/queries.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "calculateDistributorMonthlySales",
    ()=>calculateDistributorMonthlySales,
    "createOrder",
    ()=>createOrder,
    "deleteBlogPost",
    ()=>deleteBlogPost,
    "getActiveWarehouses",
    ()=>getActiveWarehouses,
    "getAllDistributors",
    ()=>getAllDistributors,
    "getAvailableProductTypesBySubcategory",
    ()=>getAvailableProductTypesBySubcategory,
    "getAvailableStockForShipping",
    ()=>getAvailableStockForShipping,
    "getBlogCategories",
    ()=>getBlogCategories,
    "getBlogPostBySlug",
    ()=>getBlogPostBySlug,
    "getBlogPosts",
    ()=>getBlogPosts,
    "getBlogPostsByCategory",
    ()=>getBlogPostsByCategory,
    "getCurrentDistributor",
    ()=>getCurrentDistributor,
    "getCurrentUserOrders",
    ()=>getCurrentUserOrders,
    "getCurrentUserProfile",
    ()=>getCurrentUserProfile,
    "getCurrentUserWithDistributor",
    ()=>getCurrentUserWithDistributor,
    "getDistributorCurrentMonthPerformance",
    ()=>getDistributorCurrentMonthPerformance,
    "getDistributorMonthlySales",
    ()=>getDistributorMonthlySales,
    "getFeaturedProducts",
    ()=>getFeaturedProducts,
    "getLowStockProducts",
    ()=>getLowStockProducts,
    "getOrderById",
    ()=>getOrderById,
    "getPriceForDistributor",
    ()=>getPriceForDistributor,
    "getProductAvailability",
    ()=>getProductAvailability,
    "getProductBySlug",
    ()=>getProductBySlug,
    "getProductStockByWarehouses",
    ()=>getProductStockByWarehouses,
    "getProductsBySubcategory",
    ()=>getProductsBySubcategory,
    "getProductsBySubcategoryAndType",
    ()=>getProductsBySubcategoryAndType,
    "getRecentBlogPosts",
    ()=>getRecentBlogPosts,
    "getRelatedBlogPosts",
    ()=>getRelatedBlogPosts,
    "getSilosWithSubcategories",
    ()=>getSilosWithSubcategories,
    "getTopSellingProducts",
    ()=>getTopSellingProducts,
    "getWarehouseSummary",
    ()=>getWarehouseSummary,
    "searchBlogPosts",
    ()=>searchBlogPosts,
    "searchProducts",
    ()=>searchProducts,
    "updateOrderStatus",
    ()=>updateOrderStatus,
    "updateWarehouseStock",
    ()=>updateWarehouseStock,
    "upsertBlogPost",
    ()=>upsertBlogPost,
    "upsertDistributor",
    ()=>upsertDistributor,
    "upsertUserProfile",
    ()=>upsertUserProfile,
    "upsertWarehouse",
    ()=>upsertWarehouse
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/server.ts [app-rsc] (ecmascript)");
;
async function getSilosWithSubcategories() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("silos").select(`
      *,
      subcategories (*)
    `).order("order_index");
    if (error) throw error;
    return data;
}
async function getProductBySlug(slug) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("products").select(`
      *,
      collection:collections(*),
      product_categories (
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
    `).eq("slug", slug).eq("is_active", true).single();
    if (error) {
        console.log("[v0] Error fetching product:", error);
        return null;
    }
    return data;
}
async function getProductsBySubcategory(subcategorySlug, limit = 20) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("products").select(`
      *,
      product_categories!inner (
        subcategory:subcategories!inner (
          slug
        )
      )
    `).eq("product_categories.subcategory.slug", subcategorySlug).eq("is_active", true).order("pdt_descripcion").limit(limit);
    if (error) {
        return [];
    }
    return data || [];
}
async function getAvailableProductTypesBySubcategory(subcategorySlug) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { error: checkError } = await supabase.from("product_types").select("id").limit(1);
    if (checkError) {
        console.log("[v0] product_types table doesn't exist yet, returning empty array");
        return [];
    }
    try {
        const { data, error } = await supabase.from("product_types").select(`
        *,
        subcategory:subcategories!inner (
          slug
        ),
        product_product_types!inner (
          product:products!inner (
            is_active
          )
        )
      `).eq("subcategory.slug", subcategorySlug).eq("product_product_types.product.is_active", true).order("order_index");
        if (error) {
            console.log("[v0] Error fetching product types:", error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.log("[v0] Exception fetching product types:", err);
        return [];
    }
}
async function getProductsBySubcategoryAndType(subcategorySlug, productTypeSlug) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { error: checkError } = await supabase.from("product_types").select("id").limit(1);
    if (checkError) {
        console.log("[v0] product_types table doesn't exist yet, falling back to subcategory only");
        return getProductsBySubcategory(subcategorySlug);
    }
    try {
        const { data, error } = await supabase.from("products").select(`
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
      `).eq("product_categories.subcategory.slug", subcategorySlug).eq("product_product_types.product_type.slug", productTypeSlug).eq("is_active", true).order("pdt_descripcion");
        if (error) {
            // Si falla el filtrado por tipo, intentar solo por subcategoría
            const { data: fallbackData, error: fallbackError } = await supabase.from("products").select(`
          *,
          product_categories!inner (
            subcategory:subcategories!inner (
              slug
            )
          )
        `).eq("product_categories.subcategory.slug", subcategorySlug).eq("is_active", true).order("pdt_descripcion");
            if (fallbackError) {
                return [];
            }
            return fallbackData || [];
        }
        return data || [];
    } catch (err) {
        console.log("[v0] Exception in getProductsBySubcategoryAndType:", err);
        return getProductsBySubcategory(subcategorySlug);
    }
}
async function getFeaturedProducts(limit = 10) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("products").select("*").eq("is_active", true).eq("is_featured", true).limit(limit);
    if (error) throw error;
    return data;
}
async function searchProducts(query, limit = 20) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("products").select("*").eq("is_active", true).or(`pdt_descripcion.ilike.%${query}%,nombre_comercial.ilike.%${query}%,pdt_codigo.ilike.%${query}%`).limit(limit);
    if (error) throw error;
    return data;
}
async function getProductAvailability(productCode) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("products").select("pdt_codigo, upp_existencia, pdt_empaque").eq("pdt_codigo", productCode).single();
    if (error) throw error;
    return data;
}
async function getActiveWarehouses() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("warehouses").select("*").eq("is_active", true).order("order_index");
    if (error) throw error;
    return data;
}
async function getProductStockByWarehouses(productId) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("product_warehouse_stock").select(`
      *,
      warehouse:warehouses (*)
    `).eq("product_id", productId).order("warehouse.order_index");
    if (error) throw error;
    return data;
}
async function getAvailableStockForShipping(productId) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("product_warehouse_stock").select(`
      *,
      warehouse:warehouses!inner (*)
    `).eq("product_id", productId).eq("warehouse.can_ship", true).eq("warehouse.is_active", true).gt("available_quantity", 0);
    if (error) throw error;
    return data;
}
async function updateWarehouseStock(productId, warehouseId, quantity, reservedQuantity = 0) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("product_warehouse_stock").upsert({
        product_id: productId,
        warehouse_id: warehouseId,
        quantity,
        reserved_quantity: reservedQuantity,
        last_sync_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    return data;
}
async function getLowStockProducts(warehouseId) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    let query = supabase.from("product_warehouse_stock").select(`
      *,
      product:products (*),
      warehouse:warehouses (*)
    `).filter("available_quantity", "lte", "min_stock").gt("min_stock", 0);
    if (warehouseId) {
        query = query.eq("warehouse_id", warehouseId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
}
async function upsertWarehouse(warehouse) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("warehouses").upsert(warehouse).select().single();
    if (error) throw error;
    return data;
}
async function getWarehouseSummary() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("warehouses").select(`
      *,
      stock:product_warehouse_stock (
        quantity,
        available_quantity,
        min_stock
      )
    `).eq("is_active", true).order("order_index");
    if (error) throw error;
    return data;
}
async function getCurrentUserProfile() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
    if (error) throw error;
    return data;
}
async function getCurrentUserWithDistributor() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from("user_profiles").select(`
      *,
      distributor:distributors (*)
    `).eq("id", user.id).single();
    if (error) throw error;
    return data;
}
async function upsertUserProfile(userId, profile) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("user_profiles").upsert({
        id: userId,
        ...profile
    }).select().single();
    if (error) throw error;
    return data;
}
async function getAllDistributors() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("distributors").select(`
      *,
      profile:user_profiles (*)
    `).order("created_at", {
        ascending: false
    });
    if (error) throw error;
    return data;
}
async function getCurrentDistributor() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from("distributors").select(`
      *,
      profile:user_profiles (*)
    `).eq("user_id", user.id).single();
    if (error) {
        if (error.code === "PGRST116") return null // No distributor found
        ;
        throw error;
    }
    return data;
}
async function upsertDistributor(distributor) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("distributors").upsert(distributor).select().single();
    if (error) throw error;
    return data;
}
async function getPriceForDistributor(productId, distributorId) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    // Primero buscar precio personalizado activo
    const { data: customPrice } = await supabase.from("distributor_custom_prices").select("custom_price, discount_percentage").eq("distributor_id", distributorId).eq("product_id", productId).eq("is_active", true).lte("valid_from", new Date().toISOString()).or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`).single();
    if (customPrice) {
        return customPrice;
    }
    // Si no hay precio personalizado, usar descuento general del distribuidor
    const { data: distributor } = await supabase.from("distributors").select("discount_percentage").eq("id", distributorId).single();
    return {
        custom_price: null,
        discount_percentage: distributor?.discount_percentage || 0
    };
}
async function getTopSellingProducts(limit = 20) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("top_selling_products").select(`
      *,
      product:products (*)
    `).eq("is_featured", true).order("order_index").limit(limit);
    if (error) throw error;
    return data;
}
async function createOrder(order, items) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    // Generar número de orden único
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    // Crear la orden
    const { data: newOrder, error: orderError } = await supabase.from("orders").insert({
        order_number: orderNumber,
        ...order
    }).select().single();
    if (orderError) throw orderError;
    // Crear los items de la orden
    const orderItems = items.map((item)=>({
            order_id: newOrder.id,
            ...item
        }));
    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) throw itemsError;
    return newOrder;
}
async function getCurrentUserOrders(limit = 50) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase.from("orders").select(`
      *,
      items:order_items (
        *,
        product:products (*),
        warehouse:warehouses (*)
      )
    `).eq("user_id", user.id).order("created_at", {
        ascending: false
    }).limit(limit);
    if (error) throw error;
    return data;
}
async function getOrderById(orderId) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("orders").select(`
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
    `).eq("id", orderId).single();
    if (error) throw error;
    return data;
}
async function updateOrderStatus(orderId, updates) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("orders").update(updates).eq("id", orderId).select().single();
    if (error) throw error;
    return data;
}
async function getDistributorMonthlySales(year, months = 12) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const distributor = await getCurrentDistributor();
    if (!distributor) return [];
    const currentYear = year || new Date().getFullYear();
    const { data, error } = await supabase.from("distributor_monthly_sales").select("*").eq("distributor_id", distributor.id).gte("year", currentYear - 1) // Últimos 2 años
    .order("year", {
        ascending: false
    }).order("month", {
        ascending: false
    }).limit(months);
    if (error) throw error;
    return data;
}
async function getDistributorCurrentMonthPerformance() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const distributor = await getCurrentDistributor();
    if (!distributor) return null;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const { data: sales } = await supabase.from("distributor_monthly_sales").select("*").eq("distributor_id", distributor.id).eq("year", year).eq("month", month).single();
    return {
        sales: sales || {
            sales_cocina: 0,
            sales_mesa: 0,
            sales_cafe_te_bar: 0,
            sales_termos_neveras: 0,
            sales_profesional: 0,
            total_sales: 0,
            total_orders: 0
        },
        budget: {
            cocina: distributor.monthly_budget_cocina,
            mesa: distributor.monthly_budget_mesa,
            cafe_te_bar: distributor.monthly_budget_cafe_te_bar,
            termos_neveras: distributor.monthly_budget_termos_neveras,
            profesional: distributor.monthly_budget_profesional,
            total: distributor.monthly_budget_cocina + distributor.monthly_budget_mesa + distributor.monthly_budget_cafe_te_bar + distributor.monthly_budget_termos_neveras + distributor.monthly_budget_profesional
        },
        distributor
    };
}
async function calculateDistributorMonthlySales(distributorId, year, month) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { error } = await supabase.rpc("calculate_distributor_monthly_sales", {
        p_distributor_id: distributorId,
        p_year: year,
        p_month: month
    });
    if (error) throw error;
    return true;
}
async function getBlogPosts(limit = 10, offset = 0) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("blog_posts").select(`
      *,
      author:user_profiles (*),
      blog_post_categories (
        category:blog_categories (*)
      )
    `).eq("status", "published").order("published_at", {
        ascending: false
    }).range(offset, offset + limit - 1);
    if (error) throw error;
    return data;
}
async function getBlogPostBySlug(slug) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    console.log("[v0] Searching for blog post with slug:", slug);
    // Get the post first
    const { data: post, error } = await supabase.from("blog_posts").select("*").eq("slug", slug).eq("status", "published").single();
    console.log("[v0] Blog post query result:", {
        found: !!post,
        error: error?.message
    });
    if (error) {
        console.error("[v0] Error fetching blog post:", error);
        return null;
    }
    if (!post) {
        console.log("[v0] No post found with slug:", slug);
        return null;
    }
    // Get author separately to avoid RLS recursion
    let author = null;
    if (post.author_id) {
        const { data: authorData } = await supabase.from("user_profiles").select("id, full_name, avatar_url").eq("id", post.author_id).single();
        author = authorData;
    }
    // Get categories separately
    const { data: postCategories } = await supabase.from("blog_post_categories").select(`
      category:blog_categories (
        id,
        name,
        slug
      )
    `).eq("post_id", post.id);
    // Increment views count asynchronously (don't wait for it)
    supabase.from("blog_posts").update({
        views_count: (post.views_count || 0) + 1
    }).eq("id", post.id).then(()=>{});
    return {
        ...post,
        author,
        blog_post_categories: postCategories || []
    };
}
async function getBlogPostsByCategory(categorySlug, limit = 10) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("blog_posts").select(`
      *,
      author:user_profiles (*),
      blog_post_categories!inner (
        category:blog_categories!inner (slug)
      )
    `).eq("blog_post_categories.blog_categories.slug", categorySlug).eq("status", "published").order("published_at", {
        ascending: false
    }).limit(limit);
    if (error) throw error;
    return data;
}
async function getBlogCategories() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("blog_categories").select(`
      *,
      blog_post_categories (count)
    `).order("name");
    if (error) throw error;
    return data;
}
async function searchBlogPosts(query, limit = 20) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("blog_posts").select(`
      *,
      author:user_profiles (*),
      blog_post_categories (
        category:blog_categories (*)
      )
    `).eq("status", "published").or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`).order("published_at", {
        ascending: false
    }).limit(limit);
    if (error) throw error;
    return data;
}
async function getRecentBlogPosts(limit = 5) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("blog_posts").select("id, slug, title, excerpt, featured_image_url, published_at").eq("status", "published").order("published_at", {
        ascending: false
    }).limit(limit);
    if (error) throw error;
    return data;
}
async function getRelatedBlogPosts(postId, limit = 3) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    // Get categories of current post
    const { data: currentCategories } = await supabase.from("blog_post_categories").select("category_id").eq("post_id", postId);
    if (!currentCategories || currentCategories.length === 0) {
        // If no categories, return recent posts
        const { data, error } = await supabase.from("blog_posts").select("id, slug, title, excerpt, featured_image_url, published_at").eq("status", "published").neq("id", postId).order("published_at", {
            ascending: false
        }).limit(limit);
        return data || [];
    }
    const categoryIds = currentCategories.map((c)=>c.category_id);
    // Get posts with same categories
    const { data: relatedPostIds } = await supabase.from("blog_post_categories").select("post_id").in("category_id", categoryIds).neq("post_id", postId);
    if (!relatedPostIds || relatedPostIds.length === 0) {
        return [];
    }
    const postIds = [
        ...new Set(relatedPostIds.map((p)=>p.post_id))
    ];
    const { data, error } = await supabase.from("blog_posts").select("id, slug, title, excerpt, featured_image_url, published_at").eq("status", "published").in("id", postIds).order("published_at", {
        ascending: false
    }).limit(limit);
    return data || [];
}
async function upsertBlogPost(post) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("blog_posts").upsert(post).select().single();
    if (error) throw error;
    return data;
}
async function deleteBlogPost(postId) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { error } = await supabase.from("blog_posts").delete().eq("id", postId);
    if (error) throw error;
    return true;
}
}),
"[project]/components/products/products-with-filters.tsx [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

// This file is generated by next-core EcmascriptClientReferenceModule.
__turbopack_context__.s([
    "ProductsWithFilters",
    ()=>ProductsWithFilters
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const ProductsWithFilters = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call ProductsWithFilters() from the server but ProductsWithFilters is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/components/products/products-with-filters.tsx <module evaluation>", "ProductsWithFilters");
}),
"[project]/components/products/products-with-filters.tsx [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

// This file is generated by next-core EcmascriptClientReferenceModule.
__turbopack_context__.s([
    "ProductsWithFilters",
    ()=>ProductsWithFilters
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const ProductsWithFilters = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call ProductsWithFilters() from the server but ProductsWithFilters is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/components/products/products-with-filters.tsx", "ProductsWithFilters");
}),
"[project]/components/products/products-with-filters.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$products$2f$products$2d$with$2d$filters$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/components/products/products-with-filters.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$products$2f$products$2d$with$2d$filters$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/components/products/products-with-filters.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$products$2f$products$2d$with$2d$filters$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/app/productos/[silo]/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SiloPage,
    "generateMetadata",
    ()=>generateMetadata
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/badge.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chef$2d$hat$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChefHat$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chef-hat.js [app-rsc] (ecmascript) <export default as ChefHat>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$utensils$2d$crossed$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__UtensilsCrossed$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/utensils-crossed.js [app-rsc] (ecmascript) <export default as UtensilsCrossed>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$coffee$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Coffee$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/coffee.js [app-rsc] (ecmascript) <export default as Coffee>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$thermometer$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Thermometer$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/thermometer.js [app-rsc] (ecmascript) <export default as Thermometer>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$briefcase$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Briefcase$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/briefcase.js [app-rsc] (ecmascript) <export default as Briefcase>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/package.js [app-rsc] (ecmascript) <export default as Package>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db/queries.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$products$2f$products$2d$with$2d$filters$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/products/products-with-filters.tsx [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
const silosIconMap = {
    cocina: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chef$2d$hat$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChefHat$3e$__["ChefHat"],
    mesa: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$utensils$2d$crossed$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__UtensilsCrossed$3e$__["UtensilsCrossed"],
    "cafe-te-bar": __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$coffee$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Coffee$3e$__["Coffee"],
    "termos-neveras": __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$thermometer$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Thermometer$3e$__["Thermometer"],
    profesional: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$briefcase$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Briefcase$3e$__["Briefcase"]
};
async function generateMetadata({ params }) {
    const { silo } = await params;
    const silos = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSilosWithSubcategories"])();
    const siloData = silos.find((s)=>s.slug === silo);
    if (!siloData) return {};
    return {
        title: `${siloData.name} - Mesanova`,
        description: siloData.description || `Productos de ${siloData.name}`
    };
}
async function SiloPage({ params, searchParams }) {
    const { silo } = await params;
    const search = await searchParams;
    const silos = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSilosWithSubcategories"])();
    const siloData = silos.find((s)=>s.slug === silo);
    if (!siloData) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["notFound"])();
    }
    const Icon = silosIconMap[silo] || __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__["Package"];
    // Obtener subcategoría seleccionada
    const selectedSubcategory = search.subcategoria ? siloData.subcategories?.find((s)=>s.slug === search.subcategoria) : null;
    // Si hay una subcategoría seleccionada, obtener tipos disponibles y productos
    let availableTypes = [];
    let products = [];
    if (selectedSubcategory) {
        availableTypes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getAvailableProductTypesBySubcategory"])(selectedSubcategory.slug);
        products = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getProductsBySubcategoryAndType"])(selectedSubcategory.slug, search.tipo);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "min-h-screen bg-background",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "py-12 px-4 bg-gradient-to-b from-primary/5 to-background",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "container mx-auto",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center justify-center gap-3 mb-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                    className: "h-10 w-10 text-primary"
                                }, void 0, false, {
                                    fileName: "[project]/app/productos/[silo]/page.tsx",
                                    lineNumber: 75,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    className: "text-4xl md:text-5xl font-bold",
                                    children: siloData.name
                                }, void 0, false, {
                                    fileName: "[project]/app/productos/[silo]/page.tsx",
                                    lineNumber: 76,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/productos/[silo]/page.tsx",
                            lineNumber: 74,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-center text-lg text-muted-foreground max-w-2xl mx-auto",
                            children: siloData.description || `Explora nuestra colección de productos de ${siloData.name}`
                        }, void 0, false, {
                            fileName: "[project]/app/productos/[silo]/page.tsx",
                            lineNumber: 78,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/productos/[silo]/page.tsx",
                    lineNumber: 73,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/productos/[silo]/page.tsx",
                lineNumber: 72,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "py-8 px-4 border-b bg-muted/30",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "container mx-auto",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-xl font-semibold mb-4",
                            children: "Subcategorías"
                        }, void 0, false, {
                            fileName: "[project]/app/productos/[silo]/page.tsx",
                            lineNumber: 87,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-wrap gap-2",
                            children: [
                                selectedSubcategory && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                    href: `/productos/${silo}`,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Badge"], {
                                        variant: "outline",
                                        className: "text-sm px-4 py-2 cursor-pointer hover:bg-muted transition-colors",
                                        children: "Ver todas"
                                    }, void 0, false, {
                                        fileName: "[project]/app/productos/[silo]/page.tsx",
                                        lineNumber: 92,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/productos/[silo]/page.tsx",
                                    lineNumber: 91,
                                    columnNumber: 15
                                }, this),
                                siloData.subcategories?.map((subcategory)=>{
                                    const isSelected = selectedSubcategory?.id === subcategory.id;
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                        href: `/productos/${silo}?subcategoria=${subcategory.slug}`,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Badge"], {
                                            variant: isSelected ? "default" : "secondary",
                                            className: "text-sm px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors",
                                            children: subcategory.name
                                        }, void 0, false, {
                                            fileName: "[project]/app/productos/[silo]/page.tsx",
                                            lineNumber: 102,
                                            columnNumber: 19
                                        }, this)
                                    }, subcategory.id, false, {
                                        fileName: "[project]/app/productos/[silo]/page.tsx",
                                        lineNumber: 101,
                                        columnNumber: 17
                                    }, this);
                                })
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/productos/[silo]/page.tsx",
                            lineNumber: 88,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/productos/[silo]/page.tsx",
                    lineNumber: 86,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/productos/[silo]/page.tsx",
                lineNumber: 85,
                columnNumber: 7
            }, this),
            selectedSubcategory && availableTypes.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "py-6 px-4 border-b bg-background",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "container mx-auto",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            className: "text-lg font-medium mb-3",
                            children: [
                                "Filtrar por tipo de producto en ",
                                selectedSubcategory.name
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/productos/[silo]/page.tsx",
                            lineNumber: 119,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-wrap gap-2",
                            children: [
                                search.tipo && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                    href: `/productos/${silo}?subcategoria=${selectedSubcategory.slug}`,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Badge"], {
                                        variant: "outline",
                                        className: "text-sm px-3 py-1.5 cursor-pointer hover:bg-muted transition-colors",
                                        children: "Todos los productos"
                                    }, void 0, false, {
                                        fileName: "[project]/app/productos/[silo]/page.tsx",
                                        lineNumber: 124,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/productos/[silo]/page.tsx",
                                    lineNumber: 123,
                                    columnNumber: 17
                                }, this),
                                availableTypes.map((type)=>{
                                    const isSelected = search.tipo === type.slug;
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                        href: `/productos/${silo}?subcategoria=${selectedSubcategory.slug}&tipo=${type.slug}`,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Badge"], {
                                            variant: isSelected ? "default" : "outline",
                                            className: "text-sm px-3 py-1.5 cursor-pointer hover:bg-primary/10 transition-colors",
                                            children: [
                                                type.name,
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "ml-1.5 text-xs opacity-70",
                                                    children: [
                                                        "(",
                                                        type.product_count,
                                                        ")"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/productos/[silo]/page.tsx",
                                                    lineNumber: 145,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/productos/[silo]/page.tsx",
                                            lineNumber: 140,
                                            columnNumber: 21
                                        }, this)
                                    }, type.id, false, {
                                        fileName: "[project]/app/productos/[silo]/page.tsx",
                                        lineNumber: 136,
                                        columnNumber: 19
                                    }, this);
                                })
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/productos/[silo]/page.tsx",
                            lineNumber: 120,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/productos/[silo]/page.tsx",
                    lineNumber: 118,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/productos/[silo]/page.tsx",
                lineNumber: 117,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "py-12 px-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "container mx-auto",
                    children: selectedSubcategory ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-8",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-2xl font-bold",
                                    children: search.tipo ? availableTypes.find((t)=>t.slug === search.tipo)?.name : selectedSubcategory.name
                                }, void 0, false, {
                                    fileName: "[project]/app/productos/[silo]/page.tsx",
                                    lineNumber: 161,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/productos/[silo]/page.tsx",
                                lineNumber: 160,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$products$2f$products$2d$with$2d$filters$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ProductsWithFilters"], {
                                products: products,
                                subcategories: siloData.subcategories || [],
                                siloSlug: silo
                            }, void 0, false, {
                                fileName: "[project]/app/productos/[silo]/page.tsx",
                                lineNumber: 166,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center py-12",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-2xl font-bold mb-4",
                                children: "Selecciona una subcategoría"
                            }, void 0, false, {
                                fileName: "[project]/app/productos/[silo]/page.tsx",
                                lineNumber: 174,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-muted-foreground",
                                children: "Elige una subcategoría arriba para ver los productos disponibles"
                            }, void 0, false, {
                                fileName: "[project]/app/productos/[silo]/page.tsx",
                                lineNumber: 175,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/productos/[silo]/page.tsx",
                        lineNumber: 173,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/productos/[silo]/page.tsx",
                    lineNumber: 157,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/productos/[silo]/page.tsx",
                lineNumber: 156,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/productos/[silo]/page.tsx",
        lineNumber: 70,
        columnNumber: 5
    }, this);
}
}),
"[project]/app/productos/[silo]/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/productos/[silo]/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__7aaeedb4._.js.map