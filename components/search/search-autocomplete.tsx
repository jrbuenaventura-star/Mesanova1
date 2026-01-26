"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2 } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import Image from "next/image"
import { trackSearch } from "@/components/clientify/clientify-tracking"
import { getImageKitUrl } from "@/lib/imagekit"

export function SearchAutocomplete() {
  const router = useRouter()
  const supabase = createClient()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const searchProducts = async () => {
      if (query.length < 2) {
        setResults([])
        setIsOpen(false)
        return
      }

      setIsLoading(true)
      setIsOpen(true)

      try {
        const { data } = await supabase
          .from("products")
          .select(`
            id,
            slug,
            nombre_comercial,
            pdt_descripcion,
            pdt_codigo,
            precio,
            imagen_principal_url,
            categories(
              is_primary,
              subcategory:subcategories(
                silo:silos(slug)
              )
            )
          `)
          .or(`nombre_comercial.ilike.%${query}%,pdt_descripcion.ilike.%${query}%,pdt_codigo.ilike.%${query}%`)
          .eq("is_active", true)
          .limit(8)

        setResults(data || [])
      } catch (error) {
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(searchProducts, 300)
    return () => clearTimeout(debounce)
  }, [query])

  const handleSelect = (product: any) => {
    const primaryCategory = product.categories?.find((c: any) => c.is_primary)
    const siloSlug = primaryCategory?.subcategory?.silo?.slug || "productos"
    router.push(`/productos/${siloSlug}/${product.slug}`)
    setQuery("")
    setIsOpen(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      // Rastrear búsqueda en Clientify
      trackSearch(query.trim(), results.length)
      router.push(`/buscar?q=${encodeURIComponent(query)}`)
      setIsOpen(false)
    }
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-sm">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar productos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-9 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </form>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-popover border rounded-md shadow-lg z-50">
          <Command>
            <CommandList>
              <CommandGroup heading="Productos">
                {results.map((product) => (
                  <CommandItem
                    key={product.id}
                    onSelect={() => handleSelect(product)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="relative h-10 w-10 flex-shrink-0 rounded border overflow-hidden">
                        {product.imagen_principal_url ? (
                          <Image
                            src={getImageKitUrl(product.imagen_principal_url, { width: 80, height: 80, quality: 70, format: "auto" })}
                            alt={product.nombre_comercial || product.pdt_descripcion}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-muted" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {product.nombre_comercial || product.pdt_descripcion}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.pdt_codigo} • ${product.precio?.toLocaleString("es-CO")}
                        </p>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute top-full mt-2 w-full bg-popover border rounded-md shadow-lg p-4 text-center text-sm text-muted-foreground z-50">
          No se encontraron productos
        </div>
      )}
    </div>
  )
}
