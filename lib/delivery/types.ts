export type DeliveryQrStatus =
  | "pendiente"
  | "confirmado"
  | "confirmado_con_incidente"
  | "rechazado"
  | "expirado"

export type DeliveryOtpChannel = "sms" | "whatsapp"

export interface DeliveryPackageInput {
  package_number: number
  total_packages: number
  customer_number?: string
  provider_barcode?: string
  quantity_total?: number
  sku_distribution?: Array<{
    sku: string
    name?: string
    quantity: number
  }>
}

export interface DeliveryQrCreateInput {
  order_id: string
  customer_id?: string
  warehouse_id: string
  delivery_batch_id: string
  transporter_id?: string
  expires_in_minutes?: number
  metadata?: Record<string, unknown>
  packages: DeliveryPackageInput[]
}

export interface DeliveryTokenPayload {
  typ: "delivery_qr"
  jti: string
  order_id: string
  warehouse_id: string
  delivery_batch_id: string
  nonce: string
  iat: number
  exp: number
}

export interface DeliveryItemView {
  sku: string
  name: string
  quantity_total: number
  package_distribution: Array<{
    package_number: number
    quantity: number
  }>
}

export interface DeliveryPublicOrderView {
  order_id: string
  order_number: string
  customer_name: string | null
  shipping_address: string | null
  warehouse_id: string
  warehouse_name: string | null
  status: string | null
  total_packages: number
  packages: Array<{
    package_number: number
    total_packages: number
    customer_number: string | null
    provider_barcode: string | null
    quantity_total: number
  }>
  items: DeliveryItemView[]
}

export interface DeliverySessionContext {
  session_id: string
  session_token: string
  qr_id: string
  order_id: string
  expires_at: string
}

export interface DeliveryOfflineHashInput {
  order_id: string
  timestamp: string
  gps: string
  device_id: string
}
