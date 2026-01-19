import Image from "next/image"

export interface MesanovaLogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
}

export function MesanovaLogo({ className = "", showText = true, size = "md" }: MesanovaLogoProps) {
  const sizes = {
    sm: { logo: 32, text: "text-lg" },
    md: { logo: 44, text: "text-2xl" },
    lg: { logo: 60, text: "text-3xl" },
  }

  const currentSize = sizes[size]

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image
        src="/mesanova-isotipo.svg"
        alt="Mesanova"
        width={currentSize.logo}
        height={currentSize.logo * 1.1}
        className="object-contain"
        priority
      />
      {showText && (
        <div className="hidden sm:flex flex-col">
          <span className={`${currentSize.text} font-serif font-normal tracking-wide text-[#A84A35]`}>
            Mesanova
          </span>
        </div>
      )}
    </div>
  )
}

export function MesanovaLogoFull({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <Image
        src="/mesanova-logo.svg"
        alt="Mesanova - Miles de opciones para tu mesa y cocina"
        width={320}
        height={100}
        className="object-contain"
        priority
      />
    </div>
  )
}
