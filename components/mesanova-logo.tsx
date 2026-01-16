export interface MesanovaLogoProps {
  className?: string
}

export function MesanovaLogo({ className = "" }: MesanovaLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width="44"
        height="44"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-slate-700"
        role="img"
        aria-label="Mesanova Icon"
      >
        <circle cx="20" cy="20" r="18" fill="#1e293b" opacity="0.15" />
        <circle cx="20" cy="20" r="12" stroke="#1e293b" strokeWidth="2.5" fill="none" />
        <line x1="20" y1="13" x2="20" y2="27" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="13" y1="20" x2="27" y2="20" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span className="text-2xl font-bold tracking-tight text-slate-800">MESANOVA</span>
    </div>
  )
}
