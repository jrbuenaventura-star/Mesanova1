"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Star, ThumbsUp, ThumbsDown, CheckCircle, ChevronDown } from "lucide-react"
import { voteReview } from "@/lib/db/user-features-client"
import { useToast } from "@/hooks/use-toast"

interface Review {
  id: string
  rating: number
  title: string | null
  review_text: string | null
  images: string[]
  is_verified_purchase: boolean
  helpful_count: number
  not_helpful_count: number
  created_at: string
  user: { full_name: string | null } | null
}

interface RatingStats {
  average: number
  total: number
  distribution: { 1: number; 2: number; 3: number; 4: number; 5: number }
}

interface ProductReviewsProps {
  productId: string
  reviews: Review[]
  stats: RatingStats
  currentUserId?: string
}

export function ProductReviews({ productId, reviews, stats, currentUserId }: ProductReviewsProps) {
  const [showAll, setShowAll] = useState(false)
  const { toast } = useToast()

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const renderStars = (rating: number, size = "h-4 w-4") => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${size} ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ))
  }

  const handleVote = async (reviewId: string, isHelpful: boolean) => {
    if (!currentUserId) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para votar",
        variant: "destructive",
      })
      return
    }

    try {
      await voteReview(currentUserId, reviewId, isHelpful)
      toast({
        title: "Gracias por tu voto",
        description: "Tu opinión nos ayuda a mejorar",
      })
    } catch {
      toast({
        title: "Error",
        description: "No se pudo registrar tu voto",
        variant: "destructive",
      })
    }
  }

  if (stats.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reseñas de Clientes</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Star className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">
            Este producto aún no tiene reseñas
          </p>
          <p className="text-sm text-muted-foreground">
            Sé el primero en compartir tu experiencia
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reseñas de Clientes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Summary */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Average Rating */}
          <div className="text-center md:text-left">
            <div className="text-5xl font-bold">{stats.average}</div>
            <div className="flex justify-center md:justify-start mt-2">
              {renderStars(Math.round(stats.average), "h-5 w-5")}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.total} reseña{stats.total !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.distribution[rating as keyof typeof stats.distribution]
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0

              return (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm w-12">{rating} ★</span>
                  <Progress value={percentage} className="h-2 flex-1" />
                  <span className="text-sm text-muted-foreground w-8">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4 pt-4 border-t">
          {displayedReviews.map((review) => (
            <div key={review.id} className="pb-4 border-b last:border-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex">{renderStars(review.rating)}</div>
                    {review.is_verified_purchase && (
                      <Badge variant="outline" className="text-green-600 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Compra verificada
                      </Badge>
                    )}
                  </div>
                  {review.title && (
                    <h4 className="font-medium mt-1">{review.title}</h4>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(review.created_at)}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-2">
                Por {review.user?.full_name || "Usuario"}
              </p>

              {review.review_text && (
                <p className="text-sm mb-3">{review.review_text}</p>
              )}

              {/* Helpful Votes */}
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">¿Te resultó útil?</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => handleVote(review.id, true)}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  {review.helpful_count}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => handleVote(review.id, false)}
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  {review.not_helpful_count}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Show More Button */}
        {reviews.length > 3 && !showAll && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowAll(true)}
          >
            <ChevronDown className="h-4 w-4 mr-2" />
            Ver todas las reseñas ({reviews.length})
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
