import { getBlogPostsByCategory, getBlogCategories } from "@/lib/db/queries"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { CalendarDays, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { notFound } from "next/navigation"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const categories = await getBlogCategories()
  const category = categories.find((c) => c.slug === slug)

  if (!category) {
    return {
      title: "Categoría no encontrada",
    }
  }

  return {
    title: `${category.name} - A Mesa Puesta`,
    description: category.description || `Artículos de ${category.name}`,
  }
}

export default async function BlogCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const posts = await getBlogPostsByCategory(slug)
  const categories = await getBlogCategories()
  const currentCategory = categories.find((c) => c.slug === slug)

  if (!currentCategory) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-12 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              A Mesa Puesta
            </Link>
          </Button>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{currentCategory.name}</h1>
          {currentCategory.description && (
            <p className="text-lg text-muted-foreground max-w-2xl">{currentCategory.description}</p>
          )}
        </div>
      </section>

      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} aria-label="Leer artículo">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                {post.featured_image_url && (
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                    <img
                      src={post.featured_image_url || "/placeholder.svg"}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <CalendarDays className="h-4 w-4" />
                    <time dateTime={post.published_at}>
                      {new Date(post.published_at!).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-sm text-primary font-medium">Leer más →</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No hay artículos en esta categoría todavía.</p>
          </div>
        )}
      </div>
    </div>
  )
}
