import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type RouteContext = {
  params: Promise<{ id: string }>
}

const MODERATION_ACTIONS: Record<string, string> = {
  approve: "approved",
  reject: "rejected",
  hidden: "hidden",
  pending: "pending",
}

async function getSuperadminUserId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { supabase, userId: null as string | null }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "superadmin") return { supabase, userId: null as string | null }

  return { supabase, userId: user.id }
}

function redirectToReviews(request: Request) {
  return NextResponse.redirect(new URL("/admin/reviews", request.url))
}

export async function POST(request: Request, context: RouteContext) {
  const { supabase, userId } = await getSuperadminUserId()
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: "ID de review requerido" }, { status: 400 })
  }

  const formData = await request.formData()
  const action = String(formData.get("action") || "").trim().toLowerCase()
  const nextStatus = MODERATION_ACTIONS[action]

  if (!nextStatus) {
    return NextResponse.json({ error: "Acción de moderación inválida" }, { status: 400 })
  }

  const { error } = await supabase
    .from("product_reviews")
    .update({
      status: nextStatus,
      moderated_by: userId,
      moderated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const accept = request.headers.get("accept") || ""
  if (accept.includes("application/json")) {
    return NextResponse.json({ success: true, status: nextStatus })
  }

  return redirectToReviews(request)
}
