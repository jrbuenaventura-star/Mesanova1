"use client"

import { useState } from "react"
import { Share2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

type ShareButtonProps = {
  url?: string
  title?: string
  text?: string
  label?: string
  iconOnly?: boolean
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
  className?: string
  disabled?: boolean
}

function toAbsoluteUrl(url?: string) {
  if (!url) return window.location.href
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  if (url.startsWith("/")) return `${window.location.origin}${url}`
  return `${window.location.origin}/${url}`
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  document.execCommand("copy")
  document.body.removeChild(textarea)
}

export function ShareButton({
  url,
  title,
  text,
  label = "Compartir",
  iconOnly = false,
  variant = "outline",
  size = "sm",
  className,
  disabled,
}: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = async () => {
    if (isSharing || disabled) return

    setIsSharing(true)
    const shareUrl = toAbsoluteUrl(url)

    try {
      if (navigator.share) {
        try {
          await navigator.share({
            title,
            text,
            url: shareUrl,
          })
          return
        } catch (error: unknown) {
          if (error instanceof Error && error.name === "AbortError") {
            return
          }
        }
      }

      await copyText(shareUrl)
      toast.success("Enlace copiado", {
        description: "Ahora puedes compartirlo donde quieras.",
      })
    } catch {
      toast.error("No se pudo compartir", {
        description: "Intenta nuevamente.",
      })
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || isSharing}
      onClick={handleShare}
      aria-label={iconOnly ? label : undefined}
    >
      <Share2 className={iconOnly ? "h-4 w-4" : "h-4 w-4 mr-2"} />
      {!iconOnly ? label : null}
    </Button>
  )
}
