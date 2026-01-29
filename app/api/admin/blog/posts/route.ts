import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type CreatePostBody = {
  title: string
  slug: string
  excerpt?: string
  content: string
  status: string
  featured_image_url?: string | null
  category_id?: string | null
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

export async function POST(request: Request) {
  const auth = await requireSuperadmin()
  if (auth.error) return auth.error

  try {
    const body = (await request.json()) as CreatePostBody

    if (!body.title || !body.slug || !body.content || !body.status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: post, error } = await admin
      .from("blog_posts")
      .insert({
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt || null,
        content: body.content,
        status: body.status,
        featured_image_url: body.featured_image_url || null,
        author_id: auth.user.id,
        published_at: body.status === "published" ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error || !post) {
      return NextResponse.json({ error: error?.message || "Failed to create post" }, { status: 400 })
    }

    if (body.category_id) {
      const { error: catError } = await admin.from("blog_post_categories").insert({
        post_id: post.id,
        category_id: body.category_id,
      })

      if (catError) {
        return NextResponse.json({ error: catError.message }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true, post })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
