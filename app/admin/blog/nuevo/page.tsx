"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, X, Search } from "lucide-react"
import Link from "next/link"
import { RichTextEditor } from "@/components/admin/rich-text-editor"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export default function NuevoPostPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [featuredImageUrl, setFeaturedImageUrl] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadCategories = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("blog_categories").select("*").order("name")
      if (data) setCategories(data)
    }
    loadCategories()
  }, [])

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!slugManuallyEdited) {
      setSlug(slugify(value))
    }
  }

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/blog/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const data = await response.json()
      setFeaturedImageUrl(data.url)
      toast({ title: "Success", description: "Featured image uploaded and optimized" })
    } catch (error) {
      toast({ title: "Error", description: "Could not upload the image", variant: "destructive" })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    const excerpt = formData.get("excerpt") as string
    const status = formData.get("status") as string
    const categoryId = formData.get("category") as string
    const metaTitle = formData.get("meta_title") as string
    const metaDescription = formData.get("meta_description") as string
    const focusKeyword = formData.get("focus_keyword") as string
    const canonicalUrl = formData.get("canonical_url") as string

    try {
      const response = await fetch("/api/admin/blog/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          content,
          status,
          featured_image_url: featuredImageUrl || null,
          category_id: categoryId || null,
          meta_title: metaTitle || null,
          meta_description: metaDescription || null,
          focus_keyword: focusKeyword || null,
          canonical_url: canonicalUrl || null,
        }),
      })

      const json = await response.json()
      if (!response.ok) throw new Error(json?.error || "Failed to create post")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not create the post"
      toast({ title: "Error", description: message, variant: "destructive" })
      setLoading(false)
      return
    }

    toast({ title: "Success", description: "Post created successfully" })
    router.push("/admin/blog")
    router.refresh()
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/blog">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Post</h1>
          <p className="text-muted-foreground mt-1">Create a new blog article</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Content Card */}
        <Card>
          <CardHeader>
            <CardTitle>Post Details</CardTitle>
            <CardDescription>Fill in the article details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="Article title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL) *</Label>
                <Input
                  id="slug"
                  name="slug"
                  required
                  placeholder="article-title"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setSlugManuallyEdited(true) }}
                />
                <p className="text-xs text-muted-foreground">Auto-generated from title. Edit to customize.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                name="excerpt"
                placeholder="Brief description of the article (shown in search results and cards)..."
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">Used as default meta description if no custom one is set.</p>
            </div>

            <div className="space-y-2">
              <Label>Content *</Label>
              <RichTextEditor content={content} onChange={setContent} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue="draft">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category">
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Featured Image</Label>
                {featuredImageUrl ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                    <img src={featuredImageUrl} alt="Featured" className="w-full h-full object-cover" />
                    <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => setFeaturedImageUrl("")}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Input ref={fileInputRef} type="file" accept="image/*" onChange={handleFeaturedImageUpload} disabled={uploadingImage} className="hidden" />
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                      <Upload className="mr-2 h-4 w-4" />
                      {uploadingImage ? "Uploading..." : "Upload Image"}
                    </Button>
                    <p className="text-sm text-muted-foreground">Auto-resized to 1200px, WebP</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              SEO Settings
            </CardTitle>
            <CardDescription>Optimize this post for search engines. Leave blank to use defaults.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input id="meta_title" name="meta_title" placeholder="Custom title for search results" maxLength={70} />
                <p className="text-xs text-muted-foreground">Recommended: 50-60 characters. Defaults to post title.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="focus_keyword">Focus Keyword</Label>
                <Input id="focus_keyword" name="focus_keyword" placeholder="e.g. tableware trends 2026" />
                <p className="text-xs text-muted-foreground">The primary keyword this article should rank for.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea id="meta_description" name="meta_description" placeholder="Custom description for search results..." maxLength={160} className="min-h-[80px]" />
              <p className="text-xs text-muted-foreground">Recommended: 120-160 characters. Defaults to excerpt.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="canonical_url">Canonical URL</Label>
              <Input id="canonical_url" name="canonical_url" placeholder="https://mesanova.co/blog/original-post" />
              <p className="text-xs text-muted-foreground">Only set if this content is republished from another URL.</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/blog">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Post"}
          </Button>
        </div>
      </form>
    </div>
  )
}
