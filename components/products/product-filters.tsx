"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, SlidersHorizontal } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

interface ProductFiltersProps {
  subcategories?: Array<{ id: string; name: string; slug: string }>
  materials?: string[]
  colors?: string[]
  brands?: string[]
  priceRange?: { min: number; max: number }
  onFilterChange: (filters: FilterState) => void
}

export interface FilterState {
  subcategories: string[]
  materials: string[]
  colors: string[]
  brands: string[]
  priceRange: [number, number]
  inStock: boolean
  onSale: boolean
}

export function ProductFilters({ subcategories = [], materials = [], colors = [], brands = [], priceRange, onFilterChange }: ProductFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    subcategories: [],
    materials: [],
    colors: [],
    brands: [],
    priceRange: [priceRange?.min || 0, priceRange?.max || 1000000],
    inStock: false,
    onSale: false,
  })

  const handleSubcategoryToggle = (subcategoryId: string) => {
    const newSubcategories = filters.subcategories.includes(subcategoryId)
      ? filters.subcategories.filter((id) => id !== subcategoryId)
      : [...filters.subcategories, subcategoryId]

    const newFilters = { ...filters, subcategories: newSubcategories }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handlePriceChange = (value: number[]) => {
    const newFilters = { ...filters, priceRange: [value[0], value[1]] as [number, number] }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleCheckboxChange = (key: "inStock" | "onSale", checked: boolean) => {
    const newFilters = { ...filters, [key]: checked }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleFilterToggle = (key: 'materials' | 'colors' | 'brands', value: string) => {
    const currentValues = filters[key]
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value]

    const newFilters = { ...filters, [key]: newValues }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const defaultFilters: FilterState = {
      subcategories: [],
      materials: [],
      colors: [],
      brands: [],
      priceRange: [priceRange?.min || 0, priceRange?.max || 1000000],
      inStock: false,
      onSale: false,
    }
    setFilters(defaultFilters)
    onFilterChange(defaultFilters)
  }

  const activeFiltersCount =
    filters.subcategories.length +
    filters.materials.length +
    filters.colors.length +
    filters.brands.length +
    (filters.inStock ? 1 : 0) +
    (filters.onSale ? 1 : 0) +
    (filters.priceRange[0] !== (priceRange?.min || 0) || filters.priceRange[1] !== (priceRange?.max || 1000000)
      ? 1
      : 0)

  const FilterContent = () => (
    <div className="space-y-6">
      {subcategories.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Subcategorías</h3>
          <div className="space-y-2">
            {subcategories.map((subcat) => (
              <div key={subcat.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`subcat-${subcat.id}`}
                  checked={filters.subcategories.includes(subcat.id)}
                  onCheckedChange={() => handleSubcategoryToggle(subcat.id)}
                />
                <Label htmlFor={`subcat-${subcat.id}`} className="text-sm cursor-pointer">
                  {subcat.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {materials.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Material</h3>
          <div className="space-y-2">
            {materials.map((material) => (
              <div key={material} className="flex items-center space-x-2">
                <Checkbox
                  id={`material-${material}`}
                  checked={filters.materials.includes(material)}
                  onCheckedChange={() => handleFilterToggle('materials', material)}
                />
                <Label htmlFor={`material-${material}`} className="text-sm cursor-pointer">
                  {material}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Color</h3>
          <div className="space-y-2">
            {colors.map((color) => (
              <div key={color} className="flex items-center space-x-2">
                <Checkbox
                  id={`color-${color}`}
                  checked={filters.colors.includes(color)}
                  onCheckedChange={() => handleFilterToggle('colors', color)}
                />
                <Label htmlFor={`color-${color}`} className="text-sm cursor-pointer">
                  {color}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {brands.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Marca</h3>
          <div className="space-y-2">
            {brands.map((brand) => (
              <div key={brand} className="flex items-center space-x-2">
                <Checkbox
                  id={`brand-${brand}`}
                  checked={filters.brands.includes(brand)}
                  onCheckedChange={() => handleFilterToggle('brands', brand)}
                />
                <Label htmlFor={`brand-${brand}`} className="text-sm cursor-pointer">
                  {brand}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {priceRange && (
        <div>
          <h3 className="font-semibold mb-3">Rango de Precio</h3>
          <div className="space-y-4">
            <Slider
              min={priceRange.min}
              max={priceRange.max}
              step={1000}
              value={filters.priceRange}
              onValueChange={handlePriceChange}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>${filters.priceRange[0].toLocaleString("es-CO")}</span>
              <span>${filters.priceRange[1].toLocaleString("es-CO")}</span>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-3">Disponibilidad</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="inStock"
              checked={filters.inStock}
              onCheckedChange={(checked) => handleCheckboxChange("inStock", checked as boolean)}
            />
            <Label htmlFor="inStock" className="text-sm cursor-pointer">
              En stock
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="onSale"
              checked={filters.onSale}
              onCheckedChange={(checked) => handleCheckboxChange("onSale", checked as boolean)}
            />
            <Label htmlFor="onSale" className="text-sm cursor-pointer">
              En oferta
            </Label>
          </div>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Limpiar filtros ({activeFiltersCount})
        </Button>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden lg:block">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Filtros</span>
              {activeFiltersCount > 0 && <Badge variant="secondary">{activeFiltersCount}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FilterContent />
          </CardContent>
        </Card>
      </div>

      {/* Mobile Filters */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
