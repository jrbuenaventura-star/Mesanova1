import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { currentErpAdapter } from "@/lib/delivery/erp-adapter"
import type { DeliveryPublicOrderView } from "@/lib/delivery/types"

type QrRow = {
  id: string
  order_id: string
  warehouse_id: string
  status: string
}

type PackageRow = {
  id: string
  package_number: number
  total_packages: number
  customer_number: string | null
  provider_barcode: string | null
  quantity_total: number
  sku_distribution: unknown
}

export async function getDeliveryQrById(supabaseAdmin: SupabaseClient, qrId: string) {
  const { data, error } = await supabaseAdmin
    .from("delivery_qr_tokens")
    .select("*")
    .eq("id", qrId)
    .single()

  if (error || !data) {
    return null
  }
  return data
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

export async function buildPublicOrderViewForQr(
  supabaseAdmin: SupabaseClient,
  qrRow: QrRow
): Promise<DeliveryPublicOrderView | null> {
  const baseSnapshot = await currentErpAdapter.getOrderSnapshot(supabaseAdmin, qrRow.order_id)
  if (!baseSnapshot) {
    return null
  }

  const { data: packages } = await supabaseAdmin
    .from("delivery_packages")
    .select(
      "id, package_number, total_packages, customer_number, provider_barcode, quantity_total, sku_distribution"
    )
    .eq("qr_id", qrRow.id)
    .order("package_number", { ascending: true })

  if (!packages || packages.length === 0) {
    return {
      ...baseSnapshot,
      warehouse_id: qrRow.warehouse_id,
      status: qrRow.status,
    }
  }

  const packageRows = packages as PackageRow[]
  const mergedItems = baseSnapshot.items.map((item) => {
    const packageDistribution: Array<{ package_number: number; quantity: number }> = []
    for (const pkg of packageRows) {
      const skuDistribution = toArray<{ sku?: string; quantity?: number }>(pkg.sku_distribution)
      const found = skuDistribution.find(
        (skuEntry) => (skuEntry.sku || "").trim().toLowerCase() === item.sku.trim().toLowerCase()
      )
      if (found) {
        packageDistribution.push({
          package_number: pkg.package_number,
          quantity: Math.max(0, Number(found.quantity || 0)),
        })
      }
    }
    return {
      ...item,
      package_distribution: packageDistribution.length
        ? packageDistribution
        : item.package_distribution,
    }
  })

  return {
    ...baseSnapshot,
    warehouse_id: qrRow.warehouse_id,
    status: qrRow.status,
    total_packages: packageRows.length,
    packages: packageRows.map((pkg) => ({
      package_number: pkg.package_number,
      total_packages: pkg.total_packages,
      customer_number: pkg.customer_number,
      provider_barcode: pkg.provider_barcode,
      quantity_total: pkg.quantity_total,
    })),
    items: mergedItems,
  }
}
