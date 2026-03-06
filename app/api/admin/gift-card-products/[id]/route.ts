import { NextResponse } from "next/server"

import { requireApiUser } from "@/lib/security/auth"
import { createAdminClient } from "@/lib/supabase/admin"

type GiftCardProductPatchPayload = {
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

function parseBoolean(value: unknown, fallback: boolean) {
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

function parsePatchInput(body: GiftCardProductPatchPayload) {
  const patch: Record<string, unknown> = {}

  if (body.name !== undefined) {
    const value = String(body.name || "").trim()
    if (!value) throw new Error("El nombre no puede estar vacío")
    patch.name = value
  }

  if (body.slug !== undefined) {
    const value = normalizeSlug(String(body.slug || "").trim())
    if (!value) throw new Error("El slug no puede estar vacío")
    patch.slug = value
  }

  if (body.description !== undefined) {
    patch.description = String(body.description || "").trim() || null
  }

  if (body.amount !== undefined) {
    const amount = Number(body.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("El monto debe ser mayor a 0")
    }
    patch.amount = amount
  }

  if (body.image_url !== undefined) {
    patch.image_url = String(body.image_url || "").trim() || null
  }

  if (body.allow_custom_amount !== undefined) {
    patch.allow_custom_amount = parseBoolean(body.allow_custom_amount, false)
  }

  if (body.min_custom_amount !== undefined) {
    const minAmount = parseOptionalNumber(body.min_custom_amount)
    if (minAmount === null || minAmount <= 0) {
      throw new Error("El monto mínimo personalizado debe ser mayor a 0")
    }
    patch.min_custom_amount = minAmount
  }

  if (body.max_custom_amount !== undefined) {
    const maxAmount = parseOptionalNumber(body.max_custom_amount)
    if (maxAmount !== null && maxAmount <= 0) {
      throw new Error("El monto máximo personalizado debe ser mayor a 0")
    }
    patch.max_custom_amount = maxAmount
  }

  if (body.is_active !== undefined) {
    patch.is_active = parseBoolean(body.is_active, true)
  }

  if (body.sort_order !== undefined) {
    const sortOrder = Number(body.sort_order)
    if (!Number.isFinite(sortOrder)) {
      throw new Error("El orden debe ser un número")
    }
    patch.sort_order = Math.trunc(sortOrder)
  }

  return patch
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser({ roles: ["superadmin"] })
  if (!auth.ok) return auth.response

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  try {
    const body = (await request.json()) as GiftCardProductPatchPayload
    const patch = parsePatchInput(body)

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No hay cambios para actualizar" }, { status: 400 })
    }

    const maxCustomAmount = patch.max_custom_amount
    const minCustomAmount = patch.min_custom_amount
    if (
      maxCustomAmount !== undefined &&
      minCustomAmount !== undefined &&
      maxCustomAmount !== null &&
      Number(maxCustomAmount) < Number(minCustomAmount)
    ) {
      return NextResponse.json(
        { error: "El monto máximo personalizado debe ser mayor o igual al mínimo" },
        { status: 400 }
      )
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("gift_card_products")
      .update(patch)
      .eq("id", id)
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
      { error: error instanceof Error ? error.message : "No se pudo actualizar el bono" },
      { status: 400 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser({ roles: ["superadmin"] })
  if (!auth.ok) return auth.response

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from("gift_card_products").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
