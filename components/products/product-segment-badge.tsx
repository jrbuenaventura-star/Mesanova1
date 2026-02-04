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
        "font-semibold text-[10px] sm:text-xs gap-0.5 sm:gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1",
        variantClass,
        className
      )}
    >
      {showIcon && <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
      <span className="whitespace-nowrap">{label}</span>
    </Badge>
  )
}
