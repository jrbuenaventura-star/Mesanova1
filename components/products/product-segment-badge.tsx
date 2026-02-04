import { Badge } from "@/components/ui/badge"
import { Star, Diamond, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductSegmentBadgeProps {
  segment?: 'core' | 'value' | 'premium'
  className?: string
  showIcon?: boolean
}

export function ProductSegmentBadge({ 
  segment, 
  className,
  showIcon = true 
}: ProductSegmentBadgeProps) {
  if (!segment || segment === 'core') {
    return null
  }

  const config = {
    value: {
      label: 'Recomendado',
      icon: Star,
      className: 'bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/20',
    },
    premium: {
      label: 'Premium',
      icon: Diamond,
      className: 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800',
    },
  }

  const { label, icon: Icon, className: variantClass } = config[segment]

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-semibold text-xs gap-1",
        variantClass,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {label}
    </Badge>
  )
}
