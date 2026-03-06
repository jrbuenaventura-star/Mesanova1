"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
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
import type { Silo, Subcategory, ProductType } from "@/lib/db/types"
import { useToast } from "@/hooks/use-toast"

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
  product_type_id?: string | null
  product_categories?: { subcategory_id: string }[]
  product_product_types?: { product_type_id: string }[]
  [key: string]: any
}

interface ProductsManagementProps {
  initialProducts: ProductWithJoins[]
  silos: Silo[]
  subcategories: (Subcategory & { silo?: Silo })[]
  productTypes: ProductType[]
  currentUserId: string
}

interface PriceAdjustmentRequest {
  id: string
  product_id: string
  product_code: string | null
  product_name: string | null
  requested_by: string
  requested_by_name: string | null
  status: "pending" | "approved" | "rejected" | "cancelled"
  request_reason: string | null
  review_notes: string | null
  previous_values: {
    precio?: number | null
    descuento_porcentaje?: number | null
    precio_dist?: number | null
    desc_dist?: number | null
    is_on_sale?: boolean | null
  }
  requested_values: {
    precio?: number | null
    descuento_porcentaje?: number | null
    precio_dist?: number | null
    desc_dist?: number | null
    is_on_sale?: boolean | null
  }
  created_at: string
}

export function ProductsManagement({
  initialProducts,
  silos,
  subcategories,
  productTypes,
  currentUserId,
}: ProductsManagementProps) {
  const { toast } = useToast()
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
  const [pendingRequests, setPendingRequests] = useState<PriceAdjustmentRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)

  const loadPendingRequests = useCallback(async () => {
    setRequestsLoading(true)
    try {
      const response = await fetch("/api/admin/products/pricing?status=pending&limit=200", { cache: "no-store" })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "No se pudo cargar solicitudes pendientes")
      }
      setPendingRequests((payload.requests || []) as PriceAdjustmentRequest[])
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo cargar solicitudes pendientes",
        variant: "destructive",
      })
    } finally {
      setRequestsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadPendingRequests()
  }, [loadPendingRequests])

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
    const productTypeIdsFromJoin = product.product_product_types?.map(t => t.product_type_id) || []
    const productTypeIds = productTypeIdsFromJoin.length > 0
      ? productTypeIdsFromJoin
      : (product.product_type_id ? [product.product_type_id] : [])

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

    const precio = Number.parseFloat(editPrice)
    const descuento = Number.parseFloat(editDiscount)
    const precioDist = editPrecioDist ? Number.parseFloat(editPrecioDist) : null
    const descDist = Number.parseFloat(editDescDist) || 0
    const isOnSale = descuento > 0

    try {
      const response = await fetch("/api/admin/products/pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: editingProduct.id,
          precio,
          descuento_porcentaje: descuento,
          precio_dist: precioDist,
          desc_dist: descDist,
          is_on_sale: isOnSale,
          request_reason: "Ajuste manual desde panel de productos",
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Error al crear solicitud de ajuste")
      }

      toast({
        title: "Solicitud enviada",
        description: "El cambio de precio quedó pendiente de aprobación por otro superadmin.",
      })

      setPriceDialogOpen(false)
      setEditingProduct(null)
      await loadPendingRequests()
    } catch (error) {
      console.error("[v0] Error creating pricing request:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear la solicitud",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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

  const handleReviewRequest = async (
    request: PriceAdjustmentRequest,
    action: "approve" | "reject" | "cancel"
  ) => {
    let reviewNotes = ""
    if (action === "reject") {
      reviewNotes = window.prompt("Motivo del rechazo (obligatorio):", "") || ""
      if (!reviewNotes.trim()) return
    }
    if (action === "approve") {
      reviewNotes = window.prompt("Notas de aprobación (opcional):", "") || ""
    }
    if (action === "cancel") {
      const confirmed = window.confirm("¿Cancelar esta solicitud pendiente?")
      if (!confirmed) return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/products/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          action,
          review_notes: reviewNotes.trim() || undefined,
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "No se pudo procesar la solicitud")
      }

      if (action === "approve" && payload.product) {
        const approvedProduct = payload.product as {
          id: string
          precio: number
          descuento_porcentaje: number
          precio_dist: number | null
          desc_dist: number
          is_on_sale: boolean
        }
        setProducts((prev) =>
          prev.map((product) =>
            product.id === approvedProduct.id
              ? {
                  ...product,
                  precio: approvedProduct.precio,
                  descuento_porcentaje: approvedProduct.descuento_porcentaje,
                  precio_dist: approvedProduct.precio_dist,
                  desc_dist: approvedProduct.desc_dist,
                  is_on_sale: approvedProduct.is_on_sale,
                }
              : product
          )
        )
      }

      toast({
        title:
          action === "approve"
            ? "Solicitud aprobada"
            : action === "reject"
              ? "Solicitud rechazada"
              : "Solicitud cancelada",
        description: "Se actualizó el estado de la solicitud.",
      })

      await loadPendingRequests()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo procesar la solicitud",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Calcular precio con descuento
  const getPriceWithDiscount = (price: number, discount: number) => {
    return price * (1 - discount / 100)
  }

  const hasActiveFilters = filterSilo !== "all" || filterSubcategory !== "all" || filterProductType !== "all" || filterMarca !== "all" || filterEstado !== "all"
  const formatPrice = (value: number | null | undefined) =>
    value === null || value === undefined ? "N/D" : `$${Number(value).toLocaleString("es-CO")}`

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h3 className="font-semibold">Solicitudes pendientes de ajuste de precio</h3>
            <p className="text-sm text-muted-foreground">
              Cada cambio manual requiere aprobación de otro superadmin.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadPendingRequests()} disabled={requestsLoading}>
            {requestsLoading ? "Cargando..." : "Recargar"}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Solicita</TableHead>
                <TableHead>Anterior</TableHead>
                <TableHead>Solicitado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-16 text-center text-muted-foreground">
                    No hay solicitudes pendientes.
                  </TableCell>
                </TableRow>
              ) : (
                pendingRequests.map((request) => {
                  const isOwnRequest = request.requested_by === currentUserId
                  return (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="font-medium">{request.product_name || "Producto"}</div>
                        <div className="text-xs text-muted-foreground">{request.product_code || request.product_id}</div>
                        {request.request_reason && (
                          <div className="mt-1 text-xs text-muted-foreground">{request.request_reason}</div>
                        )}
                      </TableCell>
                      <TableCell>{request.requested_by_name || request.requested_by}</TableCell>
                      <TableCell className="text-xs">
                        <div>Precio: {formatPrice(request.previous_values?.precio)}</div>
                        <div>Desc: {Number(request.previous_values?.descuento_porcentaje || 0)}%</div>
                        <div>Dist: {formatPrice(request.previous_values?.precio_dist)}</div>
                        <div>Desc dist: {Number(request.previous_values?.desc_dist || 0)}%</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>Precio: {formatPrice(request.requested_values?.precio)}</div>
                        <div>Desc: {Number(request.requested_values?.descuento_porcentaje || 0)}%</div>
                        <div>Dist: {formatPrice(request.requested_values?.precio_dist)}</div>
                        <div>Desc dist: {Number(request.requested_values?.desc_dist || 0)}%</div>
                      </TableCell>
                      <TableCell>{new Date(request.created_at).toLocaleString("es-CO")}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {isOwnRequest ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleReviewRequest(request, "cancel")}
                              disabled={isLoading}
                            >
                              Cancelar
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => void handleReviewRequest(request, "approve")}
                                disabled={isLoading}
                              >
                                Aprobar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => void handleReviewRequest(request, "reject")}
                                disabled={isLoading}
                              >
                                Rechazar
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Barra de búsqueda y acciones */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por SKU, nombre o marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button asChild>
            <Link href="/admin/products/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Agregar producto
            </Link>
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={filterSilo} onValueChange={handleSiloChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {silos.map(silo => (
                <SelectItem key={silo.id} value={silo.id}>{silo.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {filteredSubcategories.length > 0 && (
            <Select value={filterSubcategory} onValueChange={handleSubcategoryChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Subcategoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las subcategorías</SelectItem>
                {filteredSubcategories.map(sub => (
                  <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {filteredProductTypes.length > 0 && (
            <Select value={filterProductType} onValueChange={setFilterProductType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de producto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {filteredProductTypes.map(pt => (
                  <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={filterMarca} onValueChange={setFilterMarca}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las marcas</SelectItem>
              {marcas.map(marca => (
                <SelectItem key={marca} value={marca}>{marca}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="inactivo">Inactivo</SelectItem>
              <SelectItem value="descontinuado">Descontinuado</SelectItem>
              <SelectItem value="pedido_camino">En camino</SelectItem>
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
              Limpiar filtros
            </Button>
          )}

          <div className="ml-auto text-sm text-muted-foreground">
            {filteredProducts.length} de {products.length} productos
          </div>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Imagen</TableHead>
              <TableHead className="w-[100px]">SKU</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead className="w-[100px]">Precio</TableHead>
              <TableHead className="w-[80px]">Stock</TableHead>
              <TableHead className="w-[80px]">Estado</TableHead>
              <TableHead className="w-[60px]">Acciones</TableHead>
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
                    <div className="relative h-10 w-10 overflow-hidden rounded-md border flex-shrink-0">
                      {product.imagen_principal_url ? (
                        <Image
                          src={product.imagen_principal_url}
                          alt={product.nombre_comercial || product.pdt_descripcion || "Producto"}
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
                          N/D
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
                            Desc.
                          </Badge>
                        )}
                        {product.pedido_en_camino && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              <Package className="h-2.5 w-2.5 mr-0.5" />
                              En camino
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
                            {product.descuento_porcentaje}% DTO.
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
                      {product.is_active ? "Activo" : "Inactivo"}
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
                          Editar precio y descuento
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/products/${product.id}/editar`} className="flex items-center">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Edición avanzada
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
            <DialogTitle>Editar precio y descuento</DialogTitle>
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
                Si el descuento es mayor a 0, el producto aparecerá en Ofertas
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

            <div className="border-t pt-4 mt-2">
              <p className="text-sm font-medium mb-3">Precios para distribuidores</p>
              <div className="space-y-2">
                <Label htmlFor="precio-dist">Precio distribuidor ($)</Label>
                <Input
                  id="precio-dist"
                  type="number"
                  step="0.01"
                  value={editPrecioDist}
                  onChange={(e) => setEditPrecioDist(e.target.value)}
                  placeholder="Dejar vacío si no aplica"
                />
              </div>
              <div className="space-y-2 mt-2">
                <Label htmlFor="desc-dist">Descuento distribuidor del producto (%)</Label>
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
                  Aplica a TODOS los distribuidores en este producto, después de su propio descuento %
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceDialogOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSavePriceDiscount} disabled={isLoading} aria-label="Acción">
              {isLoading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
