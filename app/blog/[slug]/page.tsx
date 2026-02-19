import { getBlogPostBySlug, getRelatedBlogPosts } from "@/lib/db/queries"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { CalendarDays, Eye, ArrowLeft, User, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Metadata } from "next"

function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, "")
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    return { title: "Post not found" }
  }

  const seoTitle = post.meta_title || `${post.title} - Mesanova Blog`
  const seoDescription = post.meta_description || post.excerpt || `Read ${post.title} on the Mesanova blog`
  const postUrl = `https://mesanova.co/blog/${post.slug}`

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: post.focus_keyword ? [post.focus_keyword] : undefined,
    alternates: {
      canonical: post.canonical_url || postUrl,
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: postUrl,
      siteName: "Mesanova",
      type: "article",
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at || undefined,
      authors: post.author?.full_name ? [post.author.full_name] : undefined,
      images: post.featured_image_url
        ? [
            {
              url: post.featured_image_url,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
      images: post.featured_image_url ? [post.featured_image_url] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = await getRelatedBlogPosts(post.id, 3)
  const readingTime = estimateReadingTime(post.content || "")

  // JSON-LD structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.meta_description || post.excerpt || "",
    image: post.featured_image_url || undefined,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at || post.created_at,
    author: post.author
      ? {
          "@type": "Person",
          name: post.author.full_name,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: "Mesanova",
      url: "https://mesanova.co",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://mesanova.co/blog/${post.slug}`,
    },
    wordCount: (post.content || "").replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length,
  }

  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container mx-auto py-8 px-6 md:px-8 max-w-4xl">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Ver blog
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
                {new Date(post.published_at!).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{readingTime} min read</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{post.views_count || 0} views</span>
            </div>
          </div>

          {/* Categories */}
          {post.blog_post_categories && post.blog_post_categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.blog_post_categories.map((pc: any) => (
                <Link key={pc.category.id} href={`/blog/categoria/${pc.category.slug}`}>
                  <Badge variant="secondary" className="hover:bg-primary/10 cursor-pointer">
                    {pc.category.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </header>

        {/* Post Content */}
        <article className="prose prose-lg dark:prose-invert max-w-none mb-12 prose-img:rounded-lg prose-img:max-w-full prose-a:text-primary">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>

        {/* Related Posts */}
        {relatedPosts && relatedPosts.length > 0 && (
          <section className="mt-16 pt-8 border-t">
            <h2 className="text-2xl font-bold mb-6">Related articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`} aria-label="Leer artículo">
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
