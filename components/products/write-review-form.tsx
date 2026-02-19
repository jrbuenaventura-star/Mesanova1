"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Star, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface WriteReviewFormProps {
  productId: string
  userId?: string
  onReviewSubmitted?: () => void
}

export function WriteReviewForm({ productId, userId, onReviewSubmitted }: WriteReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState("")
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId) {
      toast.error("Debes iniciar sesión para escribir una reseña")
      return
    }

    if (rating === 0) {
      toast.error("Por favor selecciona una calificación")
      return
    }

    if (!comment.trim()) {
      toast.error("Por favor escribe un comentario")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim() || null,
          comment: comment.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Error al enviar reseña")
      }

      toast.success("¡Reseña enviada!", {
        description: "Gracias por compartir tu opinión"
      })

      setRating(0)
      setTitle("")
      setComment("")
      
      if (onReviewSubmitted) {
        onReviewSubmitted()
      }
    } catch (error) {
      toast.error("Error al enviar reseña", {
        description: "Por favor intenta nuevamente"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Escribe una Reseña</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            Inicia sesión para escribir una reseña
          </p>
          <Button asChild>
            <Link href="/auth/login">Iniciar sesión</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Escribe una Reseña</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div className="space-y-2">
            <Label>Calificación *</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                  aria-label={`Calificar con ${star} estrella${star === 1 ? "" : "s"}`}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título (opcional)</Label>
            <Input
              id="title"
              placeholder="Resume tu experiencia"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comentario *</Label>
            <Textarea
              id="comment"
              placeholder="Cuéntanos sobre tu experiencia con este producto..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              maxLength={1000}
              required
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/1000 caracteres
            </p>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitting || rating === 0} className="w-full" aria-label="Enviar">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Publicar Reseña"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
