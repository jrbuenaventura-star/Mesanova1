import { NextResponse } from "next/server"

import { requireSuperadminUser } from "@/lib/delivery/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

type IncidentRow = {
  id: string
  qr_id: string | null
  product_reference: string
  defective_quantity: number
  transporter_id: string | null
  warehouse_id: string | null
  reported_at: string
}

type ConfirmationRow = {
  id: string
  qr_id: string
  result: string
  accepted_packages_count: number
  total_packages: number
  confirmed_at: string
  client_geo_lat: number | null
  client_geo_lng: number | null
}

type QrRow = {
  id: string
  order_id: string
  warehouse_id: string
  transporter_id: string | null
  status: string
  issued_at: string
  confirmed_at: string | null
  expires_at: string
  delivery_batch_id: string
  qr_code_ref: string
}

function safeNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function groupCount<T>(rows: T[], keyGetter: (row: T) => string) {
  const map = new Map<string, number>()
  rows.forEach((row) => {
    const key = keyGetter(row)
    map.set(key, (map.get(key) || 0) + 1)
  })
  return [...map.entries()].map(([key, count]) => ({ key, count }))
}

export async function GET(request: Request) {
  try {
    const auth = await requireSuperadminUser()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabaseAdmin = createAdminClient()
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const now = new Date()
    const defaultFrom = new Date(now)
    defaultFrom.setDate(defaultFrom.getDate() - 30)
    const fromIso = from || defaultFrom.toISOString()
    const toIso = to || now.toISOString()

    const [qrResponse, incidentsResponse, confirmationsResponse, challengesResponse, offlineResponse] =
      await Promise.all([
        supabaseAdmin
          .from("delivery_qr_tokens")
          .select(
            "id, order_id, warehouse_id, transporter_id, status, issued_at, confirmed_at, expires_at, delivery_batch_id, qr_code_ref"
          )
          .gte("issued_at", fromIso)
          .lte("issued_at", toIso)
          .order("issued_at", { ascending: false }),
        supabaseAdmin
          .from("delivery_incidents")
          .select("id, qr_id, product_reference, defective_quantity, transporter_id, warehouse_id, reported_at")
          .gte("reported_at", fromIso)
          .lte("reported_at", toIso),
        supabaseAdmin
          .from("delivery_confirmations")
          .select(
            "id, qr_id, result, accepted_packages_count, total_packages, confirmed_at, client_geo_lat, client_geo_lng"
          )
          .gte("confirmed_at", fromIso)
          .lte("confirmed_at", toIso),
        supabaseAdmin
          .from("delivery_otp_challenges")
          .select("id, qr_id, requested_at, verified_at")
          .gte("requested_at", fromIso)
          .lte("requested_at", toIso),
        supabaseAdmin
          .from("delivery_offline_events")
          .select("id")
          .eq("sync_status", "pending"),
      ])

    if (qrResponse.error || incidentsResponse.error || confirmationsResponse.error || challengesResponse.error) {
      return NextResponse.json(
        {
          error:
            qrResponse.error?.message ||
            incidentsResponse.error?.message ||
            confirmationsResponse.error?.message ||
            challengesResponse.error?.message ||
            "Error loading delivery dashboard",
        },
        { status: 500 }
      )
    }

    const qrRows = (qrResponse.data || []) as QrRow[]
    const incidentRows = (incidentsResponse.data || []) as IncidentRow[]
    const confirmationRows = (confirmationsResponse.data || []) as ConfirmationRow[]
    const otpRows = (challengesResponse.data || []) as Array<{
      id: string
      qr_id: string
      requested_at: string
      verified_at: string | null
    }>

    const pendingCount = qrRows.filter((row) => row.status === "pendiente").length
    const confirmedCount = qrRows.filter((row) => row.status === "confirmado").length
    const incidentCount = qrRows.filter((row) => row.status === "confirmado_con_incidente").length
    const rejectedCount = qrRows.filter((row) => row.status === "rechazado").length
    const expiredCount = qrRows.filter((row) => row.status === "expirado").length

    const otpDurations = otpRows
      .filter((row) => row.verified_at)
      .map((row) => {
        const start = new Date(row.requested_at).getTime()
        const end = new Date(row.verified_at as string).getTime()
        return end > start ? (end - start) / 1000 : 0
      })
      .filter((value) => value > 0)

    const averageValidationSeconds = otpDurations.length
      ? otpDurations.reduce((acc, value) => acc + value, 0) / otpDurations.length
      : 0

    const claimsBySku = groupCount(incidentRows, (row) => row.product_reference || "N/A")
      .map((entry) => ({
        sku: entry.key,
        claims: entry.count,
        defective_quantity: incidentRows
          .filter((row) => (row.product_reference || "N/A") === entry.key)
          .reduce((acc, row) => acc + safeNumber(row.defective_quantity), 0),
      }))
      .sort((a, b) => b.claims - a.claims)
      .slice(0, 20)

    const claimsByTransporter = groupCount(
      incidentRows,
      (row) => row.transporter_id || "sin_transportador"
    )
      .map((entry) => ({
        transporter_id: entry.key,
        claims: entry.count,
      }))
      .sort((a, b) => b.claims - a.claims)

    const claimsByWarehouse = groupCount(incidentRows, (row) => row.warehouse_id || "sin_bodega")
      .map((entry) => ({
        warehouse_id: entry.key,
        claims: entry.count,
      }))
      .sort((a, b) => b.claims - a.claims)

    const heatmap = groupCount(
      confirmationRows.filter((row) => row.client_geo_lat !== null && row.client_geo_lng !== null),
      (row) =>
        `${Number(row.client_geo_lat).toFixed(2)},${Number(row.client_geo_lng).toFixed(2)}`
    )
      .map((entry) => {
        const [lat, lng] = entry.key.split(",").map((value) => Number(value))
        return { lat, lng, count: entry.count }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 100)

    const transporterTotals = groupCount(
      qrRows.filter((row) => !!row.transporter_id),
      (row) => row.transporter_id || "sin_transportador"
    )

    const transporterScore = transporterTotals
      .map((entry) => {
        const incidents = incidentRows.filter(
          (row) => (row.transporter_id || "sin_transportador") === entry.key
        ).length
        const confirmed = qrRows.filter(
          (row) =>
            (row.transporter_id || "sin_transportador") === entry.key &&
            (row.status === "confirmado" || row.status === "confirmado_con_incidente")
        ).length
        const score = entry.count > 0 ? ((confirmed - incidents) / entry.count) * 100 : 0
        return {
          transporter_id: entry.key,
          total_deliveries: entry.count,
          incidents,
          score: Number(score.toFixed(2)),
        }
      })
      .sort((a, b) => b.score - a.score)

    const totalDefectiveQty = incidentRows.reduce(
      (acc, row) => acc + safeNumber(row.defective_quantity),
      0
    )
    const totalAcceptedPackages = confirmationRows.reduce(
      (acc, row) => acc + safeNumber(row.accepted_packages_count),
      0
    )
    const potentialShrinkageIndex =
      totalAcceptedPackages > 0 ? Number((totalDefectiveQty / totalAcceptedPackages).toFixed(4)) : 0

    const criticalSkuRanking = claimsBySku
      .map((row) => ({
        sku: row.sku,
        score: row.claims * 3 + row.defective_quantity,
        claims: row.claims,
        defective_quantity: row.defective_quantity,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)

    const recent = qrRows.slice(0, 100).map((row) => ({
      ...row,
      incident: incidentRows.some((incident) => incident.qr_id === row.id),
    }))

    return NextResponse.json({
      range: {
        from: fromIso,
        to: toIso,
      },
      operativo: {
        entregas_pendientes: pendingCount,
        entregas_confirmadas: confirmedCount,
        entregas_con_incidencia: incidentCount,
        entregas_rechazadas: rejectedCount,
        entregas_expiradas: expiredCount,
        tiempo_promedio_validacion_segundos: Number(averageValidationSeconds.toFixed(2)),
        sincronizaciones_offline_pendientes: offlineResponse.data?.length || 0,
      },
      analitico: {
        reclamaciones_por_sku: claimsBySku,
        reclamaciones_por_transportador: claimsByTransporter,
        reclamaciones_por_bodega: claimsByWarehouse,
        heatmap_geografico: heatmap,
        score_por_transportador: transporterScore,
        indice_merma_potencial: potentialShrinkageIndex,
        ranking_skus_criticos: criticalSkuRanking,
      },
      recent,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
