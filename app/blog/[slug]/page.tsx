import { getBlogPostBySlug, getRelatedBlogPosts } from "@/lib/db/queries"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { CalendarDays, Eye, ArrowLeft, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    return {
      title: "Post no encontrado",
    }
  }

  return {
    title: post.title,
    description: post.excerpt,
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = await getRelatedBlogPosts(post.id, 3)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-6 md:px-8 max-w-4xl">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al blog
          </Link>
        </Button>

        {/* Featured Image */}
        {post.featured_image_url && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-8">
            <Image
              src={post.featured_image_url}
              alt={post.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
          </div>
        )}

        {/* Post Header */}
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">{post.title}</h1>

          {/* Author */}
          {post.author && (
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.author.avatar_url || undefined} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{post.author.full_name}</p>
              </div>
            </div>
          )}

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <time dateTime={post.published_at}>
                {new Date(post.published_at!).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{post.views_count || 0} vistas</span>
            </div>
          </div>

          {/* Categories */}
          {post.blog_post_categories && post.blog_post_categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.blog_post_categories.map((pc: any) => (
                <Badge key={pc.category.id} variant="secondary">
                  {pc.category.name}
                </Badge>
              ))}
            </div>
          )}
        </header>

        {/* Post Content */}
        <article className="prose prose-lg dark:prose-invert max-w-none mb-12">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>

        {/* Related Posts */}
        {relatedPosts && relatedPosts.length > 0 && (
          <section className="mt-16 pt-8 border-t">
            <h2 className="text-2xl font-bold mb-6">Artículos relacionados</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                    {relatedPost.featured_image_url && (
                      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                        <Image
                          src={relatedPost.featured_image_url}
                          alt={relatedPost.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2">
                        {relatedPost.title}
                      </CardTitle>
                      {relatedPost.excerpt && (
                        <CardDescription className="text-sm line-clamp-2">{relatedPost.excerpt}</CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
