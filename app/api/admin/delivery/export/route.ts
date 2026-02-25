import { NextResponse } from "next/server"

import { requireSuperadminUser } from "@/lib/delivery/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

function csvEscape(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value)
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function buildCsv(rows: Array<Array<string | number | null | undefined>>) {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n")
}

export async function GET(request: Request) {
  try {
    const auth = await requireSuperadminUser()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const now = new Date()
    const defaultFrom = new Date(now)
    defaultFrom.setDate(defaultFrom.getDate() - 30)
    const fromIso = from || defaultFrom.toISOString()
    const toIso = to || now.toISOString()

    const supabaseAdmin = createAdminClient()

    const [qrResponse, incidentsResponse] = await Promise.all([
      supabaseAdmin
        .from("delivery_qr_tokens")
        .select(
          "id, qr_code_ref, order_id, warehouse_id, delivery_batch_id, transporter_id, status, issued_at, expires_at, confirmed_at"
        )
        .gte("issued_at", fromIso)
        .lte("issued_at", toIso)
        .order("issued_at", { ascending: false }),
      supabaseAdmin
        .from("delivery_incidents")
        .select(
          "id, qr_id, order_id, invoice_number, product_reference, defective_quantity, warehouse_id, transporter_id, status, reported_at, pqrs_ticket_id"
        )
        .gte("reported_at", fromIso)
        .lte("reported_at", toIso)
        .order("reported_at", { ascending: false }),
    ])

    if (qrResponse.error || incidentsResponse.error) {
      return NextResponse.json(
        { error: qrResponse.error?.message || incidentsResponse.error?.message || "Export failed" },
        { status: 500 }
      )
    }

    const qrRows = qrResponse.data || []
    const incidentRows = incidentsResponse.data || []

    const summaryRows: Array<Array<string | number | null>> = [
      ["Reporte", "Confirmaciones de entrega QR"],
      ["Generado en", new Date().toISOString()],
      ["Rango desde", fromIso],
      ["Rango hasta", toIso],
      [""],
      ["Indicador", "Valor"],
      ["Entregas pendientes", qrRows.filter((row) => row.status === "pendiente").length],
      ["Entregas confirmadas", qrRows.filter((row) => row.status === "confirmado").length],
      [
        "Entregas con incidencia",
        qrRows.filter((row) => row.status === "confirmado_con_incidente").length,
      ],
      ["Entregas rechazadas", qrRows.filter((row) => row.status === "rechazado").length],
      ["Entregas expiradas", qrRows.filter((row) => row.status === "expirado").length],
      ["Reclamaciones generadas", incidentRows.length],
      [""],
      ["DETALLE ENTREGAS"],
      [
        "qr_id",
        "qr_code_ref",
        "order_id",
        "warehouse_id",
        "delivery_batch_id",
        "transporter_id",
        "status",
        "issued_at",
        "expires_at",
        "confirmed_at",
      ],
      ...qrRows.map((row) => [
        row.id,
        row.qr_code_ref,
        row.order_id,
        row.warehouse_id,
        row.delivery_batch_id,
        row.transporter_id,
        row.status,
        row.issued_at,
        row.expires_at,
        row.confirmed_at,
      ]),
      [""],
      ["DETALLE RECLAMACIONES"],
      [
        "incident_id",
        "qr_id",
        "order_id",
        "invoice_number",
        "product_reference",
        "defective_quantity",
        "warehouse_id",
        "transporter_id",
        "status",
        "reported_at",
        "pqrs_ticket_id",
      ],
      ...incidentRows.map((row) => [
        row.id,
        row.qr_id,
        row.order_id,
        row.invoice_number,
        row.product_reference,
        row.defective_quantity,
        row.warehouse_id,
        row.transporter_id,
        row.status,
        row.reported_at,
        row.pqrs_ticket_id,
      ]),
    ]

    const csv = buildCsv(summaryRows)
    const filename = `delivery-dashboard-${new Date().toISOString().slice(0, 10)}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
