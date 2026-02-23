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
import { ArrowLeft, Upload, X, Search } from "lucide-react"
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

      if (!response.ok) throw new Error("No se pudo subir la imagen")

      const data = await response.json()
      setFeaturedImageUrl(data.url)
      toast({ title: "Éxito", description: "Imagen destacada cargada y optimizada" })
    } catch (error) {
      toast({ title: "Error", description: "No se pudo subir la imagen", variant: "destructive" })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)

    const formData = new FormData(e.currentTarget)

    const title = formData.get("title") as string
    const slug = formData.get("slug") as string
    const excerpt = formData.get("excerpt") as string
    const status = formData.get("status") as string
    const categoryId = formData.get("category") as string
    const metaTitle = formData.get("meta_title") as string
    const metaDescription = formData.get("meta_description") as string
    const focusKeyword = formData.get("focus_keyword") as string
    const canonicalUrl = formData.get("canonical_url") as string

    try {
      const response = await fetch(`/api/admin/blog/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          content,
          status,
          featured_image_url: featuredImageUrl || null,
          category_id: categoryId || null,
          published_at: post?.published_at || null,
          meta_title: metaTitle || null,
          meta_description: metaDescription || null,
          focus_keyword: focusKeyword || null,
          canonical_url: canonicalUrl || null,
        }),
      })

      const json = await response.json()
      if (!response.ok) throw new Error(json?.error || "No se pudo actualizar la publicación")
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar la publicación"
      toast({ title: "Error", description: message, variant: "destructive" })
      setSaving(false)
      return
    }

    toast({ title: "Éxito", description: "Publicación actualizada exitosamente" })
    router.push("/admin/blog")
    router.refresh()
  }

  if (loading) {
    return <div className="p-8"><p>Cargando...</p></div>
  }

  if (!post) {
    return <div className="p-8"><p>Publicación no encontrada</p></div>
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild aria-label="Abrir enlace">
          <Link href="/admin/blog">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar publicación</h1>
          <p className="text-muted-foreground mt-1">Actualiza el artículo de A Mesa Puesta</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Detalles de la publicación</CardTitle>
            <CardDescription>Actualiza los datos del artículo</CardDescription>
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
              <Textarea id="excerpt" name="excerpt" defaultValue={post.excerpt || ""} className="min-h-[100px]" placeholder="Descripción breve para resultados de búsqueda y tarjetas..." />
              <p className="text-xs text-muted-foreground">Se usa como meta descripción por defecto si no defines una personalizada.</p>
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
                <Label>Imagen destacada</Label>
                {featuredImageUrl ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                    <img src={featuredImageUrl} alt="Imagen destacada" className="w-full h-full object-cover" />
                    <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => setFeaturedImageUrl("")} aria-label="Cerrar">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Input ref={fileInputRef} type="file" accept="image/*" onChange={handleFeaturedImageUpload} disabled={uploadingImage} className="hidden" />
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} aria-label="Subir">
                      <Upload className="mr-2 h-4 w-4" />
                      {uploadingImage ? "Subiendo..." : "Subir imagen"}
                    </Button>
                    <p className="text-sm text-muted-foreground">Redimensionado automáticamente a 1200px, WebP</p>
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
              Configuración SEO
            </CardTitle>
            <CardDescription>Optimiza esta publicación para buscadores. Deja en blanco para usar los valores por defecto.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="meta_title">Meta título</Label>
                <Input id="meta_title" name="meta_title" defaultValue={post.meta_title || ""} placeholder="Título personalizado para resultados de búsqueda" maxLength={70} />
                <p className="text-xs text-muted-foreground">Recomendado: 50-60 caracteres. Por defecto usa el título de la publicación.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="focus_keyword">Palabra clave objetivo</Label>
                <Input id="focus_keyword" name="focus_keyword" defaultValue={post.focus_keyword || ""} placeholder="ej. tendencias de vajilla 2026" />
                <p className="text-xs text-muted-foreground">La palabra clave principal por la que este artículo debería posicionar.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta_description">Meta descripción</Label>
              <Textarea id="meta_description" name="meta_description" defaultValue={post.meta_description || ""} placeholder="Descripción personalizada para resultados de búsqueda..." maxLength={160} className="min-h-[80px]" />
              <p className="text-xs text-muted-foreground">Recomendado: 120-160 caracteres. Por defecto usa el extracto.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="canonical_url">URL canónica</Label>
              <Input id="canonical_url" name="canonical_url" defaultValue={post.canonical_url || ""} placeholder="https://mesanova.co/blog/original-post" />
              <p className="text-xs text-muted-foreground">Solo configúrala si este contenido fue republicado desde otra URL.</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/blog">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={saving} aria-label="Enviar">
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </div>
  )
}
