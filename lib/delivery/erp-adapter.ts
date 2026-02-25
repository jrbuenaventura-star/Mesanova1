import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { DeliveryPublicOrderView } from "@/lib/delivery/types"

type ErpSyncEventInput = {
  order_id?: string
  source_system?: string
  event_type: string
  event_payload: Record<string, unknown>
}

type SnapshotRow = {
  order_id: string
  order_number: string
  customer_name: string | null
  shipping_address: string | null
  warehouse_id: string | null
  warehouse_name: string | null
  status: string | null
  items: unknown
  packages: unknown
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function normalizeSnapshot(snapshot: SnapshotRow): DeliveryPublicOrderView {
  const packages = toArray<{
    package_number?: number
    total_packages?: number
    customer_number?: string | null
    provider_barcode?: string | null
    quantity_total?: number
  }>(snapshot.packages)

  const items = toArray<{
    sku?: string
    name?: string
    quantity_total?: number
    package_distribution?: Array<{ package_number?: number; quantity?: number }>
  }>(snapshot.items)

  const normalizedPackages = packages
    .map((pkg, index) => ({
      package_number: pkg.package_number || index + 1,
      total_packages: pkg.total_packages || Math.max(packages.length, 1),
      customer_number: pkg.customer_number || null,
      provider_barcode: pkg.provider_barcode || null,
      quantity_total: Math.max(0, Number(pkg.quantity_total || 0)),
    }))
    .sort((a, b) => a.package_number - b.package_number)

  return {
    order_id: snapshot.order_id,
    order_number: snapshot.order_number,
    customer_name: snapshot.customer_name || null,
    shipping_address: snapshot.shipping_address || null,
    warehouse_id: snapshot.warehouse_id || "desconocida",
    warehouse_name: snapshot.warehouse_name || null,
    status: snapshot.status || null,
    total_packages: normalizedPackages.length || 1,
    packages: normalizedPackages.length
      ? normalizedPackages
      : [
          {
            package_number: 1,
            total_packages: 1,
            customer_number: null,
            provider_barcode: null,
            quantity_total: 0,
          },
        ],
    items: items.map((item) => ({
      sku: item.sku || "N/A",
      name: item.name || "Producto",
      quantity_total: Math.max(0, Number(item.quantity_total || 0)),
      package_distribution: toArray<{ package_number?: number; quantity?: number }>(
        item.package_distribution
      ).map((distribution) => ({
        package_number: distribution.package_number || 1,
        quantity: Math.max(0, Number(distribution.quantity || 0)),
      })),
    })),
  }
}

async function buildSnapshotFromCurrentOrders(
  supabaseAdmin: SupabaseClient,
  orderId: string
): Promise<SnapshotRow | null> {
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select(`
      id,
      order_number,
      customer_name,
      shipping_address,
      shipping_city,
      status,
      items:order_items (
        product_code,
        product_name,
        quantity,
        warehouse_id
      )
    `)
    .eq("id", orderId)
    .single()

  if (error || !order) {
    return null
  }

  const orderItems = toArray<{
    product_code?: string | null
    product_name?: string | null
    quantity?: number | null
    warehouse_id?: string | null
  }>(order.items)

  const itemRows = orderItems.map((item) => ({
    sku: item.product_code || "N/A",
    name: item.product_name || "Producto",
    quantity_total: Math.max(0, Number(item.quantity || 0)),
    package_distribution: [
      {
        package_number: 1,
        quantity: Math.max(0, Number(item.quantity || 0)),
      },
    ],
  }))

  const packages = [
    {
      package_number: 1,
      total_packages: 1,
      customer_number: null,
      provider_barcode: null,
      quantity_total: itemRows.reduce((acc, item) => acc + item.quantity_total, 0),
    },
  ]

  const warehouseId =
    orderItems.find((item) => item.warehouse_id)?.warehouse_id ||
    (typeof order.shipping_city === "string" && order.shipping_city.trim()
      ? `city-${order.shipping_city.trim().toLowerCase()}`
      : "desconocida")

  const snapshotRow: SnapshotRow = {
    order_id: String(order.id),
    order_number: order.order_number || String(order.id).slice(0, 8),
    customer_name: order.customer_name || null,
    shipping_address: order.shipping_address || null,
    warehouse_id: warehouseId || "desconocida",
    warehouse_name: null,
    status: order.status || null,
    items: itemRows,
    packages,
  }

  await supabaseAdmin.from("delivery_erp_order_snapshots").upsert(
    {
      ...snapshotRow,
      source_system: "erp_actual",
      raw_payload: {
        order_id: order.id,
      },
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "order_id" }
  )

  return snapshotRow
}

export interface ErpDeliveryAdapter {
  getOrderSnapshot: (
    supabaseAdmin: SupabaseClient,
    orderId: string
  ) => Promise<DeliveryPublicOrderView | null>
  ingestSyncEvent: (supabaseAdmin: SupabaseClient, event: ErpSyncEventInput) => Promise<void>
}

export const currentErpAdapter: ErpDeliveryAdapter = {
  async getOrderSnapshot(supabaseAdmin, orderId) {
    const { data: snapshotRow, error } = await supabaseAdmin
      .from("delivery_erp_order_snapshots")
      .select(
        "order_id, order_number, customer_name, shipping_address, warehouse_id, warehouse_name, status, items, packages"
      )
      .eq("order_id", orderId)
      .single()

    if (!error && snapshotRow) {
      return normalizeSnapshot(snapshotRow as SnapshotRow)
    }

    const rebuilt = await buildSnapshotFromCurrentOrders(supabaseAdmin, orderId)
    if (!rebuilt) {
      return null
    }

    return normalizeSnapshot(rebuilt)
  },

  async ingestSyncEvent(supabaseAdmin, event) {
    await supabaseAdmin.from("delivery_erp_sync_events").insert({
      order_id: event.order_id || null,
      source_system: event.source_system || "erp_actual",
      event_type: event.event_type,
      event_payload: event.event_payload,
      status: "pending",
    })
  },
}
