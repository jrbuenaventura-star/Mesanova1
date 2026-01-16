"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Product, Silo, Subcategory, Collection } from "@/lib/db/types"

interface ProductsManagementProps {
  initialProducts: Product[]
  silos: Silo[]
  subcategories: Subcategory[]
  collections: Collection[]
}

export function ProductsManagement({ initialProducts, silos, subcategories, collections }: ProductsManagementProps) {
  const router = useRouter()
  const [products, setProducts] = useState(initialProducts)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [priceDialogOpen, setPriceDialogOpen] = useState(false)
  const [editPrice, setEditPrice] = useState("")
  const [editDiscount, setEditDiscount] = useState("0")
  const [isLoading, setIsLoading] = useState(false)

  // Filtrar productos por búsqueda
  const filteredProducts = products.filter((product) => {
    const term = searchTerm.toLowerCase()
    return (
      product.pdt_codigo?.toLowerCase().includes(term) ||
      product.pdt_descripcion?.toLowerCase().includes(term) ||
      product.nombre_comercial?.toLowerCase().includes(term)
    )
  })

  // Abrir dialog de edición de precio
  const handleOpenPriceDialog = (product: Product) => {
    setEditingProduct(product)
    setEditPrice(product.precio?.toString() || "0")
    setEditDiscount("0")
    setPriceDialogOpen(true)
  }

  // Guardar precio y descuento
  const handleSavePriceDiscount = async () => {
    if (!editingProduct) return

    setIsLoading(true)
    const supabase = createClient()

    const precio = Number.parseFloat(editPrice)
    const descuento = Number.parseFloat(editDiscount)
    const isOnSale = descuento > 0

    const { error } = await supabase
      .from("products")
      .update({
        precio,
        is_on_sale: isOnSale,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingProduct.id)

    if (error) {
      console.error("[v0] Error updating price:", error)
      alert("Error al actualizar el precio")
    } else {
      // Actualizar el estado local
      setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? { ...p, precio, is_on_sale: isOnSale } : p)))
      setPriceDialogOpen(false)
      setEditingProduct(null)
    }

    setIsLoading(false)
  }

  // Eliminar producto
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    const { error } = await supabase.from("products").delete().eq("id", productId)

    if (error) {
      console.error("[v0] Error deleting product:", error)
      alert("Error al eliminar el producto")
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== productId))
    }

    setIsLoading(false)
  }

  // Calcular precio con descuento
  const getPriceWithDiscount = (price: number, discount: number) => {
    return price * (1 - discount / 100)
  }

  return (
    <div className="space-y-4">
      {/* Barra de acciones */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por SKU, descripción o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button asChild>
          <Link href="/admin/products/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Agregar Producto
          </Link>
        </Button>
      </div>

      {/* Tabla de productos */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Imagen</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[80px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No se encontraron productos.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="relative h-12 w-12 overflow-hidden rounded-md border">
                      {product.imagen_principal_url ? (
                        <Image
                          src={product.imagen_principal_url || "/placeholder.svg"}
                          alt={product.nombre_comercial || product.pdt_descripcion}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                          Sin imagen
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{product.pdt_codigo}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.nombre_comercial || product.pdt_descripcion}</div>
                      {product.nombre_comercial && (
                        <div className="text-sm text-muted-foreground">{product.pdt_descripcion}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.precio ? (
                      <div className="space-y-1">
                        <div className="font-medium">${product.precio.toLocaleString()}</div>
                        {product.is_on_sale && (
                          <Badge variant="secondary" className="text-xs">
                            En oferta
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.upp_existencia > 0 ? "default" : "secondary"}>
                      {product.upp_existencia}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenPriceDialog(product)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar Precio y Descuento
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/products/${product.id}/editar`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edición Avanzada
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de edición de precio y descuento */}
      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Precio y Descuento</DialogTitle>
            <DialogDescription>{editingProduct?.nombre_comercial || editingProduct?.pdt_descripcion}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="price">Precio ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount">Descuento (%)</Label>
              <Input
                id="discount"
                type="number"
                step="1"
                min="0"
                max="100"
                value={editDiscount}
                onChange={(e) => setEditDiscount(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Si el descuento es mayor que 0, el producto aparecerá en Ofertas
              </p>
            </div>
            {Number.parseFloat(editDiscount) > 0 && Number.parseFloat(editPrice) > 0 && (
              <div className="rounded-md bg-muted p-3">
                <div className="text-sm font-medium">Precio con descuento:</div>
                <div className="text-2xl font-bold text-primary">
                  $
                  {getPriceWithDiscount(Number.parseFloat(editPrice), Number.parseFloat(editDiscount)).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground line-through">
                  ${Number.parseFloat(editPrice).toLocaleString()}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceDialogOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSavePriceDiscount} disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
