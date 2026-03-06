import { randomUUID } from "crypto"
import { NextResponse } from "next/server"

import { DISTRIBUTOR_DOCUMENT_DEFINITIONS } from "@/lib/distributor-documents"
import { enforceRateLimit, enforceSameOrigin } from "@/lib/security/api"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const STORAGE_BUCKET = "distributor-documents-private"
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
const VALID_DOCUMENT_TYPES = new Set(DISTRIBUTOR_DOCUMENT_DEFINITIONS.map((item) => item.type))

function getFileExtension(fileName: string) {
  const ext = fileName.split(".").pop() || "bin"
  return ext.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin"
}

async function ensureStorageBucket(admin: ReturnType<typeof createAdminClient>) {
  const { data: bucket, error } = await admin.storage.getBucket(STORAGE_BUCKET)
  if (bucket) return

  if (error && !error.message.toLowerCase().includes("not found")) {
    throw new Error(error.message)
  }

  const { error: createError } = await admin.storage.createBucket(STORAGE_BUCKET, {
    public: false,
    fileSizeLimit: `${MAX_FILE_SIZE_BYTES}`,
    allowedMimeTypes: ALLOWED_MIME_TYPES,
  })

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw new Error(createError.message)
  }
}

export async function POST(request: Request) {
  try {
    const sameOriginResponse = enforceSameOrigin(request)
    if (sameOriginResponse) return sameOriginResponse

    const rateLimitResponse = await enforceRateLimit(request, {
      bucket: "distributor-documents-upload",
      limit: 20,
      windowMs: 60_000,
    })
    if (rateLimitResponse) return rateLimitResponse

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    const isSuperadmin = profile?.role === "superadmin"

    const formData = await request.formData()
    const file = formData.get("file")
    const rawDocumentType = String(formData.get("document_type") || "").trim()
    const requestedDistributorId = String(formData.get("distributor_id") || "").trim() || null

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 })
    }

    if (!VALID_DOCUMENT_TYPES.has(rawDocumentType as any)) {
      return NextResponse.json({ error: "Tipo de documento inválido" }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 })
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "Tamaño de archivo inválido (máximo 10MB)" }, { status: 400 })
    }

    let distributorId: string | null = null
    if (isSuperadmin && requestedDistributorId) {
      distributorId = requestedDistributorId
    } else {
      const { data: ownDistributor } = await supabase
        .from("distributors")
        .select("id")
        .eq("user_id", user.id)
        .single()
      distributorId = ownDistributor?.id || null
    }

    if (!distributorId) {
      return NextResponse.json({ error: "No se encontró distribuidor asociado" }, { status: 404 })
    }

    const now = new Date()
    const fiscalYear = rawDocumentType === "estados_financieros" ? now.getFullYear() : null
    const expiresAt =
      rawDocumentType === "estados_financieros"
        ? new Date(now.getFullYear() + 1, 3, 30).toISOString()
        : null

    const admin = createAdminClient()
    await ensureStorageBucket(admin)

    const filePath = `${distributorId}/${rawDocumentType}/${Date.now()}-${randomUUID()}.${getFileExtension(file.name)}`
    const { error: uploadError } = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    let existingQuery = admin
      .from("distributor_documents")
      .select("id, storage_bucket, storage_path")
      .eq("distributor_id", distributorId)
      .eq("document_type", rawDocumentType)

    existingQuery =
      fiscalYear === null ? existingQuery.is("fiscal_year", null) : existingQuery.eq("fiscal_year", fiscalYear)

    const { data: existingRows } = await existingQuery.order("uploaded_at", { ascending: false }).limit(1)
    const existingDocument = existingRows?.[0] || null

    const basePayload = {
      distributor_id: distributorId,
      document_type: rawDocumentType,
      file_name: file.name,
      file_url: null,
      storage_bucket: STORAGE_BUCKET,
      storage_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      fiscal_year: fiscalYear,
      expires_at: expiresAt,
      status: "pending",
      review_notes: null,
      updated_at: new Date().toISOString(),
    }

    const dbResponse = existingDocument?.id
      ? await admin
          .from("distributor_documents")
          .update(basePayload)
          .eq("id", existingDocument.id)
          .select("*")
          .single()
      : await admin
          .from("distributor_documents")
          .insert({
            ...basePayload,
            uploaded_at: new Date().toISOString(),
          })
          .select("*")
          .single()

    if (dbResponse.error || !dbResponse.data) {
      await admin.storage.from(STORAGE_BUCKET).remove([filePath])
      return NextResponse.json({ error: dbResponse.error?.message || "No se pudo guardar el documento" }, { status: 500 })
    }

    if (
      existingDocument &&
      existingDocument.storage_bucket &&
      existingDocument.storage_path &&
      (existingDocument.storage_bucket !== STORAGE_BUCKET || existingDocument.storage_path !== filePath)
    ) {
      await admin.storage.from(existingDocument.storage_bucket).remove([existingDocument.storage_path])
    }

    return NextResponse.json({ success: true, document: dbResponse.data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
