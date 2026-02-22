import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const BUCKET_NAME = "home-banners"
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"]

async function requireSuperadmin() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) }
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || profile?.role !== "superadmin") {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) }
  }

  return { user }
}

async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const { data: bucket, error } = await admin.storage.getBucket(BUCKET_NAME)

  if (bucket) return

  if (error && !error.message.toLowerCase().includes("not found")) {
    throw new Error(error.message)
  }

  const { error: createError } = await admin.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: "10MB",
    allowedMimeTypes: ALLOWED_MIME_TYPES,
  })

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw new Error(createError.message)
  }
}

export async function POST(request: Request) {
  const auth = await requireSuperadmin()
  if (auth.error) return auth.error

  try {
    const formData = await request.formData()
    const fileEntry = formData.get("file")

    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 })
    }

    const file = fileEntry

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato inválido. Usa PNG, JPG, WEBP o AVIF" },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "La imagen no puede superar 10MB" }, { status: 400 })
    }

    const admin = createAdminClient()
    await ensureBucket(admin)

    const fileExt = (file.name.split(".").pop() || "jpg").toLowerCase()
    const filePath = `${auth.user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`

    const { error: uploadError } = await admin.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
        cacheControl: "3600",
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: publicUrlData } = admin.storage.from(BUCKET_NAME).getPublicUrl(filePath)

    return NextResponse.json({
      imageUrl: publicUrlData.publicUrl,
      path: filePath,
      bucket: BUCKET_NAME,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
