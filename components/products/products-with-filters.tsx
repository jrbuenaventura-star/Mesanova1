"use client"

import { useState, useMemo } from "react"
import { ProductFilters, FilterState } from "@/components/products/product-filters"
import { ProductCard } from "@/components/products/product-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package } from "lucide-react"
import Link from "next/link"

interface ProductsWithFiltersProps {
  products: any[]
  subcategories: Array<{ id: string; name: string; slug: string }>
  siloSlug: string
}

export function ProductsWithFilters({ products, subcategories, siloSlug }: ProductsWithFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    subcategories: [],
    materials: [],
    colors: [],
    brands: [],
    priceRange: [0, 1000000],
    inStock: false,
    onSale: false,
  })

  // Calcular rango de precios de los productos
  const priceRange = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 1000000 }
    const prices = products.map((p) => p.precio || 0).filter((p) => p > 0)
    return {
      min: Math.floor(Math.min(...prices) / 1000) * 1000,
      max: Math.ceil(Math.max(...prices) / 1000) * 1000,
    }
  }, [products])

  // Extraer valores únicos de Material, Color y Marca
  const uniqueValues = useMemo(() => {
    const materials = new Set<string>()
    const colors = new Set<string>()
    const brands = new Set<string>()

    products.forEach((product) => {
      if (product.material) materials.add(product.material)
      if (product.color) colors.add(product.color)
      if (product.marca) brands.add(product.marca)
    })

    return {
      materials: Array.from(materials).sort(),
      colors: Array.from(colors).sort(),
      brands: Array.from(brands).sort(),
    }
  }, [products])

  // Aplicar filtros a los productos
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Filtro por subcategorías
      if (filters.subcategories.length > 0) {
        const productSubcategories = product.categories
          ?.map((c: any) => c.subcategory?.id)
          .filter(Boolean)
        const hasMatchingSubcategory = filters.subcategories.some((subId) =>
          productSubcategories?.includes(subId)
        )
        if (!hasMatchingSubcategory) return false
      }

      // Filtro por rango de precio
      const price = product.precio || 0
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false
      }

      // Filtro por stock
      if (filters.inStock) {
        const totalStock = product.warehouse_stock?.reduce(
          (sum: number, ws: any) => sum + (ws.available_quantity || 0),
          0
        )
        if (!totalStock || totalStock <= 0) return false
      }

      // Filtro por ofertas
      if (filters.onSale && !product.is_on_sale) {
        return false
      }

      // Filtro por material
      if (filters.materials.length > 0) {
        if (!product.material || !filters.materials.includes(product.material)) {
          return false
        }
      }

      // Filtro por color
      if (filters.colors.length > 0) {
        if (!product.color || !filters.colors.includes(product.color)) {
          return false
        }
      }

      // Filtro por marca
      if (filters.brands.length > 0) {
        if (!product.marca || !filters.brands.includes(product.marca)) {
          return false
        }
      }

      return true
    })
  }, [products, filters])

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      <div className="lg:col-span-1">
        <ProductFilters
          subcategories={subcategories}
          materials={uniqueValues.materials}
          colors={uniqueValues.colors}
          brands={uniqueValues.brands}
          priceRange={priceRange}
          onFilterChange={setFilters}
        />
      </div>

      <div className="lg:col-span-3">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} producto{filteredProducts.length !== 1 ? "s" : ""} encontrado
            {filteredProducts.length !== 1 ? "s" : ""}
          </p>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <Card className="p-12">
            <div className="text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay productos disponibles</h3>
              <p className="text-muted-foreground mb-4">
                No se encontraron productos con los filtros seleccionados. Intenta ajustar los filtros.
              </p>
              <Button asChild variant="outline">
                <Link href={`/productos/${siloSlug}`}>Ver todas las subcategorías</Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
