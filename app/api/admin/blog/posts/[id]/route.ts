import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type UpdatePostBody = {
  title: string
  slug: string
  excerpt?: string
  content: string
  status: string
  featured_image_url?: string | null
  category_id?: string | null
  published_at?: string | null
  meta_title?: string | null
  meta_description?: string | null
  focus_keyword?: string | null
  canonical_url?: string | null
}

async function requireSuperadmin() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || profile?.role !== "superadmin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { user }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperadmin()
  if (auth.error) return auth.error

  const { id } = await params

  try {
    const body = (await request.json()) as UpdatePostBody

    if (!body.title || !body.slug || !body.content || !body.status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const admin = createAdminClient()

    const nextPublishedAt =
      body.status === "published" ? body.published_at || new Date().toISOString() : null

    const { error } = await admin
      .from("blog_posts")
      .update({
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt || null,
        content: body.content,
        status: body.status,
        featured_image_url: body.featured_image_url || null,
        published_at: nextPublishedAt,
        meta_title: body.meta_title || null,
        meta_description: body.meta_description || null,
        focus_keyword: body.focus_keyword || null,
        canonical_url: body.canonical_url || null,
      })
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (body.category_id !== undefined) {
      await admin.from("blog_post_categories").delete().eq("post_id", id)

      if (body.category_id) {
        const { error: catError } = await admin.from("blog_post_categories").insert({
          post_id: id,
          category_id: body.category_id,
        })

        if (catError) {
          return NextResponse.json({ error: catError.message }, { status: 400 })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
