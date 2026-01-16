import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Nosotros - Mesanova",
  description: "Conoce más sobre Mesanova, tu tienda especializada en artículos para cocina y hogar",
}

export default function NosotrosPage() {
  redirect("/nosotros/sobre-mesanova")
}
