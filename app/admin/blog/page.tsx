"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Eye } from "lucide-react"
import Link from "next/link"
import { DeleteConfirmationDialog } from "@/components/admin/delete-confirmation-dialog"
import { toast } from "sonner"

export default function AdminBlogPage() {
  const router = useRouter()
  const supabase = createClient()
  const [posts, setPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; postId: string | null; postTitle: string }>({
    open: false,
    postId: null,
    postTitle: "",
  })

  useEffect(() => {
    checkAuth()
    loadPosts()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    const { data: userProfile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()
    if (userProfile?.role !== "superadmin") {
      router.push("/")
    }
  }

  async function loadPosts() {
    setIsLoading(true)
    const { data } = await supabase
      .from("blog_posts")
      .select(`
        *,
        author:user_profiles(full_name),
        blog_post_categories(
          category:blog_categories(name)
        )
      `)
      .order("created_at", { ascending: false })
    
    if (data) setPosts(data)
    setIsLoading(false)
  }

  async function handleDelete() {
    if (!deleteDialog.postId) return

    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", deleteDialog.postId)

    if (error) {
      toast.error("Error al eliminar", {
        description: "No se pudo eliminar la publicación. Intenta nuevamente."
      })
    } else {
      toast.success("Publicación eliminada", {
        description: "La publicación se eliminó correctamente"
      })
      loadPosts()
    }

    setDeleteDialog({ open: false, postId: null, postTitle: "" })
  }

  if (isLoading) {
    return <div className="container mx-auto py-10">Cargando...</div>
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de A Mesa Puesta</h1>
          <p className="text-muted-foreground">Administra las publicaciones de "A Mesa Puesta"</p>
        </div>
        <Button asChild>
          <Link href="/admin/blog/nuevo">
            <Plus className="h-4 w-4 mr-2" />
            Nueva publicación
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {posts?.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle>{post.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{post.excerpt}</CardDescription>
                </div>
                <Badge variant={post.status === "published" ? "default" : "secondary"}>
                  {post.status === "published" ? "Publicado" : post.status === "archived" ? "Archivado" : "Borrador"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Por {post.author?.full_name || "Autor desconocido"} •{" "}
                  {new Date(post.created_at).toLocaleDateString("es-CO")}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild aria-label="Abrir enlace">
                    <Link href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" aria-label="Leer artículo">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild aria-label="Abrir enlace">
                    <Link href={`/admin/blog/${post.id}/editar`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setDeleteDialog({ 
                      open: true, 
                      postId: post.id, 
                      postTitle: post.title 
                    })}
                   aria-label="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DeleteConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        onConfirm={handleDelete}
        title="¿Eliminar publicación?"
        description="Esta acción no se puede deshacer. La publicación se eliminará de forma permanente."
        itemName={deleteDialog.postTitle}
      />
    </div>
  )
}
