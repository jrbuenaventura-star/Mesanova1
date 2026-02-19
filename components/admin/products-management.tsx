"use client"

import { useState, useMemo } from "react"
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
import { Search, MoreVertical, Pencil, Plus, Trash2, AlertTriangle, Package, ExternalLink } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import Link from "next/link"
import type { Silo, Subcategory, Collection, ProductType } from "@/lib/db/types"

interface ProductWithJoins {
  id: string
  pdt_codigo: string
  pdt_descripcion: string
  nombre_comercial?: string
  marca?: string
  nombre_coleccion?: string
  precio?: number
  descuento_porcentaje?: number
  upp_existencia: number
  is_active: boolean
  is_on_sale: boolean
  descontinuado?: boolean
  pedido_en_camino?: boolean
  imagen_principal_url?: string
  product_categories?: { subcategory_id: string }[]
  product_product_types?: { product_type_id: string }[]
  [key: string]: any
}

interface ProductsManagementProps {
  initialProducts: ProductWithJoins[]
  silos: Silo[]
  subcategories: (Subcategory & { silo?: Silo })[]
  collections: Collection[]
  productTypes: ProductType[]
}

export function ProductsManagement({ initialProducts, silos, subcategories, collections, productTypes }: ProductsManagementProps) {
  const [products, setProducts] = useState(initialProducts)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSilo, setFilterSilo] = useState("all")
  const [filterSubcategory, setFilterSubcategory] = useState("all")
  const [filterProductType, setFilterProductType] = useState("all")
  const [filterMarca, setFilterMarca] = useState("all")
  const [filterEstado, setFilterEstado] = useState("all")
  const [editingProduct, setEditingProduct] = useState<ProductWithJoins | null>(null)
  const [priceDialogOpen, setPriceDialogOpen] = useState(false)
  const [editPrice, setEditPrice] = useState("")
  const [editDiscount, setEditDiscount] = useState("0")
  const [editPrecioDist, setEditPrecioDist] = useState("")
  const [editDescDist, setEditDescDist] = useState("0")
  const [isLoading, setIsLoading] = useState(false)

  // Extraer marcas únicas
  const marcas = Array.from(new Set(products.map(p => p.marca).filter((m): m is string => !!m))).sort()

  // Subcategorías del silo seleccionado
  const filteredSubcategories = useMemo(() => {
    if (filterSilo === "all") return []
    return subcategories.filter(s => (s as any).silo?.id === filterSilo || (s as any).silo_id === filterSilo)
  }, [filterSilo, subcategories])

  // Tipos de producto de la subcategoría seleccionada
  const filteredProductTypes = useMemo(() => {
    if (filterSubcategory === "all") return []
    return productTypes.filter(pt => pt.subcategory_id === filterSubcategory)
  }, [filterSubcategory, productTypes])

  // Build subcategory → silo lookup
  const subcatToSilo = useMemo(() => {
    const map = new Map<string, string>()
    subcategories.forEach(s => {
      if ((s as any).silo?.id) map.set(s.id, (s as any).silo.id)
      else if (s.silo_id) map.set(s.id, s.silo_id)
    })
    return map
  }, [subcategories])

  // Filtrar productos
  const filteredProducts = products.filter((product) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch = !term ||
      product.pdt_codigo?.toLowerCase().includes(term) ||
      product.pdt_descripcion?.toLowerCase().includes(term) ||
      product.nombre_comercial?.toLowerCase().includes(term) ||
      product.marca?.toLowerCase().includes(term)

    const matchesMarca = filterMarca === "all" || product.marca === filterMarca

    // Category filter chain
    let matchesCategory = true
    const productSubcatIds = product.product_categories?.map(c => c.subcategory_id) || []
    const productTypeIds = product.product_product_types?.map(t => t.product_type_id) || []

    if (filterSilo !== "all") {
      const siloSubcatIds = subcategories.filter(s => (s as any).silo?.id === filterSilo || s.silo_id === filterSilo).map(s => s.id)
      matchesCategory = productSubcatIds.some(id => siloSubcatIds.includes(id))
    }
    if (matchesCategory && filterSubcategory !== "all") {
      matchesCategory = productSubcatIds.includes(filterSubcategory)
    }
    if (matchesCategory && filterProductType !== "all") {
      matchesCategory = productTypeIds.includes(filterProductType)
    }

    let matchesEstado = true
    if (filterEstado === "descontinuado") matchesEstado = product.descontinuado === true
    else if (filterEstado === "pedido_camino") matchesEstado = product.pedido_en_camino === true
    else if (filterEstado === "activo") matchesEstado = product.is_active === true
    else if (filterEstado === "inactivo") matchesEstado = product.is_active === false

    return matchesSearch && matchesMarca && matchesCategory && matchesEstado
  })

  // Reset dependent filters
  const handleSiloChange = (value: string) => {
    setFilterSilo(value)
    setFilterSubcategory("all")
    setFilterProductType("all")
  }
  const handleSubcategoryChange = (value: string) => {
    setFilterSubcategory(value)
    setFilterProductType("all")
  }

  // Abrir dialog de edición de precio
  const handleOpenPriceDialog = (product: ProductWithJoins) => {
    setEditingProduct(product)
    setEditPrice(product.precio?.toString() || "0")
    setEditDiscount(product.descuento_porcentaje?.toString() || "0")
    setEditPrecioDist(product.precio_dist?.toString() || "")
    setEditDescDist(product.desc_dist?.toString() || "0")
    setPriceDialogOpen(true)
  }

  // Guardar precio y descuento
  const handleSavePriceDiscount = async () => {
    if (!editingProduct) return

    setIsLoading(true)
    const supabase = createClient()

    const precio = Number.parseFloat(editPrice)
    const descuento = Number.parseFloat(editDiscount)
    const precioDist = editPrecioDist ? Number.parseFloat(editPrecioDist) : null
    const descDist = Number.parseFloat(editDescDist) || 0
    const isOnSale = descuento > 0

    const { error } = await supabase
      .from("products")
      .update({
        precio,
        descuento_porcentaje: descuento,
        precio_dist: precioDist,
        desc_dist: descDist,
        is_on_sale: isOnSale,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingProduct.id)

    if (error) {
      console.error("[v0] Error updating price:", error)
      alert("Error al actualizar el precio")
    } else {
      // Actualizar el estado local
      setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? { ...p, precio, descuento_porcentaje: descuento, precio_dist: precioDist, desc_dist: descDist, is_on_sale: isOnSale } : p)))
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

  const hasActiveFilters = filterSilo !== "all" || filterSubcategory !== "all" || filterProductType !== "all" || filterMarca !== "all" || filterEstado !== "all"

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y acciones */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by SKU, name or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button asChild>
            <Link href="/admin/products/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={filterSilo} onValueChange={handleSiloChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {silos.map(silo => (
                <SelectItem key={silo.id} value={silo.id}>{silo.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {filteredSubcategories.length > 0 && (
            <Select value={filterSubcategory} onValueChange={handleSubcategoryChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Subcategory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subcategories</SelectItem>
                {filteredSubcategories.map(sub => (
                  <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {filteredProductTypes.length > 0 && (
            <Select value={filterProductType} onValueChange={setFilterProductType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Product type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {filteredProductTypes.map(pt => (
                  <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={filterMarca} onValueChange={setFilterMarca}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All brands</SelectItem>
              {marcas.map(marca => (
                <SelectItem key={marca} value={marca}>{marca}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="activo">Active</SelectItem>
              <SelectItem value="inactivo">Inactive</SelectItem>
              <SelectItem value="descontinuado">Discontinued</SelectItem>
              <SelectItem value="pedido_camino">In transit</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterSilo("all")
                setFilterSubcategory("all")
                setFilterProductType("all")
                setFilterMarca("all")
                setFilterEstado("all")
              }}
            >
              Clear filters
            </Button>
          )}

          <div className="ml-auto text-sm text-muted-foreground">
            {filteredProducts.length} of {products.length} products
          </div>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Image</TableHead>
              <TableHead className="w-[100px]">SKU</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="w-[100px]">Price</TableHead>
              <TableHead className="w-[80px]">Stock</TableHead>
              <TableHead className="w-[80px]">Status</TableHead>
              <TableHead className="w-[60px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="relative h-10 w-10 overflow-hidden rounded-md border flex-shrink-0">
                      {product.imagen_principal_url ? (
                        <Image
                          src={product.imagen_principal_url}
                          alt={product.nombre_comercial || product.pdt_descripcion || "Product"}
                          fill
                          className="object-cover"
                          unoptimized
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted text-[10px] text-muted-foreground">
                          N/A
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{product.pdt_codigo}</TableCell>
                  <TableCell>
                    <div className="max-w-[300px]">
                      <div className="font-medium truncate">{product.nombre_comercial || product.pdt_descripcion}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {product.marca && <span className="text-xs text-muted-foreground">{product.marca}</span>}
                        {product.descontinuado && (
                          <Badge variant="destructive" className="text-[10px] px-1 py-0">
                            <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                            Disc.
                          </Badge>
                        )}
                        {product.pedido_en_camino && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            <Package className="h-2.5 w-2.5 mr-0.5" />
                            Transit
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.precio ? (
                      <div>
                        <div className="font-medium text-sm">${product.precio.toLocaleString()}</div>
                        {product.descuento_porcentaje && product.descuento_porcentaje > 0 && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 mt-0.5">
                            {product.descuento_porcentaje}% OFF
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.upp_existencia > 0 ? "default" : "secondary"} className="text-xs">
                      {product.upp_existencia}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "default" : "secondary"} className="text-xs">
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Más opciones">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenPriceDialog(product)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Price & Discount
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/products/${product.id}/editar`} className="flex items-center">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Advanced Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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
            <DialogTitle>Edit Price & Discount</DialogTitle>
            <DialogDescription>{editingProduct?.nombre_comercial || editingProduct?.pdt_descripcion}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
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
              <Label htmlFor="discount">Discount (%)</Label>
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
                If discount is greater than 0, the product will appear in Offers
              </p>
            </div>
            {Number.parseFloat(editDiscount) > 0 && Number.parseFloat(editPrice) > 0 && (
              <div className="rounded-md bg-muted p-3">
                <div className="text-sm font-medium">Discounted price:</div>
                <div className="text-2xl font-bold text-primary">
                  $
                  {getPriceWithDiscount(Number.parseFloat(editPrice), Number.parseFloat(editDiscount)).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground line-through">
                  ${Number.parseFloat(editPrice).toLocaleString()}
                </div>
              </div>
            )}

            <div className="border-t pt-4 mt-2">
              <p className="text-sm font-medium mb-3">Distributor Pricing</p>
              <div className="space-y-2">
                <Label htmlFor="precio-dist">Distributor Price ($)</Label>
                <Input
                  id="precio-dist"
                  type="number"
                  step="0.01"
                  value={editPrecioDist}
                  onChange={(e) => setEditPrecioDist(e.target.value)}
                  placeholder="Leave empty if N/A"
                />
              </div>
              <div className="space-y-2 mt-2">
                <Label htmlFor="desc-dist">Product Distributor Discount (%)</Label>
                <Input
                  id="desc-dist"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={editDescDist}
                  onChange={(e) => setEditDescDist(e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Applies to ALL distributors on this product, after their own discount %
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSavePriceDiscount} disabled={isLoading} aria-label="Acción">
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
