import { NextResponse } from "next/server"

import { requireApiUser } from "@/lib/security/auth"
import { createAdminClient } from "@/lib/supabase/admin"

type GiftCardProductPayload = {
  name?: unknown
  slug?: unknown
  description?: unknown
  amount?: unknown
  image_url?: unknown
  allow_custom_amount?: unknown
  min_custom_amount?: unknown
  max_custom_amount?: unknown
  is_active?: unknown
  sort_order?: unknown
}

function normalizeSlug(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

function parseBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    return normalized === "true" || normalized === "1"
  }
  return fallback
}

function parseOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parseInput(body: GiftCardProductPayload) {
  const name = String(body.name || "").trim()
  const description = String(body.description || "").trim() || null
  const rawSlug = String(body.slug || "").trim()
  const slug = normalizeSlug(rawSlug || name)
  const amount = Number(body.amount)
  const sortOrder = Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0
  const imageUrl = String(body.image_url || "").trim() || null
  const allowCustomAmount = parseBoolean(body.allow_custom_amount, false)
  const minCustomAmount = parseOptionalNumber(body.min_custom_amount) ?? 10000
  const maxCustomAmount = parseOptionalNumber(body.max_custom_amount)
  const isActive = parseBoolean(body.is_active, true)

  if (!name) {
    throw new Error("El nombre es obligatorio")
  }
  if (!slug) {
    throw new Error("No fue posible generar un slug válido")
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("El monto debe ser mayor a 0")
  }
  if (!Number.isFinite(minCustomAmount) || minCustomAmount <= 0) {
    throw new Error("El monto mínimo personalizado debe ser mayor a 0")
  }
  if (maxCustomAmount !== null && (!Number.isFinite(maxCustomAmount) || maxCustomAmount < minCustomAmount)) {
    throw new Error("El monto máximo personalizado debe ser mayor o igual al mínimo")
  }

  return {
    name,
    slug,
    description,
    amount,
    image_url: imageUrl,
    allow_custom_amount: allowCustomAmount,
    min_custom_amount: minCustomAmount,
    max_custom_amount: maxCustomAmount,
    is_active: isActive,
    sort_order: Math.trunc(sortOrder),
  }
}

export async function GET() {
  const auth = await requireApiUser({ roles: ["superadmin"] })
  if (!auth.ok) return auth.response

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("gift_card_products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, records: data || [] })
}

export async function POST(request: Request) {
  const auth = await requireApiUser({ roles: ["superadmin"] })
  if (!auth.ok) return auth.response

  try {
    const body = (await request.json()) as GiftCardProductPayload
    const payload = parseInput(body)

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("gift_card_products")
      .insert(payload)
      .select("*")
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Ya existe un bono con ese slug" }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, record: data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo crear el bono" },
      { status: 400 }
    )
  }
}
