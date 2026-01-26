"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getImageKitUrl } from "@/lib/imagekit"

interface ProductImageGalleryProps {
  images: { url: string; alt: string }[]
  productName: string
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Sin imagen</p>
      </div>
    )
  }

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="space-y-4">
      {/* Imagen principal */}
      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
        <Image
          src={
            images[selectedIndex].url
              ? getImageKitUrl(images[selectedIndex].url, { width: 1200, height: 1200, quality: 85, format: "auto" })
              : "/placeholder.svg"
          }
          alt={images[selectedIndex].alt || productName}
          fill
          className="object-contain"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {/* Botones de navegación */}
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Indicador de imagen */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === selectedIndex ? "bg-primary w-6" : "bg-primary/30 hover:bg-primary/50",
                )}
                onClick={() => setSelectedIndex(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Miniaturas */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              className={cn(
                "relative aspect-square rounded-lg overflow-hidden border-2 transition-colors",
                index === selectedIndex ? "border-primary" : "border-transparent hover:border-primary/50",
              )}
              onClick={() => setSelectedIndex(index)}
            >
              <Image
                src={image.url ? getImageKitUrl(image.url, { width: 250, height: 250, quality: 75, format: "auto" }) : "/placeholder.svg"}
                alt={image.alt || `${productName} - imagen ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 25vw, 12vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
