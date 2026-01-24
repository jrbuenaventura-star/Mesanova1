"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface BannerSlide {
  id: string
  title: string
  subtitle?: string
  description?: string
  image_url: string
  cta_text?: string
  cta_link?: string
  background_color?: string
  text_color?: string
}

interface HeroCarouselProps {
  slides: BannerSlide[]
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000) // Cambiar cada 5 segundos

    return () => clearInterval(interval)
  }, [isAutoPlaying, slides.length])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000) // Reanudar autoplay después de 10s
  }

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % slides.length)
  }

  const prevSlide = () => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length)
  }

  if (slides.length === 0) {
    return (
      <section className="relative py-20 md:py-32 px-4 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Artículos para Cocina y Mesa
          </h1>
          <p className="text-xl text-muted-foreground">
            Calidad premium desde 1995
          </p>
        </div>
      </section>
    )
  }

  const slide = slides[currentSlide]

  return (
    <section 
      className="relative h-[500px] md:h-[700px] overflow-hidden"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Slides */}
      <div className="relative h-full">
        {slides.map((s, index) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Imagen de fondo */}
            <div className="absolute inset-0">
              <Image
                src={s.image_url}
                alt={s.title}
                fill
                className="object-cover"
                priority={index === 0}
              />
              {/* Overlay oscuro */}
              <div 
                className="absolute inset-0" 
                style={{ 
                  backgroundColor: s.background_color || '#000000',
                  opacity: 0.5 
                }}
              />
            </div>

            {/* Contenido */}
            <div className="relative h-full container mx-auto px-4 flex items-center">
              <div className="max-w-3xl space-y-6" style={{ color: s.text_color || '#FFFFFF' }}>
                {s.subtitle && (
                  <Badge className="w-fit" variant="secondary">
                    {s.subtitle}
                  </Badge>
                )}
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                  {s.title}
                </h1>
                {s.description && (
                  <p className="text-lg md:text-xl opacity-90 max-w-2xl">
                    {s.description}
                  </p>
                )}
                {s.cta_text && s.cta_link && (
                  <div className="pt-4">
                    <Button size="lg" asChild className="text-lg">
                      <Link href={s.cta_link}>
                        {s.cta_text}
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controles de navegación */}
      {slides.length > 1 && (
        <>
          {/* Flechas */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all"
            aria-label="Siguiente slide"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>

          {/* Indicadores (dots) */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Ir al slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
