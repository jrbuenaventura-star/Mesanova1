import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { ClientDetailView } from "@/components/admin/client-detail-view"
import { buildDistributorDocumentReminder, type DistributorDocumentRecord } from "@/lib/distributor-documents"

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "superadmin") {
    redirect("/")
  }

  const admin = createAdminClient()

  // Get distributor
  const { data: distributor, error: distError } = await admin
    .from("distributors")
    .select("*")
    .eq("id", id)
    .single()

  if (distError || !distributor) {
    redirect("/admin/distributors")
  }

  // Get user profile
  const { data: userProfile } = await admin
    .from("user_profiles")
    .select("*")
    .eq("id", distributor.user_id)
    .single()

  // Get aliado info
  let aliado = null
  if (distributor.aliado_id) {
    const { data } = await admin
      .from("aliados")
      .select("id, company_name")
      .eq("id", distributor.aliado_id)
      .single()
    aliado = data
  }

  // Get orders for this client
  const { data: orders } = await admin
    .from("orders")
    .select("*")
    .or(`distributor_id.eq.${distributor.id},user_id.eq.${distributor.user_id}`)
    .order("created_at", { ascending: false })

  // Get shipping addresses
  const { data: addresses } = await admin
    .from("shipping_addresses")
    .select("*")
    .eq("user_id", distributor.user_id)
    .order("is_default", { ascending: false })

  // Get distributor documents (if table exists)
  let documents: DistributorDocumentRecord[] = []
  const { data: documentsData, error: documentsError } = await admin
    .from("distributor_documents")
    .select("id, distributor_id, document_type, status, file_name, file_url, uploaded_at, expires_at, review_notes")
    .eq("distributor_id", distributor.id)
    .order("uploaded_at", { ascending: false })

  if (documentsError && documentsError.code !== "42P01") {
    console.error("Error loading distributor documents:", documentsError)
  } else {
    documents = (documentsData || []) as DistributorDocumentRecord[]
  }

  const documentReminder = buildDistributorDocumentReminder(documents)

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <ClientDetailView
        distributor={distributor}
        userProfile={userProfile}
        aliado={aliado}
        orders={orders || []}
        addresses={addresses || []}
        documents={documents}
        documentReminder={documentReminder}
      />
    </div>
  )
}
