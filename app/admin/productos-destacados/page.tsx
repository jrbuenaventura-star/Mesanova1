"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { ChefHat, UtensilsCrossed, Coffee, Briefcase, Plus, Trash2, Search, ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

const silos = [
  { slug: "cocina", name: "Cocina", icon: ChefHat },
  { slug: "mesa", name: "Mesa", icon: UtensilsCrossed },
  { slug: "cafe-te-bar", name: "Café, Té y Bar", icon: Coffee },
  { slug: "profesional", name: "HoReCa", icon: Briefcase },
]

export default function ProductosDestacadosPage() {
  const [selectedSilo, setSelectedSilo] = useState(silos[0].slug)
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadFeaturedProducts()
  }, [selectedSilo])

  const loadFeaturedProducts = async () => {
    const supabase = createClient()
    
    const { data: silo } = await supabase
      .from('silos')
      .select('id')
      .eq('slug', selectedSilo)
      .single()
    
    if (!silo) return

    const { data } = await supabase
      .from('featured_category_products')
      .select(`
        id,
        order_index,
        is_active,
        product:products (
          id,
          pdt_codigo,
          nombre_comercial,
          pdt_descripcion,
          precio,
          imagen_principal_url
        )
      `)
      .eq('silo_id', silo.id)
      .order('order_index', { ascending: true })

    setFeaturedProducts(data || [])
  }

  const searchProducts = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    const supabase = createClient()
    
    const { data } = await supabase
      .from('products')
      .select('id, pdt_codigo, nombre_comercial, pdt_descripcion, precio, imagen_principal_url')
      .or(`pdt_codigo.ilike.%${searchQuery}%,nombre_comercial.ilike.%${searchQuery}%,pdt_descripcion.ilike.%${searchQuery}%`)
      .limit(10)

    setSearchResults(data || [])
    setLoading(false)
  }

  const addFeaturedProduct = async (productId: string) => {
    const supabase = createClient()
    
    const { data: silo } = await supabase
      .from('silos')
      .select('id')
      .eq('slug', selectedSilo)
      .single()
    
    if (!silo) return

    const maxOrder = featuredProducts.length > 0 
      ? Math.max(...featuredProducts.map(p => p.order_index))
      : 0

    const { error } = await supabase
      .from('featured_category_products')
      .insert({
        silo_id: silo.id,
        product_id: productId,
        order_index: maxOrder + 1,
        is_active: true
      })

    if (error) {
      if (error.code === '23505') {
        toast.error('Este producto ya está destacado en esta categoría')
      } else {
        toast.error('Error al agregar producto destacado')
      }
      return
    }

    toast.success('Producto agregado a destacados')
    setSearchQuery("")
    setSearchResults([])
    loadFeaturedProducts()
  }

  const removeFeaturedProduct = async (id: string) => {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('featured_category_products')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Error al eliminar producto destacado')
      return
    }

    toast.success('Producto eliminado de destacados')
    loadFeaturedProducts()
  }

  const moveProduct = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = featuredProducts.findIndex(p => p.id === id)
    if (currentIndex === -1) return
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= featuredProducts.length) return

    const supabase = createClient()
    const current = featuredProducts[currentIndex]
    const target = featuredProducts[targetIndex]

    await supabase
      .from('featured_category_products')
      .update({ order_index: target.order_index })
      .eq('id', current.id)

    await supabase
      .from('featured_category_products')
      .update({ order_index: current.order_index })
      .eq('id', target.id)

    loadFeaturedProducts()
  }

  const currentSilo = silos.find(s => s.slug === selectedSilo)
  const Icon = currentSilo?.icon || ChefHat

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Productos Destacados por Categoría</h1>
        <p className="text-muted-foreground">
          Gestiona los productos que aparecen destacados en cada categoría de la página /productos
        </p>
      </div>

      {/* Selector de Categoría */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Categoría</CardTitle>
          <CardDescription>Elige la categoría para gestionar sus productos destacados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {silos.map((silo) => {
              const SiloIcon = silo.icon
              return (
                <Button
                  key={silo.slug}
                  variant={selectedSilo === silo.slug ? "default" : "outline"}
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setSelectedSilo(silo.slug)}
                >
                  <SiloIcon className="h-6 w-6" />
                  <span>{silo.name}</span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Buscar y Agregar Productos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            Agregar Producto a {currentSilo?.name}
          </CardTitle>
          <CardDescription>
            Busca productos por código, nombre o descripción (máximo 4 productos destacados por categoría)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Buscar producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchProducts()}
              />
            </div>
            <Button onClick={searchProducts} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
              {searchResults.map((product) => (
                <div key={product.id} className="p-4 flex items-center gap-4 hover:bg-muted/50">
                  <div className="w-16 h-16 bg-muted rounded flex-shrink-0 relative overflow-hidden">
                    {product.imagen_principal_url ? (
                      <Image
                        src={product.imagen_principal_url}
                        alt={product.nombre_comercial || product.pdt_descripcion}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {product.nombre_comercial || product.pdt_descripcion}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Código: {product.pdt_codigo}
                    </p>
                    {product.precio && (
                      <p className="text-sm font-semibold text-primary">
                        ${Number(product.precio).toLocaleString('es-CO')}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addFeaturedProduct(product.id)}
                    disabled={featuredProducts.length >= 4}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Productos Destacados */}
      <Card>
        <CardHeader>
          <CardTitle>
            Productos Destacados en {currentSilo?.name}
            <Badge variant="secondary" className="ml-2">
              {featuredProducts.length}/4
            </Badge>
          </CardTitle>
          <CardDescription>
            Arrastra o usa las flechas para reordenar los productos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {featuredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p>No hay productos destacados en esta categoría</p>
              <p className="text-sm">Usa el buscador para agregar productos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {featuredProducts.map((item, index) => {
                const product = item.product
                return (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 flex items-center gap-4 hover:bg-muted/50"
                  >
                    <div className="flex flex-col gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => moveProduct(item.id, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => moveProduct(item.id, 'down')}
                        disabled={index === featuredProducts.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="w-20 h-20 bg-muted rounded flex-shrink-0 relative overflow-hidden">
                      {product.imagen_principal_url ? (
                        <Image
                          src={product.imagen_principal_url}
                          alt={product.nombre_comercial || product.pdt_descripcion}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {product.nombre_comercial || product.pdt_descripcion}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Código: {product.pdt_codigo}
                      </p>
                      {product.precio && (
                        <p className="text-sm font-semibold text-primary">
                          ${Number(product.precio).toLocaleString('es-CO')}
                        </p>
                      )}
                    </div>

                    <Badge variant="outline">Orden: {item.order_index}</Badge>

                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => removeFeaturedProduct(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
