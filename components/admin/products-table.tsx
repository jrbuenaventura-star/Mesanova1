"use client"

import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type React from "react"
import Link from "next/link"
import { useState, useRouter } from "react"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Trash2, Upload, Search, Download, MoreVertical, Pencil, ExternalLink } from "lucide-react"
import Image from "next/image"
import { toast } from "@/hooks/use-toast"

interface Product {
  id: string
  pdt_codigo: string
  pdt_descripcion: string
  nombre_comercial?: string
  precio?: number
  is_on_sale: boolean
  is_active: boolean
  imagen_principal_url?: string
  upp_existencia: number
  product_categories?: {
    subcategory?: {
      name: string
      silo?: {
        name: string
      }
    }
  }[]
  descuento_porcentaje?: number
}

export function ProductsTable({ initialProducts }: { initialProducts: any[] }) {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Formulario para nuevo producto
  const [newProduct, setNewProduct] = useState({
    pdt_codigo: "",
    pdt_descripcion: "",
    nombre_comercial: "",
    precio: "",
    is_on_sale: false,
    is_active: true,
    imagen_principal_url: "",
    descuento_porcentaje: 0,
  })

  const supabase = createClient()

  const filteredProducts = products.filter(
    (product) =>
      product.pdt_codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.pdt_descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.nombre_comercial?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(filteredProducts.map((p) => p.id)))
    } else {
      setSelectedProducts(new Set())
    }
  }

  const handleSelectProduct = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts)
    if (checked) {
      newSelected.add(productId)
    } else {
      newSelected.delete(productId)
    }
    setSelectedProducts(newSelected)
  }

  const handleAddProduct = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("products")
        .insert([
          {
            pdt_codigo: newProduct.pdt_codigo,
            pdt_descripcion: newProduct.pdt_descripcion,
            nombre_comercial: newProduct.nombre_comercial,
            precio: newProduct.precio ? Number.parseFloat(newProduct.precio) : null,
            is_on_sale: newProduct.is_on_sale,
            is_active: newProduct.is_active,
            imagen_principal_url: newProduct.imagen_principal_url,
            slug: newProduct.nombre_comercial
              ? newProduct.nombre_comercial.toLowerCase().replace(/\s+/g, "-")
              : newProduct.pdt_descripcion.toLowerCase().replace(/\s+/g, "-"),
            descuento_porcentaje: newProduct.descuento_porcentaje,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setProducts([data, ...products])
      setIsAddDialogOpen(false)
      setNewProduct({
        pdt_codigo: "",
        pdt_descripcion: "",
        nombre_comercial: "",
        precio: "",
        is_on_sale: false,
        is_active: true,
        imagen_principal_url: "",
        descuento_porcentaje: 0,
      })

      toast({
        title: "Producto agregado",
        description: "El producto se ha agregado exitosamente.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el producto",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditProduct = async () => {
    if (!editingProduct) return

    setIsLoading(true)
    try {
      console.log("[v0] Saving product:", {
        id: editingProduct.id,
        precio: editingProduct.precio,
        descuento: editingProduct.descuento_porcentaje,
      })

      // Si el descuento es mayor que 0, marcar como oferta automáticamente
      const isOnSale = (editingProduct.descuento_porcentaje || 0) > 0

      const { data, error } = await supabase
        .from("products")
        .update({
          precio: editingProduct.precio,
          descuento_porcentaje: editingProduct.descuento_porcentaje || 0,
          is_on_sale: isOnSale,
          is_active: editingProduct.is_active,
        })
        .eq("id", editingProduct.id)
        .select()
        .single()

      if (error) {
        console.error("[v0] Error updating product:", error)
        throw error
      }

      console.log("[v0] Product updated successfully:", data)

      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p.id === data.id
            ? {
                ...p,
                precio: data.precio,
                descuento_porcentaje: data.descuento_porcentaje,
                is_on_sale: data.is_on_sale,
                is_active: data.is_active,
              }
            : p,
        ),
      )
      setIsEditDialogOpen(false)
      setEditingProduct(null)

      toast({
        title: "Producto actualizado",
        description: isOnSale
          ? "Los cambios se han guardado. El producto ahora aparece en ofertas."
          : "Los cambios se han guardado exitosamente.",
      })

      router.refresh()
    } catch (error: any) {
      console.error("[v0] Error in handleEditProduct:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el producto",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProducts = async () => {
    if (selectedProducts.size === 0) return

    const confirmed = confirm(`¿Estás seguro de eliminar ${selectedProducts.size} producto(s)?`)
    if (!confirmed) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("products").delete().in("id", Array.from(selectedProducts))

      if (error) throw error

      setProducts(products.filter((p) => !selectedProducts.has(p.id)))
      setSelectedProducts(new Set())

      toast({
        title: "Productos eliminados",
        description: `${selectedProducts.size} producto(s) eliminado(s) exitosamente.`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron eliminar los productos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const text = await file.text()
      const lines = text.split("\n")
      const headers = lines[0].split(",").map((h) => h.trim())

      const newProducts = []
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue

        const values = lines[i].split(",").map((v) => v.trim())
        const product: any = {}

        headers.forEach((header, index) => {
          product[header] = values[index]
        })

        if (product.pdt_codigo && product.pdt_descripcion) {
          newProducts.push({
            pdt_codigo: product.pdt_codigo,
            pdt_descripcion: product.pdt_descripcion,
            nombre_comercial: product.nombre_comercial || null,
            precio: product.precio ? Number.parseFloat(product.precio) : null,
            is_on_sale: product.is_on_sale === "true" || product.is_on_sale === "1",
            is_active: product.is_active !== "false" && product.is_active !== "0",
            imagen_principal_url: product.imagen_principal_url || null,
            slug: (product.nombre_comercial || product.pdt_descripcion).toLowerCase().replace(/\s+/g, "-"),
            descuento_porcentaje: product.descuento_porcentaje ? Number.parseFloat(product.descuento_porcentaje) : 0,
          })
        }
      }

      if (newProducts.length > 0) {
        const { data, error } = await supabase.from("products").insert(newProducts).select()

        if (error) throw error

        setProducts([...data, ...products])
        setIsBulkUploadOpen(false)

        toast({
          title: "Carga masiva completada",
          description: `${newProducts.length} producto(s) importado(s) exitosamente.`,
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar el archivo",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      e.target.value = ""
    }
  }

  const exportToCSV = () => {
    const headers = [
      "pdt_codigo",
      "pdt_descripcion",
      "nombre_comercial",
      "precio",
      "is_on_sale",
      "is_active",
      "upp_existencia",
      "descuento_porcentaje",
    ]
    const csv = [
      headers.join(","),
      ...filteredProducts.map((p) =>
        [
          p.pdt_codigo,
          `"${p.pdt_descripcion}"`,
          `"${p.nombre_comercial || ""}"`,
          p.precio || "",
          p.is_on_sale ? "1" : "0",
          p.is_active ? "1" : "0",
          p.upp_existencia || "0",
          p.descuento_porcentaje || "0",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `productos-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por SKU, descripción o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedProducts.size > 0 && (
            <Button variant="destructive" size="sm" onClick={handleDeleteProducts} disabled={isLoading}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar ({selectedProducts.size})
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>

          <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Carga Masiva
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Carga Masiva de Productos</DialogTitle>
                <DialogDescription>
                  Sube un archivo CSV con los productos. El archivo debe tener las columnas: pdt_codigo,
                  pdt_descripcion, nombre_comercial, precio, is_on_sale, is_active, descuento_porcentaje
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="csv-file">Archivo CSV</Label>
                  <Input id="csv-file" type="file" accept=".csv" onChange={handleBulkUpload} disabled={isLoading} />
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Producto</DialogTitle>
                <DialogDescription>Completa la información del nuevo producto</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="sku">SKU / Código *</Label>
                    <Input
                      id="sku"
                      value={newProduct.pdt_codigo}
                      onChange={(e) => setNewProduct({ ...newProduct, pdt_codigo: e.target.value })}
                      placeholder="Ej: ALM-001"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="precio">Precio</Label>
                    <Input
                      id="precio"
                      type="number"
                      step="0.01"
                      value={newProduct.precio}
                      onChange={(e) => setNewProduct({ ...newProduct, precio: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="descripcion">Descripción *</Label>
                  <Textarea
                    id="descripcion"
                    value={newProduct.pdt_descripcion}
                    onChange={(e) => setNewProduct({ ...newProduct, pdt_descripcion: e.target.value })}
                    placeholder="Descripción del producto"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="nombre-comercial">Nombre Comercial</Label>
                  <Input
                    id="nombre-comercial"
                    value={newProduct.nombre_comercial}
                    onChange={(e) => setNewProduct({ ...newProduct, nombre_comercial: e.target.value })}
                    placeholder="Nombre para mostrar en la web"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="imagen">URL de Imagen</Label>
                  <Input
                    id="imagen"
                    value={newProduct.imagen_principal_url}
                    onChange={(e) => setNewProduct({ ...newProduct, imagen_principal_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="descuento">Descuento (%)</Label>
                  <Input
                    id="descuento"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={newProduct.descuento_porcentaje}
                    onChange={(e) => setNewProduct({ ...newProduct, descuento_porcentaje: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="on-sale"
                      checked={newProduct.is_on_sale}
                      onCheckedChange={(checked) => setNewProduct({ ...newProduct, is_on_sale: checked as boolean })}
                    />
                    <Label htmlFor="on-sale" className="text-sm font-normal">
                      En oferta
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="active"
                      checked={newProduct.is_active}
                      onCheckedChange={(checked) => setNewProduct({ ...newProduct, is_active: checked as boolean })}
                    />
                    <Label htmlFor="active" className="text-sm font-normal">
                      Activo
                    </Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddProduct}
                  disabled={isLoading || !newProduct.pdt_codigo || !newProduct.pdt_descripcion}
                >
                  {isLoading ? "Guardando..." : "Guardar Producto"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedProducts.size === filteredProducts.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-20">Imagen</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No se encontraron productos
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const discountedPrice = product.descuento_porcentaje
                  ? product.precio * (1 - product.descuento_porcentaje / 100)
                  : product.precio

                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      {product.imagen_principal_url ? (
                        <Image
                          src={product.imagen_principal_url || "/placeholder.svg"}
                          alt={product.nombre_comercial || product.pdt_descripcion}
                          width={48}
                          height={48}
                          className="rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                          Sin img
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.pdt_codigo}</TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium line-clamp-1">
                          {product.nombre_comercial || product.pdt_descripcion}
                        </div>
                        {product.nombre_comercial && (
                          <div className="text-sm text-muted-foreground line-clamp-1">{product.pdt_descripcion}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {product.product_categories?.[0]?.subcategory?.silo?.name && (
                          <div className="font-medium">{product.product_categories[0].subcategory.silo.name}</div>
                        )}
                        {product.product_categories?.[0]?.subcategory?.name && (
                          <div className="text-muted-foreground">{product.product_categories[0].subcategory.name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {product.precio ? (
                        <div className="space-y-1">
                          {product.descuento_porcentaje && product.descuento_porcentaje > 0 ? (
                            <>
                              <div className="text-sm text-muted-foreground line-through">
                                ${product.precio.toFixed(2)}
                              </div>
                              <div className="font-medium text-green-600">${discountedPrice.toFixed(2)}</div>
                              <Badge variant="destructive" className="text-xs">
                                -{product.descuento_porcentaje}%
                              </Badge>
                            </>
                          ) : (
                            <div className="font-medium">${product.precio.toFixed(2)}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={product.upp_existencia > 0 ? "default" : "secondary"}>
                        {product.upp_existencia || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingProduct(product)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar Precio y Descuento
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/products/${product.id}/editar`} className="flex items-center">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Edición Avanzada
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Precio y Descuento</DialogTitle>
            <DialogDescription>
              Si el descuento es mayor que 0%, el producto aparecerá automáticamente en la página de ofertas
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Producto</Label>
                <div className="text-sm text-muted-foreground">
                  {editingProduct.nombre_comercial || editingProduct.pdt_descripcion}
                  <div className="font-mono">{editingProduct.pdt_codigo}</div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-precio">Precio</Label>
                <Input
                  id="edit-precio"
                  type="number"
                  step="0.01"
                  value={editingProduct.precio || ""}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, precio: Number.parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-descuento">Descuento (%)</Label>
                <Input
                  id="edit-descuento"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={editingProduct.descuento_porcentaje || ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      descuento_porcentaje: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
                {(editingProduct.descuento_porcentaje || 0) > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Precio con descuento: $
                    {((editingProduct.precio || 0) * (1 - (editingProduct.descuento_porcentaje || 0) / 100)).toFixed(2)}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-active"
                  checked={editingProduct.is_active}
                  onCheckedChange={(checked) => setEditingProduct({ ...editingProduct, is_active: checked as boolean })}
                />
                <Label htmlFor="edit-active" className="text-sm font-normal">
                  Producto activo
                </Label>
              </div>

              {(editingProduct.descuento_porcentaje || 0) > 0 && (
                <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
                  Este producto se mostrará automáticamente en la página de ofertas
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditProduct} disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
