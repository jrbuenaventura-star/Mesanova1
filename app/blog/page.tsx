import { getBlogPosts, getBlogCategories } from "@/lib/db/queries"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { CalendarDays } from "lucide-react"

export const metadata = {
  title: "Nuestra Mesa - Blog de Mesanova",
  description: "Artículos, tendencias y consejos sobre decoración de mesa y hogar",
}

export default async function BlogPage() {
  const posts = await getBlogPosts(20)
  const categories = await getBlogCategories()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-12 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Nuestra Mesa</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Historias, tendencias y consejos sobre decoración de mesa, productos para el hogar y el arte de recibir
          </p>
        </div>
      </section>

      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                    {post.featured_image_url && (
                      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                        <Image
                          src={post.featured_image_url}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4">
              <Card>
                <CardHeader>
                  <CardTitle>Categorías</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/blog/categoria/${category.slug}`}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors"
                      >
                        <span className="text-sm">{category.name}</span>
                        <Badge variant="secondary">{category.blog_post_categories?.[0]?.count || 0}</Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
