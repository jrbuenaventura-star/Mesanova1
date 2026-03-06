import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

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
    const admin = createAdminClient()

    const { data: document, error: docError } = await admin
      .from("distributor_documents")
      .select("id, distributor_id, file_name, file_url, storage_bucket, storage_path, distributor:distributors(user_id)")
      .eq("id", id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
    }

    const ownerUserId = (document as any)?.distributor?.user_id as string | undefined
    if (!isSuperadmin && ownerUserId !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    if (document.storage_bucket && document.storage_path) {
      const { data: signedUrlData, error: signedUrlError } = await admin.storage
        .from(document.storage_bucket)
        .createSignedUrl(document.storage_path, 300, {
          download: document.file_name || undefined,
        })

      if (signedUrlError || !signedUrlData?.signedUrl) {
        return NextResponse.json({ error: signedUrlError?.message || "No se pudo generar la descarga" }, { status: 500 })
      }

      return NextResponse.redirect(signedUrlData.signedUrl, { status: 302 })
    }

    if (document.file_url) {
      return NextResponse.redirect(document.file_url, { status: 302 })
    }

    return NextResponse.json({ error: "Documento sin archivo disponible" }, { status: 404 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
