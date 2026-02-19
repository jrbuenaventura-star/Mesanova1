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
  const [productResults, setProductResults] = useState<any[]>([])
  const [blogResults, setBlogResults] = useState<any[]>([])
  const [giftListResults, setGiftListResults] = useState<any[]>([])
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
    const searchAll = async () => {
      if (query.length < 2) {
        setProductResults([])
        setBlogResults([])
        setGiftListResults([])
        setIsOpen(false)
        return
      }

      setIsLoading(true)
      setIsOpen(true)

      try {
        // Search products
        const { data: products } = await supabase
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
          .limit(5)

        // Search blog posts
        const { data: blogs } = await supabase
          .from("blog_posts")
          .select(`
            id,
            slug,
            title,
            excerpt,
            featured_image_url
          `)
          .ilike("title", `%${query}%`)
          .eq("status", "published")
          .limit(3)

        // Search gift lists (by title only)
        const { data: giftLists } = await supabase
          .from("gift_registries")
          .select(`
            id,
            name,
            share_token,
            event_date,
            status
          `)
          .ilike("name", `%${query}%`)
          .eq("status", "active")
          .limit(3)

        setProductResults(products || [])
        setBlogResults(blogs || [])
        setGiftListResults(giftLists || [])
      } catch (error) {
        setProductResults([])
        setBlogResults([])
        setGiftListResults([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(searchAll, 300)
    return () => clearTimeout(debounce)
  }, [query, supabase])

  const handleSelectProduct = (product: any) => {
    const primaryCategory = product.categories?.find((c: any) => c.is_primary)
    const siloSlug = primaryCategory?.subcategory?.silo?.slug || "productos"
    router.push(`/productos/${siloSlug}/${product.slug}`)
    setQuery("")
    setIsOpen(false)
  }

  const handleSelectBlog = (blog: any) => {
    router.push(`/blog/${blog.slug}`)
    setQuery("")
    setIsOpen(false)
  }

  const handleSelectGiftList = (giftList: any) => {
    if (!giftList.share_token) return
    router.push(`/lista/${giftList.share_token}`)
    setQuery("")
    setIsOpen(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      // Rastrear búsqueda en Clientify
      const totalResults = productResults.length + blogResults.length + giftListResults.length
      trackSearch(query.trim(), totalResults)
      router.push(`/buscar?q=${encodeURIComponent(query)}`)
      setIsOpen(false)
    }
  }

  const hasResults = productResults.length > 0 || blogResults.length > 0 || giftListResults.length > 0

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

      {isOpen && hasResults && (
        <div className="absolute top-full mt-2 w-full bg-popover border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          <Command>
            <CommandList>
              {productResults.length > 0 && (
                <CommandGroup heading="Productos">
                  {productResults.map((product) => (
                    <CommandItem
                      key={product.id}
                      onSelect={() => handleSelectProduct(product)}
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
              )}

              {blogResults.length > 0 && (
                <CommandGroup heading="Blog">
                  {blogResults.map((blog) => (
                    <CommandItem
                      key={blog.id}
                      onSelect={() => handleSelectBlog(blog)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{blog.title}</p>
                          {blog.excerpt && (
                            <p className="text-xs text-muted-foreground truncate">{blog.excerpt}</p>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {giftListResults.length > 0 && (
                <CommandGroup heading="Listas de Regalos">
                  {giftListResults.map((giftList) => (
                    <CommandItem
                      key={giftList.id}
                      onSelect={() => handleSelectGiftList(giftList)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{giftList.name}</p>
                          {giftList.event_date && (
                            <p className="text-xs text-muted-foreground">
                              Evento: {new Date(giftList.event_date).toLocaleDateString("es-CO")}
                            </p>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}

      {isOpen && query.length >= 2 && !hasResults && !isLoading && (
        <div className="absolute top-full mt-2 w-full bg-popover border rounded-md shadow-lg p-4 text-center text-sm text-muted-foreground z-50">
          No se encontraron resultados
        </div>
      )}
    </div>
  )
}
