import { redirect } from "next/navigation"

import { GiftCardProductsManagement } from "@/components/admin/gift-card-products-management"
import { createClient } from "@/lib/supabase/server"

export default async function GiftCardProductsAdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "superadmin") {
    redirect("/")
  }

  return (
    <div className="flex-1 space-y-4 p-8">
      <GiftCardProductsManagement />
    </div>
  )
}
