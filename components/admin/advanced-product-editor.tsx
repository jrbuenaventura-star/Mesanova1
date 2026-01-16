"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { ArrowLeft, Save, X, Plus, Video } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { ProductWithCategories, Silo, Collection } from "@/lib/db/types"

interface Props {
  product: ProductWithCategories
  silos: Silo[]
  collections: Collection[]
}

export function AdvancedProductEditor({ product: initialProduct, silos, collections }: Props) {
  const router = useRouter()
  const [product, setProduct] = useState(initialProduct)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSilo, setSelectedSilo] = useState<string>("none")
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [productTypes, setProductTypes] = useState<any[]>([])
  const [newImageUrl, setNewImageUrl] = useState("")
  const [newVideoUrl, setNewVideoUrl] = useState("")

  const supabase = createClient()

  // Cargar subcategorías cuando se selecciona un silo
  const handleSiloChange = async (siloId: string) => {
    setSelectedSilo(siloId)
    const { data } = await supabase.from("subcategories").select("*").eq("silo_id", siloId).order("order_index")
    setSubcategories(data || [])
    setProductTypes([])
  }

  // Cargar tipos de producto cuando se selecciona una subcategoría
  const handleSubcategoryChange = async (subcategoryId: string) => {
    const { data } = await supabase
      .from("product_types")
      .select("*")
      .eq("subcategory_id", subcategoryId)
      .order("order_index")
    setProductTypes(data || [])
  }

  // Agregar categoría al producto
  const handleAddCategory = async (subcategoryId: string) => {
    try {
      const { error } = await supabase.from("product_categories").insert({
        product_id: product.id,
        subcategory_id: subcategoryId,
        is_primary: !product.categories || product.categories.length === 0,
      })

      if (error) throw error

      // Recargar categorías
      const { data } = await supabase
        .from("product_categories")
        .select("*, subcategory:subcategories(*, silo:silos(*))")
        .eq("product_id", product.id)

      setProduct({ ...product, categories: data || [] })
      toast({ title: "Categoría agregada" })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  // Remover categoría
  const handleRemoveCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase.from("product_categories").delete().eq("id", categoryId)

      if (error) throw error

      setProduct({
        ...product,
        categories: product.categories?.filter((c) => c.id !== categoryId),
      })
      toast({ title: "Categoría removida" })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  // Agregar tipo de producto
  const handleAddProductType = async (productTypeId: string) => {
    try {
      const { error } = await supabase.from("product_product_types").insert({
        product_id: product.id,
        product_type_id: productTypeId,
      })

      if (error) throw error

      // Recargar tipos
      const { data } = await supabase
        .from("product_product_types")
        .select("*, product_type:product_types(*)")
        .eq("product_id", product.id)

      setProduct({ ...product, product_types: data || [] })
      toast({ title: "Tipo de producto agregado" })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  // Remover tipo de producto
  const handleRemoveProductType = async (typeId: string) => {
    try {
      const { error } = await supabase.from("product_product_types").delete().eq("id", typeId)

      if (error) throw error

      setProduct({
        ...product,
        product_types: product.product_types?.filter((t) => t.id !== typeId),
      })
      toast({ title: "Tipo de producto removido" })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  // Agregar imagen o video
  const handleAddMedia = async (type: "image" | "video") => {
    const url = type === "image" ? newImageUrl : newVideoUrl
    if (!url) return

    try {
      const { data, error } = await supabase
        .from("product_media")
        .insert({
          product_id: product.id,
          media_type: type,
          url: url,
          order_index: (product.media?.length || 0) + 1,
        })
        .select()
        .single()

      if (error) throw error

      setProduct({
        ...product,
        media: [...(product.media || []), data],
      })

      if (type === "image") setNewImageUrl("")
      else setNewVideoUrl("")

      toast({ title: `${type === "image" ? "Imagen" : "Video"} agregado` })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  // Remover media
  const handleRemoveMedia = async (mediaId: string) => {
    try {
      const { error } = await supabase.from("product_media").delete().eq("id", mediaId)

      if (error) throw error

      setProduct({
        ...product,
        media: product.media?.filter((m) => m.id !== mediaId),
      })
      toast({ title: "Media removido" })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  // Guardar cambios
  const handleSave = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("products")
        .update({
          nombre_comercial: product.nombre_comercial,
          precio: product.precio,
          descripcion_larga: product.descripcion_larga,
          material: product.material,
          color: product.color,
          dimensiones: product.dimensiones,
          peso: product.peso,
          capacidad: product.capacidad,
          fecha_reposicion: product.fecha_reposicion,
          cantidad_reposicion: product.cantidad_reposicion,
          pdt_empaque: product.pdt_empaque,
          instrucciones_uso: product.instrucciones_uso,
          instrucciones_cuidado: product.instrucciones_cuidado,
          garantia: product.garantia,
          pais_origen: product.pais_origen,
          marca: product.marca,
          linea_producto: product.linea_producto,
          collection_id: product.collection_id,
          is_active: product.is_active,
          is_featured: product.is_featured,
          is_new: product.is_new,
          is_on_sale: product.is_on_sale,
          imagen_principal_url: product.imagen_principal_url,
        })
        .eq("id", product.id)

      if (error) throw error

      toast({
        title: "Producto actualizado",
        description: "Los cambios se han guardado exitosamente",
      })

      router.push("/admin/products")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el producto",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Editar Producto</h1>
            <p className="text-muted-foreground">
              {product.pdt_codigo} - {product.pdt_descripcion}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>

      <Tabs defaultValue="basico" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basico">Información Básica</TabsTrigger>
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
          <TabsTrigger value="detalles">Detalles</TabsTrigger>
          <TabsTrigger value="media">Imágenes y Videos</TabsTrigger>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
        </TabsList>

        {/* Tab: Información Básica */}
        <TabsContent value="basico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>Datos principales del producto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código SKU (ERP)</Label>
                  <Input id="codigo" value={product.pdt_codigo} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precio">Precio</Label>
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    value={product.precio || ""}
                    onChange={(e) => setProduct({ ...product, precio: Number.parseFloat(e.target.value) || undefined })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre-comercial">Nombre Comercial</Label>
                <Input
                  id="nombre-comercial"
                  value={product.nombre_comercial || ""}
                  onChange={(e) => setProduct({ ...product, nombre_comercial: e.target.value })}
                  placeholder="Nombre para mostrar en el catálogo web"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción Completa</Label>
                <Textarea
                  id="descripcion"
                  rows={6}
                  value={product.descripcion_larga || ""}
                  onChange={(e) => setProduct({ ...product, descripcion_larga: e.target.value })}
                  placeholder="Descripción detallada del producto para el catálogo web"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coleccion">Colección</Label>
                <Select
                  value={product.collection_id || "none"}
                  onValueChange={(value) =>
                    setProduct({ ...product, collection_id: value === "none" ? undefined : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin colección" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin colección</SelectItem>
                    {collections.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imagen-principal">Imagen Principal URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="imagen-principal"
                    value={product.imagen_principal_url || ""}
                    onChange={(e) => setProduct({ ...product, imagen_principal_url: e.target.value })}
                    placeholder="https://..."
                  />
                  {product.imagen_principal_url && (
                    <Image
                      src={product.imagen_principal_url || "/placeholder.svg"}
                      alt="Vista previa"
                      width={60}
                      height={60}
                      className="rounded object-cover"
                    />
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="activo"
                    checked={product.is_active}
                    onCheckedChange={(checked) => setProduct({ ...product, is_active: checked as boolean })}
                  />
                  <Label htmlFor="activo">Activo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="destacado"
                    checked={product.is_featured}
                    onCheckedChange={(checked) => setProduct({ ...product, is_featured: checked as boolean })}
                  />
                  <Label htmlFor="destacado">Destacado</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="nuevo"
                    checked={product.is_new}
                    onCheckedChange={(checked) => setProduct({ ...product, is_new: checked as boolean })}
                  />
                  <Label htmlFor="nuevo">Nuevo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="oferta"
                    checked={product.is_on_sale}
                    onCheckedChange={(checked) => setProduct({ ...product, is_on_sale: checked as boolean })}
                  />
                  <Label htmlFor="oferta">En Oferta</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Categorías */}
        <TabsContent value="categorias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Categorías y Tipos de Producto</CardTitle>
              <CardDescription>Asigna categorías, subcategorías y tipos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Categorías actuales */}
              <div className="space-y-2">
                <Label>Categorías Asignadas</Label>
                <div className="flex flex-wrap gap-2">
                  {product.categories && product.categories.length > 0 ? (
                    product.categories.map((cat) => (
                      <Badge key={cat.id} variant="secondary" className="text-sm">
                        {cat.subcategory?.silo?.name} → {cat.subcategory?.name}
                        {cat.is_primary && <span className="ml-1 text-xs">(Principal)</span>}
                        <button
                          onClick={() => handleRemoveCategory(cat.id)}
                          className="ml-2 hover:text-destructive"
                          type="button"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay categorías asignadas</p>
                  )}
                </div>
              </div>

              {/* Agregar nueva categoría */}
              <div className="space-y-4 pt-4 border-t">
                <Label>Agregar Categoría</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="silo">Silo</Label>
                    <Select value={selectedSilo} onValueChange={handleSiloChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un silo" />
                      </SelectTrigger>
                      <SelectContent>
                        {silos.map((silo) => (
                          <SelectItem key={silo.id} value={silo.id}>
                            {silo.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subcategoria">Subcategoría</Label>
                    <Select
                      disabled={!selectedSilo || selectedSilo === "none"}
                      onValueChange={(value) => {
                        handleSubcategoryChange(value)
                        handleAddCategory(value)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona subcategoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategories.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Tipos de producto actuales */}
              <div className="space-y-2 pt-4 border-t">
                <Label>Tipos de Producto Asignados</Label>
                <div className="flex flex-wrap gap-2">
                  {product.product_types && product.product_types.length > 0 ? (
                    product.product_types.map((type) => (
                      <Badge key={type.id} variant="outline" className="text-sm">
                        {type.product_type?.name}
                        <button
                          onClick={() => handleRemoveProductType(type.id)}
                          className="ml-2 hover:text-destructive"
                          type="button"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay tipos asignados</p>
                  )}
                </div>
              </div>

              {/* Agregar tipos de producto */}
              {productTypes.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <Label>Agregar Tipo de Producto</Label>
                  <Select onValueChange={handleAddProductType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {productTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Detalles */}
        <TabsContent value="detalles" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Características Físicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="material">Material</Label>
                    <Input
                      id="material"
                      value={product.material || ""}
                      onChange={(e) => setProduct({ ...product, material: e.target.value })}
                      placeholder="Ej: Acero inoxidable"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      value={product.color || ""}
                      onChange={(e) => setProduct({ ...product, color: e.target.value })}
                      placeholder="Ej: Plateado"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dimensiones">Dimensiones</Label>
                  <Input
                    id="dimensiones"
                    value={product.dimensiones || ""}
                    onChange={(e) => setProduct({ ...product, dimensiones: e.target.value })}
                    placeholder="Ej: 30 x 20 x 10 cm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="peso">Peso (kg)</Label>
                    <Input
                      id="peso"
                      type="number"
                      step="0.01"
                      value={product.peso || ""}
                      onChange={(e) => setProduct({ ...product, peso: Number.parseFloat(e.target.value) || undefined })}
                      placeholder="Ej: 1.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacidad">Capacidad</Label>
                    <Input
                      id="capacidad"
                      value={product.capacidad || ""}
                      onChange={(e) => setProduct({ ...product, capacidad: e.target.value })}
                      placeholder="Ej: 2 litros"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="marca">Marca</Label>
                    <Input
                      id="marca"
                      value={product.marca || ""}
                      onChange={(e) => setProduct({ ...product, marca: e.target.value })}
                      placeholder="Ej: KitchenAid"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pais">País de Origen</Label>
                    <Input
                      id="pais"
                      value={product.pais_origen || ""}
                      onChange={(e) => setProduct({ ...product, pais_origen: e.target.value })}
                      placeholder="Ej: Colombia"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linea">Línea de Producto</Label>
                  <Input
                    id="linea"
                    value={product.linea_producto || ""}
                    onChange={(e) => setProduct({ ...product, linea_producto: e.target.value })}
                    placeholder="Ej: Professional Series"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Instrucciones y Garantía</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="uso">Instrucciones de Uso</Label>
                  <Textarea
                    id="uso"
                    rows={4}
                    value={product.instrucciones_uso || ""}
                    onChange={(e) => setProduct({ ...product, instrucciones_uso: e.target.value })}
                    placeholder="Cómo usar el producto..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cuidado">Instrucciones de Cuidado</Label>
                  <Textarea
                    id="cuidado"
                    rows={4}
                    value={product.instrucciones_cuidado || ""}
                    onChange={(e) => setProduct({ ...product, instrucciones_cuidado: e.target.value })}
                    placeholder="Cómo cuidar y mantener el producto..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="garantia">Garantía</Label>
                  <Textarea
                    id="garantia"
                    rows={3}
                    value={product.garantia || ""}
                    onChange={(e) => setProduct({ ...product, garantia: e.target.value })}
                    placeholder="Información de garantía..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Imágenes y Videos */}
        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Imágenes y Videos</CardTitle>
              <CardDescription>Galería multimedia del producto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Imágenes actuales */}
              <div className="space-y-2">
                <Label>Imágenes</Label>
                <div className="grid grid-cols-4 gap-4">
                  {product.media
                    ?.filter((m) => m.media_type === "image")
                    .map((media) => (
                      <div key={media.id} className="relative group">
                        <Image
                          src={media.url || "/placeholder.svg"}
                          alt={media.alt_text || "Imagen"}
                          width={200}
                          height={200}
                          className="rounded object-cover w-full h-40"
                        />
                        <button
                          onClick={() => handleRemoveMedia(media.id)}
                          className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          type="button"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Agregar imagen */}
              <div className="space-y-2">
                <Label htmlFor="nueva-imagen">Agregar Imagen</Label>
                <div className="flex gap-2">
                  <Input
                    id="nueva-imagen"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://..."
                  />
                  <Button onClick={() => handleAddMedia("image")} disabled={!newImageUrl} type="button">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar
                  </Button>
                </div>
              </div>

              {/* Videos actuales */}
              <div className="space-y-2 pt-4 border-t">
                <Label>Videos</Label>
                <div className="space-y-2">
                  {product.media
                    ?.filter((m) => m.media_type === "video")
                    .map((media) => (
                      <div key={media.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{media.url}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveMedia(media.id)} type="button">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Agregar video */}
              <div className="space-y-2">
                <Label htmlFor="nuevo-video">Agregar Video (URL de YouTube/Vimeo)</Label>
                <div className="flex gap-2">
                  <Input
                    id="nuevo-video"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <Button onClick={() => handleAddMedia("video")} disabled={!newVideoUrl} type="button">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Inventario */}
        <TabsContent value="inventario" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Inventario</CardTitle>
              <CardDescription>Información de reposición y empaque</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inner-pack">Inner Pack (unidades por caja)</Label>
                  <Input
                    id="inner-pack"
                    value={product.pdt_empaque || ""}
                    onChange={(e) => setProduct({ ...product, pdt_empaque: e.target.value })}
                    placeholder="Ej: 12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outer-pack">Outer Pack</Label>
                  <Input
                    id="outer-pack"
                    type="number"
                    value={product.outer_pack || ""}
                    onChange={(e) =>
                      setProduct({
                        ...product,
                        outer_pack: Number.parseInt(e.target.value) || undefined,
                      })
                    }
                    placeholder="Ej: 6"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha-reposicion">Fecha Estimada de Reposición</Label>
                  <Input
                    id="fecha-reposicion"
                    type="date"
                    value={product.fecha_reposicion || ""}
                    onChange={(e) => setProduct({ ...product, fecha_reposicion: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cantidad-reposicion">Cantidad de Reposición</Label>
                  <Input
                    id="cantidad-reposicion"
                    type="number"
                    value={product.cantidad_reposicion || ""}
                    onChange={(e) =>
                      setProduct({
                        ...product,
                        cantidad_reposicion: Number.parseInt(e.target.value) || undefined,
                      })
                    }
                    placeholder="Ej: 100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="existencia">Existencia Actual (Solo lectura - Desde ERP)</Label>
                <Input id="existencia" value={product.upp_existencia || 0} disabled className="bg-muted" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
