"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Bold,
  Italic,
  UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ImageIcon,
  VideoIcon,
  LinkIcon,
  Unlink,
  Quote,
  Minus,
  Undo,
  Redo,
} from "lucide-react"
import { useState, useRef, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [imageUrl, setImageUrl] = useState("")
  const [imageAlt, setImageAlt] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [videoDialogOpen, setVideoDialogOpen] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        // Disable built-in Link/Underline — we import them separately with custom config
        link: false,
        underline: false,
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg my-4",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
          rel: "noopener noreferrer",
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: "panel-typography max-w-none focus:outline-none min-h-[400px] p-6 bg-background",
      },
    },
  })

  // All hooks and callbacks MUST be before any early return
  const setLink = useCallback(() => {
    if (!editor) return
    if (linkUrl) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run()
    }
    setLinkUrl("")
    setLinkDialogOpen(false)
  }, [editor, linkUrl])

  const handleFileUpload = useCallback(async (file: File, type: "image" | "video") => {
    if (!editor) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/blog/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("No se pudo subir el archivo")
      }

      const data = await response.json()

      if (type === "image") {
        editor.chain().focus().setImage({ src: data.url, alt: imageAlt || file.name }).run()
        setImageDialogOpen(false)
        setImageAlt("")
      } else {
        editor
          .chain()
          .focus()
          .insertContent(
            `<video controls class="max-w-full h-auto rounded-lg my-4"><source src="${data.url}" type="${file.type}">Tu navegador no soporta el elemento de video.</video>`,
          )
          .run()
        setVideoDialogOpen(false)
      }

      toast({
        title: "Éxito",
        description: `${type === "image" ? "Imagen" : "Video"} cargado y optimizado`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo subir el archivo",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }, [editor, imageAlt, toast])

  const addImage = useCallback(() => {
    if (!editor) return
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl, alt: imageAlt || "" }).run()
      setImageUrl("")
      setImageAlt("")
      setImageDialogOpen(false)
    }
  }, [editor, imageUrl, imageAlt])

  const addVideo = useCallback(() => {
    if (!editor) return
    if (videoUrl) {
      editor
        .chain()
        .focus()
        .insertContent(
          `<video controls class="max-w-full h-auto rounded-lg my-4"><source src="${videoUrl}" type="video/mp4">Tu navegador no soporta el elemento de video.</video>`,
        )
        .run()
      setVideoUrl("")
      setVideoDialogOpen(false)
    }
  }, [editor, videoUrl])

  const openLinkDialog = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes("link").href || ""
    setLinkUrl(previousUrl)
    setLinkDialogOpen(true)
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="border-b bg-muted/30 p-2 flex flex-wrap gap-1 items-center">
        {/* Text Formatting */}
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive("bold") ? "bg-muted" : ""} title="Negrita" aria-label="Acción">
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive("italic") ? "bg-muted" : ""} title="Cursiva" aria-label="Acción">
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive("underline") ? "bg-muted" : ""} title="Subrayado" aria-label="Acción">
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Headings */}
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive("heading", { level: 1 }) ? "bg-muted" : ""} title="Encabezado 1" aria-label="Acción">
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""} title="Encabezado 2" aria-label="Acción">
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive("heading", { level: 3 }) ? "bg-muted" : ""} title="Encabezado 3" aria-label="Acción">
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Lists */}
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive("bulletList") ? "bg-muted" : ""} title="Lista con viñetas" aria-label="Acción">
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive("orderedList") ? "bg-muted" : ""} title="Lista numerada" aria-label="Acción">
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive("blockquote") ? "bg-muted" : ""} title="Cita" aria-label="Acción">
          <Quote className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Línea horizontal" aria-label="Insertar línea horizontal">
          <Minus className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Alignment */}
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign("left").run()} className={editor.isActive({ textAlign: "left" }) ? "bg-muted" : ""} title="Alinear a la izquierda" aria-label="Acción">
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign("center").run()} className={editor.isActive({ textAlign: "center" }) ? "bg-muted" : ""} title="Centrar" aria-label="Acción">
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign("right").run()} className={editor.isActive({ textAlign: "right" }) ? "bg-muted" : ""} title="Alinear a la derecha" aria-label="Acción">
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Link */}
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="sm" onClick={openLinkDialog} className={editor.isActive("link") ? "bg-muted" : ""} title="Insertar enlace" aria-label="Abrir enlace">
              <LinkIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Insertar enlace</DialogTitle>
              <DialogDescription>Agrega una URL al texto seleccionado</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="link-url">URL</Label>
                <Input
                  id="link-url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      setLink()
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancelar</Button>
              <Button type="button" onClick={setLink} disabled={!linkUrl}>Insertar enlace</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive("link")}
          title="Quitar enlace"
         aria-label="Quitar enlace">
          <Unlink className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Image */}
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="sm" title="Insertar imagen" aria-label="Imagen">
              <ImageIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Insertar imagen</DialogTitle>
              <DialogDescription>Sube una imagen o pega una URL. Las imágenes se redimensionan y optimizan automáticamente.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="image-alt">Texto alternativo (para SEO y accesibilidad)</Label>
                <Input
                  id="image-alt"
                  placeholder="Describe la imagen..."
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image-file">Subir desde tu equipo</Label>
                <Input
                  ref={fileInputRef}
                  id="image-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, "image")
                  }}
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground">Las imágenes se redimensionan automáticamente a 1200px máximo y se convierten a WebP</p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">O</span></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image-url">URL de la imagen</Label>
                <Input
                  id="image-url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addImage()
                    }
                  }}
                  disabled={uploading}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setImageDialogOpen(false); setImageAlt("") }} disabled={uploading}>Cancelar</Button>
              <Button type="button" onClick={addImage} disabled={!imageUrl || uploading}>Insertar URL</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Video */}
        <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="sm" title="Insertar video" aria-label="Acción">
              <VideoIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Insertar video</DialogTitle>
              <DialogDescription>Sube un video o pega una URL</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="video-file">Subir desde tu equipo</Label>
                <Input
                  ref={videoInputRef}
                  id="video-file"
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, "video")
                  }}
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground">Formats: MP4, WebM (max. 100MB)</p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">O</span></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="video-url">URL del video</Label>
                <Input
                  id="video-url"
                  placeholder="https://example.com/video.mp4"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addVideo()
                    }
                  }}
                  disabled={uploading}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setVideoDialogOpen(false)} disabled={uploading}>Cancelar</Button>
              <Button type="button" onClick={addVideo} disabled={!videoUrl || uploading}>Insertar URL</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Undo/Redo */}
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Deshacer" aria-label="Deshacer">
          <Undo className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Rehacer" aria-label="Rehacer">
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  )
}
