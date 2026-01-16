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
        <circle cx="18" cy="22" r="9" stroke="#1e293b" strokeWidth="2.5" fill="none" />
        <circle cx="18" cy="22" r="4.5" stroke="#1e293b" strokeWidth="2.5" fill="none" opacity="0.6" />
        <path
          d="M25 14h8l-1.2 11.2a6.2 6.2 0 0 1-5.6 5.6l-1.2-16.8Z"
          stroke="#1e293b"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M28 14v-3" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M24.5 31h9" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span className="text-2xl font-bold tracking-tight text-slate-800">MESANOVA</span>
    </div>
  )
}
