export interface Silo {
  id: string
  slug: string
  name: string
  description?: string
  seo_title?: string
  seo_description?: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface Subcategory {
  id: string
  silo_id: string
  slug: string
  name: string
  description?: string
  seo_title?: string
  seo_description?: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  pdt_codigo: string
  pdt_descripcion: string
  pdt_empaque?: string
  upp_existencia: number
  upp_costou?: number
  upp_costop?: number
  valorinv?: number
  ubicacion?: string
  precio?: number
  precio_dist?: number
  ref_pub?: string
  nombre_comercial?: string
  descripcion_larga?: string
  caracteristicas?: string
  especificaciones_tecnicas?: Record<string, any>
  reposicion_cuando?: string
  reposicion_cuanto?: number
  outer_pack?: number
  pertenece_coleccion: boolean
  nombre_coleccion?: string
  collection_id?: string
  material?: string
  color?: string
  dimensiones?: string
  peso?: number
  capacidad?: string
  fecha_reposicion?: string
  cantidad_reposicion?: number
  instrucciones_uso?: string
  instrucciones_cuidado?: string
  garantia?: string
  pais_origen?: string
  marca?: string
  linea_producto?: string
  slug?: string
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  is_active: boolean
  is_featured: boolean
  is_new: boolean
  is_on_sale: boolean
  imagen_principal_url?: string
  // Campos CSV adicionales (schema 016+)
  codigo_barras?: string
  descuento_porcentaje?: number
  precio_antes?: number
  pedido_en_camino?: number
  descontinuado?: boolean
  product_type_id?: string
  momentos_uso?: string
  descripcion_distribuidor?: string
  argumentos_venta?: string
  ubicacion_tienda?: string
  margen_sugerido?: number
  rotacion_esperada?: 'alta' | 'media' | 'baja'
  segment?: 'core' | 'value' | 'premium'
  tags?: string[]
  video_url?: string
  ficha_tecnica_url?: string
  fecha_lanzamiento?: string
  productos_afines_csv?: string
  last_erp_sync?: string
  last_csv_update?: string
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export interface ProductCategory {
  id: string
  product_id: string
  subcategory_id: string
  is_primary: boolean
  created_at: string
}

export interface ProductMedia {
  id: string
  product_id: string
  media_type: "image" | "video"
  url: string
  thumbnail_url?: string
  title?: string
  alt_text?: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface ProductSimilar {
  id: string
  product_id: string
  similar_product_id: string
  order_index: number
  created_at: string
}

export interface ProductComplement {
  id: string
  product_id: string
  complement_product_id: string
  order_index: number
  created_at: string
}

export interface ProductType {
  id: string
  subcategory_id: string
  name: string
  slug: string
  description?: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface ProductProductType {
  id: string
  product_id: string
  product_type_id: string
  created_at: string
}

export interface ProductTypeWithCount extends ProductType {
  product_count?: number
}

export interface Warehouse {
  id: string
  code: string
  name: string
  description?: string
  warehouse_type: "bodega" | "punto_exhibicion" | "segundas" | "otro"
  address?: string
  is_active: boolean
  can_ship: boolean
  show_in_frontend: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface ProductWarehouseStock {
  id: string
  product_id: string
  warehouse_id: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  min_stock: number
  max_stock?: number
  last_sync_at?: string
  updated_at: string
}

// Tipos extendidos con relaciones
export interface ProductWithCategories extends Product {
  categories?: (ProductCategory & {
    subcategory?: Subcategory & {
      silo?: Silo
    }
  })[]
  product_types?: (ProductProductType & {
    product_type?: ProductType
  })[]
  media?: ProductMedia[]
  similar_products?: Product[]
  complement_products?: Product[]
  warehouse_stock?: (ProductWarehouseStock & {
    warehouse?: Warehouse
  })[]
  collection?: Collection
}

export interface WarehouseWithStock extends Warehouse {
  total_products?: number
  total_stock_value?: number
  low_stock_products?: number
}

export type UserRole = "superadmin" | "distributor" | "aliado" | "end_user"

export interface UserProfile {
  id: string
  role: UserRole
  full_name?: string
  phone?: string
  document_type?: string
  document_number?: string
  shipping_address?: string
  shipping_city?: string
  shipping_state?: string
  shipping_postal_code?: string
  shipping_country?: string
  is_active: boolean
  is_verified: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface Distributor {
  id: string
  user_id: string
  aliado_id?: string
  company_name: string
  company_rif?: string
  commercial_name?: string
  business_type?: string
  discount_percentage: number
  has_custom_pricing: boolean
  monthly_budget_cocina: number
  monthly_budget_mesa: number
  monthly_budget_cafe_te_bar: number
  monthly_budget_termos_neveras: number
  monthly_budget_profesional: number
  credit_limit: number
  current_balance: number
  is_active: boolean
  requires_approval: boolean
  approved_at?: string
  approved_by?: string
  legal_rep_name?: string
  legal_rep_document?: string
  main_address?: string
  main_city?: string
  main_state?: string
  payment_terms?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface ShippingAddress {
  id: string
  user_id: string
  label: string
  full_name: string
  phone?: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code?: string
  country: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface DistributorCustomPrice {
  id: string
  distributor_id: string
  product_id: string
  custom_price: number
  discount_percentage?: number
  valid_from: string
  valid_until?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TopSellingProduct {
  id: string
  product_id: string
  period_start: string
  period_end: string
  total_quantity_sold: number
  total_revenue: number
  order_index: number
  is_featured: boolean
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export type OrderStatus = 
  | "borrador"
  | "por_aprobar"
  | "aprobada"
  | "en_preparacion"
  | "enviada"
  | "entregada"
  | "cancelada"
  | "devuelta_rechazada"

export interface Order {
  id: string
  order_number: string
  user_id: string
  distributor_id?: string
  aliado_id?: string
  company_id?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  emisor: string
  fecha_pedido: string
  fecha_entrega_estimada?: string
  status: OrderStatus
  payment_status: string
  payment_method?: string
  shipping_method?: string
  subtotal: number
  discount_amount: number
  discount_percentage?: number
  tax_amount: number
  iva_porcentaje: number
  shipping_cost: number
  total: number
  shipping_full_name?: string
  shipping_phone?: string
  shipping_address?: string
  shipping_city?: string
  shipping_state?: string
  shipping_postal_code?: string
  shipping_country?: string
  tracking_number?: string
  tracking_url?: string
  carrier?: string
  shipped_at?: string
  delivered_at?: string
  notes?: string
  internal_notes?: string
  approved_at?: string
  approved_by?: string
  rejected_at?: string
  rejected_reason?: string
  cancelled_at?: string
  cancelled_reason?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_code?: string
  product_name?: string
  quantity: number
  unit_price: number
  discount_percentage: number
  discount_amount: number
  subtotal: number
  warehouse_id?: string
  created_at: string
}

export interface DistributorMonthlySales {
  id: string
  distributor_id: string
  year: number
  month: number
  sales_cocina: number
  sales_mesa: number
  sales_cafe_te_bar: number
  sales_termos_neveras: number
  sales_profesional: number
  total_sales: number
  total_orders: number
  created_at: string
  updated_at: string
}

// Tipos extendidos con relaciones
export interface UserProfileWithDistributor extends UserProfile {
  distributor?: Distributor
}

export interface DistributorWithProfile extends Distributor {
  profile?: UserProfile
  custom_prices?: DistributorCustomPrice[]
  monthly_sales?: DistributorMonthlySales[]
}

export interface OrderWithItems extends Order {
  items?: (OrderItem & {
    product?: Product
    warehouse?: Warehouse
  })[]
  user?: UserProfile
  distributor?: Distributor
  aliado?: Aliado
}

export interface TopSellingProductWithDetails extends TopSellingProduct {
  product?: Product
}

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt?: string
  content: string
  featured_image_url?: string
  author_id?: string
  status: "draft" | "published" | "archived"
  published_at?: string
  views_count: number
  created_at: string
  updated_at: string
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description?: string
  created_at: string
}

export interface BlogPostCategory {
  post_id: string
  category_id: string
}

// Extended blog types with relations
export interface BlogPostWithCategories extends BlogPost {
  author?: UserProfile
  categories?: BlogCategory[]
}

export interface BlogCategoryWithCount extends BlogCategory {
  post_count?: number
}

export interface Collection {
  id: string
  name: string
  slug: string
  description?: string
  imagen_url?: string
  is_active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  razon_social: string
  nombre_comercial?: string
  nit: string
  tipo_empresa?: string
  direccion?: string
  ciudad?: string
  estado?: string
  codigo_postal?: string
  pais: string
  telefono_principal?: string
  telefono_secundario?: string
  email_principal?: string
  email_facturacion?: string
  sitio_web?: string
  terminos_pago?: string
  descuento_general: number
  limite_credito: number
  saldo_actual: number
  dia_pago?: number
  distribuidor_asignado_id?: string
  is_active: boolean
  notas?: string
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export interface CompanyContact {
  id: string
  company_id: string
  nombre_completo: string
  cargo?: string
  departamento?: string
  email?: string
  telefono?: string
  celular?: string
  extension?: string
  es_contacto_principal: boolean
  recibe_facturas: boolean
  recibe_pedidos: boolean
  is_active: boolean
  notas?: string
  created_at: string
  updated_at: string
}

export interface CompanyWithContacts extends Company {
  contacts?: CompanyContact[]
  distributor?: Distributor
  total_orders?: number
  total_spent?: number
}

export interface CompanyContactWithCompany extends CompanyContact {
  company?: Company
}

export interface OrderWithDetails extends OrderWithItems {
  company?: Company
  company_contact?: CompanyContact
}

// ===========================================
// ALIADOS (ex corredores/canales)
// ===========================================

export interface Aliado {
  id: string
  user_id: string
  company_name: string
  contact_name?: string
  phone?: string
  email?: string
  total_sales: number
  commission_percentage: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AliadoWithUser extends Aliado {
  user?: UserProfile
}

export interface AliadoWithDistributors extends Aliado {
  distributors?: Distributor[]
}

// ===========================================
// DOCUMENTOS DE DISTRIBUIDOR
// ===========================================

export type DocumentType = 
  | "estados_financieros" 
  | "rut" 
  | "camara_comercio" 
  | "certificado_bancario"

export type DocumentStatus = "pending" | "approved" | "rejected" | "expired"

export interface DistributorDocument {
  id: string
  distributor_id: string
  document_type: DocumentType
  file_name: string
  file_url?: string
  google_drive_file_id?: string
  file_size?: number
  mime_type?: string
  fiscal_year?: number
  status: DocumentStatus
  expires_at?: string
  reviewed_at?: string
  reviewed_by?: string
  review_notes?: string
  uploaded_at: string
  updated_at: string
}

// ===========================================
// CRM - LEADS
// ===========================================

export type LeadStage = 
  | "prospecto"
  | "contactado"
  | "interesado"
  | "docs_comerciales_enviados"
  | "docs_analisis_solicitados"
  | "docs_analisis_recibidos"
  | "aprobado"
  | "rechazado"

export const LEAD_STAGES: { value: LeadStage; label: string }[] = [
  { value: "prospecto", label: "Prospecto" },
  { value: "contactado", label: "Contactado" },
  { value: "interesado", label: "Interesado" },
  { value: "docs_comerciales_enviados", label: "Docs. comerciales enviados" },
  { value: "docs_analisis_solicitados", label: "Docs. para análisis solicitados" },
  { value: "docs_analisis_recibidos", label: "Docs. para análisis recibidos" },
  { value: "aprobado", label: "Aprobado" },
  { value: "rechazado", label: "Rechazado" },
]

export interface Lead {
  id: string
  aliado_id?: string
  company_name: string
  business_type?: string
  contact_name: string
  contact_phone?: string
  contact_email?: string
  contact_position?: string
  city?: string
  state?: string
  address?: string
  stage: LeadStage
  last_contact_date?: string
  next_follow_up_date?: string
  notes?: string
  converted_to_distributor_id?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

export interface LeadWithAliado extends Lead {
  aliado?: Aliado
}

export type LeadActivityType = "call" | "email" | "meeting" | "note" | "stage_change" | "document"

export interface LeadActivity {
  id: string
  lead_id: string
  user_id?: string
  activity_type: LeadActivityType
  description: string
  old_stage?: LeadStage
  new_stage?: LeadStage
  created_at: string
}

// ===========================================
// FACTURAS
// ===========================================

export type PaymentStatus = "pending" | "partial" | "paid" | "overdue"

export interface Invoice {
  id: string
  distributor_id: string
  order_id?: string
  invoice_number: string
  subtotal: number
  tax: number
  total: number
  issue_date: string
  due_date: string
  payment_status: PaymentStatus
  amount_paid: number
  last_payment_date?: string
  payment_reference?: string
  created_at: string
  updated_at: string
}

export interface InvoiceWithDistributor extends Invoice {
  distributor?: Distributor
  urgency?: "ok" | "due_soon" | "overdue"
  amount_pending?: number
}

// ===========================================
// EXTENDED DISTRIBUTOR
// ===========================================

export interface DistributorExtended extends Distributor {
  aliado_id?: string
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  contact_position?: string
  address?: string
  city?: string
  state?: string
  documents_complete: boolean
  documents_expire_at?: string
  last_purchase_date?: string
  total_purchases: number
}

export interface DistributorWithAliado extends DistributorExtended {
  aliado?: Aliado
  documents?: DistributorDocument[]
}

export interface DistributorSummary {
  id: string
  company_name: string
  business_type?: string
  contact_name?: string
  contact_email?: string
  is_active: boolean
  aliado_id?: string
  last_purchase_date?: string
  total_purchases: number
  credit_limit: number
  current_balance: number
  avg_monthly_purchases: number
  orders_last_year: number
}
