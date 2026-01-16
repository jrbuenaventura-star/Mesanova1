"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, X } from "lucide-react"
import Link from "next/link"
import { RichTextEditor } from "@/components/admin/rich-text-editor"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { use } from "react"

export default function EditarPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [post, setPost] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [featuredImageUrl, setFeaturedImageUrl] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()

      const { data: postData } = await supabase
        .from("blog_posts")
        .select(
          `
          *,
          blog_post_categories(category_id)
        `,
        )
        .eq("id", id)
        .single()

      if (postData) {
        setPost(postData)
        setContent(postData.content || "")
        setFeaturedImageUrl(postData.featured_image_url || "")
      }

      const { data: categoriesData } = await supabase.from("blog_categories").select("*").order("name")
      if (categoriesData) setCategories(categoriesData)

      setLoading(false)
    }

    loadData()
  }, [id])

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

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      setFeaturedImageUrl(data.url)

      toast({
        title: "Éxito",
        description: "Imagen destacada subida correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const title = formData.get("title") as string
    const slug = formData.get("slug") as string
    const excerpt = formData.get("excerpt") as string
    const status = formData.get("status") as string
    const categoryId = formData.get("category") as string

    const { error } = await supabase
      .from("blog_posts")
      .update({
        title,
        slug,
        excerpt,
        content,
        status,
        featured_image_url: featuredImageUrl || null,
        published_at: status === "published" && !post.published_at ? new Date().toISOString() : post.published_at,
      })
      .eq("id", id)

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el post: " + error.message,
        variant: "destructive",
      })
      setSaving(false)
      return
    }

    if (categoryId) {
      await supabase.from("blog_post_categories").delete().eq("post_id", id)
      await supabase.from("blog_post_categories").insert({
        post_id: id,
        category_id: categoryId,
      })
    }

    toast({
      title: "Éxito",
      description: "Post actualizado correctamente",
    })

    router.push("/admin/blog")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="p-8">
        <p>Cargando...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="p-8">
        <p>Post no encontrado</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/blog">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Post</h1>
          <p className="text-muted-foreground mt-1">Modifica el artículo del blog</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información del Post</CardTitle>
            <CardDescription>Actualiza los detalles del artículo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input id="title" name="title" required defaultValue={post.title} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL) *</Label>
                <Input id="slug" name="slug" required defaultValue={post.slug} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Extracto</Label>
              <Textarea id="excerpt" name="excerpt" defaultValue={post.excerpt || ""} className="min-h-[100px]" />
            </div>

            <div className="space-y-2">
              <Label>Contenido *</Label>
              <RichTextEditor content={content} onChange={setContent} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select name="status" defaultValue={post.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                    <SelectItem value="archived">Archivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select name="category" defaultValue={post.blog_post_categories?.[0]?.category_id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
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
                <Label htmlFor="featured_image">Imagen Destacada</Label>
                {featuredImageUrl ? (
                  <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border">
                    <img
                      src={featuredImageUrl || "/placeholder.svg"}
                      alt="Imagen destacada"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setFeaturedImageUrl("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFeaturedImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploadingImage ? "Subiendo..." : "Subir Imagen"}
                    </Button>
                    <p className="text-sm text-muted-foreground">JPG, PNG o WebP (máx. 5MB)</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 justify-end pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/blog">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
