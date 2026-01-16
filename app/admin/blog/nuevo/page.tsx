"use client"

import type React from "react"

import { useState, useRef } from "react"
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

export default function NuevoPostPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [featuredImageUrl, setFeaturedImageUrl] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useState(() => {
    const loadCategories = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("blog_categories").select("*").order("name")
      if (data) setCategories(data)
    }
    loadCategories()
  })

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
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para crear posts",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    const title = formData.get("title") as string
    const slug = formData.get("slug") as string
    const excerpt = formData.get("excerpt") as string
    const status = formData.get("status") as string
    const categoryId = formData.get("category") as string

    const { data: post, error } = await supabase
      .from("blog_posts")
      .insert({
        title,
        slug,
        excerpt,
        content,
        status,
        featured_image_url: featuredImageUrl || null,
        author_id: user.id,
        published_at: status === "published" ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el post: " + error.message,
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    if (categoryId && post) {
      await supabase.from("blog_post_categories").insert({
        post_id: post.id,
        category_id: categoryId,
      })
    }

    toast({
      title: "Éxito",
      description: "Post creado correctamente",
    })

    router.push("/admin/blog")
    router.refresh()
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
          <h1 className="text-3xl font-bold">Nuevo Post</h1>
          <p className="text-muted-foreground mt-1">Crea un nuevo artículo para el blog</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información del Post</CardTitle>
            <CardDescription>Completa los detalles del nuevo artículo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input id="title" name="title" required placeholder="Título del artículo" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL) *</Label>
                <Input id="slug" name="slug" required placeholder="titulo-del-articulo" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Extracto</Label>
              <Textarea
                id="excerpt"
                name="excerpt"
                placeholder="Breve descripción del artículo..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Contenido *</Label>
              <RichTextEditor content={content} onChange={setContent} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select name="status" defaultValue="draft">
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
                <Select name="category">
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
              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear Post"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
