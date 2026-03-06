import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Politica de Cookies",
  description: "Politica de cookies y preferencias de consentimiento de Mesanova",
}

export default function CookiesPolicyPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Politica de Cookies</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Ultima actualizacion: 6 de marzo de 2026.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">Categorias</h2>
        <p className="text-sm text-muted-foreground">
          Cookies necesarias: autenticacion y funciones esenciales. Cookies de analitica: medicion de uso y rendimiento. Cookies de
          marketing: personalizacion comercial y medicion publicitaria.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">Gestion del consentimiento</h2>
        <p className="text-sm text-muted-foreground">
          Puedes aceptar o rechazar categorias opcionales desde el banner de privacidad. Tu eleccion se guarda y puede modificarse
          posteriormente.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">Revocatoria</h2>
        <p className="text-sm text-muted-foreground">
          Para revocar el consentimiento, abre de nuevo la configuracion de privacidad y actualiza tus preferencias.
        </p>
      </section>
    </main>
  )
}
