import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function LegacyProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from("products")
    .select(
      `
      id,
      slug,
      categories:product_categories(
        is_primary,
        subcategory:subcategories(
          silo:silos(slug)
        )
      )
    `,
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (!product) {
    notFound()
  }

  const primaryCategory = product.categories?.find((c: any) => c.is_primary)
  const siloRelation = (primaryCategory as any)?.subcategory?.silo
  const siloSlug = Array.isArray(siloRelation) ? siloRelation[0]?.slug : siloRelation?.slug

  if (!siloSlug) {
    notFound()
  }

  redirect(`/productos/${siloSlug}/${slug}`)
}
