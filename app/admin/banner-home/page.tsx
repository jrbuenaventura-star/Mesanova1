"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface BannerSlide {
  id: string
  title: string
  subtitle?: string
  description?: string
  image_url: string
  cta_text?: string
  cta_link?: string
  order_index: number
  is_active: boolean
  background_color?: string
  text_color?: string
}

export default function BannerHomePage() {
  const [slides, setSlides] = useState<BannerSlide[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSlide, setEditingSlide] = useState<BannerSlide | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    image_url: "",
    cta_text: "",
    cta_link: "",
    background_color: "#000000",
    text_color: "#FFFFFF",
  })

  useEffect(() => {
    loadSlides()
  }, [])

  const loadSlides = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('home_banner_slides')
      .select('*')
      .order('order_index', { ascending: true })

    setSlides(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    if (editingSlide) {
      // Actualizar slide existente
      const { error } = await supabase
        .from('home_banner_slides')
        .update(formData)
        .eq('id', editingSlide.id)

      if (error) {
        toast.error('Error al actualizar slide')
        return
      }
      toast.success('Slide actualizado exitosamente')
    } else {
      // Crear nuevo slide
      const maxOrder = slides.length > 0 
        ? Math.max(...slides.map(s => s.order_index))
        : 0

      const { error } = await supabase
        .from('home_banner_slides')
        .insert({
          ...formData,
          order_index: maxOrder + 1,
          is_active: true,
        })

      if (error) {
        toast.error('Error al crear slide')
        return
      }
      toast.success('Slide creado exitosamente')
    }

    setIsDialogOpen(false)
    resetForm()
    loadSlides()
  }

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      image_url: "",
      cta_text: "",
      cta_link: "",
      background_color: "#000000",
      text_color: "#FFFFFF",
    })
    setEditingSlide(null)
  }

  const openEditDialog = (slide: BannerSlide) => {
    setEditingSlide(slide)
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle || "",
      description: slide.description || "",
      image_url: slide.image_url,
      cta_text: slide.cta_text || "",
      cta_link: slide.cta_link || "",
      background_color: slide.background_color || "#000000",
      text_color: slide.text_color || "#FFFFFF",
    })
    setIsDialogOpen(true)
  }

  const deleteSlide = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este slide?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('home_banner_slides')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Error al eliminar slide')
      return
    }

    toast.success('Slide eliminado')
    loadSlides()
  }

  const toggleActive = async (id: string, currentState: boolean) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('home_banner_slides')
      .update({ is_active: !currentState })
      .eq('id', id)

    if (error) {
      toast.error('Error al cambiar estado')
      return
    }

    toast.success(currentState ? 'Slide desactivado' : 'Slide activado')
    loadSlides()
  }

  const moveSlide = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = slides.findIndex(s => s.id === id)
    if (currentIndex === -1) return
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= slides.length) return

    const supabase = createClient()
    const current = slides[currentIndex]
    const target = slides[targetIndex]

    await supabase
      .from('home_banner_slides')
      .update({ order_index: target.order_index })
      .eq('id', current.id)

    await supabase
      .from('home_banner_slides')
      .update({ order_index: current.order_index })
      .eq('id', target.id)

    loadSlides()
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Banner del Home</h1>
          <p className="text-muted-foreground">
            Gestiona los slides del carrusel principal de la página de inicio
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Slide
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSlide ? 'Editar Slide' : 'Nuevo Slide'}</DialogTitle>
              <DialogDescription>
                Configura el contenido y diseño del slide del banner
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Artículos para Cocina y Mesa..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtítulo (Badge)</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Calidad Premium desde 1995"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descubre nuestra amplia selección..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">URL de Imagen *</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="/images/banner-1.jpg"
                  required
                />
                {formData.image_url && (
                  <div className="relative h-40 bg-muted rounded overflow-hidden">
                    <Image
                      src={formData.image_url}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cta_text">Texto del Botón</Label>
                  <Input
                    id="cta_text"
                    value={formData.cta_text}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    placeholder="Explorar Productos"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cta_link">Enlace del Botón</Label>
                  <Input
                    id="cta_link"
                    value={formData.cta_link}
                    onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                    placeholder="/productos"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="background_color">Color de Fondo (Overlay)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="background_color"
                      type="color"
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      className="w-20"
                    />
                    <Input
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text_color">Color del Texto</Label>
                  <div className="flex gap-2">
                    <Input
                      id="text_color"
                      type="color"
                      value={formData.text_color}
                      onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                      className="w-20"
                    />
                    <Input
                      value={formData.text_color}
                      onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingSlide ? 'Actualizar' : 'Crear'} Slide
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Slides */}
      <div className="space-y-4">
        {slides.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p>No hay slides configurados</p>
              <p className="text-sm">Crea tu primer slide para el banner del home</p>
            </CardContent>
          </Card>
        ) : (
          slides.map((slide, index) => (
            <Card key={slide.id} className={!slide.is_active ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {slide.title}
                      {!slide.is_active && (
                        <span className="text-sm font-normal text-muted-foreground">(Inactivo)</span>
                      )}
                    </CardTitle>
                    {slide.subtitle && (
                      <CardDescription>{slide.subtitle}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => moveSlide(slide.id, 'up')}
                      disabled={index === 0}
                     aria-label="Acción">
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => moveSlide(slide.id, 'down')}
                      disabled={index === slides.length - 1}
                     aria-label="Acción">
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative h-48 bg-muted rounded overflow-hidden">
                  <Image
                    src={slide.image_url}
                    alt={slide.title}
                    fill
                    className="object-cover"
                  />
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ 
                      backgroundColor: slide.background_color,
                      opacity: 0.5 
                    }}
                  />
                  <div 
                    className="absolute inset-0 p-8 flex items-center"
                    style={{ color: slide.text_color }}
                  >
                    <div className="max-w-md">
                      <h3 className="text-2xl font-bold mb-2">{slide.title}</h3>
                      {slide.description && (
                        <p className="text-sm opacity-90">{slide.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={slide.is_active}
                        onCheckedChange={() => toggleActive(slide.id, slide.is_active)}
                      />
                      <Label className="text-sm">
                        {slide.is_active ? 'Activo' : 'Inactivo'}
                      </Label>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Orden: {slide.order_index}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(slide)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteSlide(slide.id)}
                     aria-label="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
