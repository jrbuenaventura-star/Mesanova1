import { createClient } from "@/lib/supabase/server"
import { isQualifiedDistributor } from "@/lib/pricing"

export type DistributorPricingContext = {
  discount_percentage: number
} | null

/**
 * Returns distributor pricing context for the currently authenticated user.
 * A user qualifies only when distributor is active, has aliado assigned and business_type is "Tienda".
 */
export async function getCurrentDistributorPricingContext(): Promise<DistributorPricingContext> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: distRecord } = await supabase
    .from("distributors")
    .select("aliado_id, business_type, commercial_name, is_active, discount_percentage")
    .eq("user_id", user.id)
    .single()

  if (!isQualifiedDistributor(distRecord)) {
    return null
  }

  return { discount_percentage: distRecord?.discount_percentage || 0 }
}
