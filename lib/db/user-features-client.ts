import { createClient } from "@/lib/supabase/client"

export async function voteReview(userId: string, reviewId: string, isHelpful: boolean) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("review_votes")
    .upsert({ user_id: userId, review_id: reviewId, is_helpful: isHelpful }, { onConflict: "review_id,user_id" })
    .select()
    .single()

  if (error) throw error
  return data
}
