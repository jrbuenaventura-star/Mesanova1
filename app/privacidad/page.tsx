import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Politica de Tratamiento de Datos",
  description: "Politica de tratamiento de datos personales de Mesanova",
}

export default function PrivacyPolicyPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Politica de Tratamiento de Datos</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Ultima actualizacion: 6 de marzo de 2026.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">1. Responsable del tratamiento</h2>
        <p className="text-sm text-muted-foreground">
          Mesanova actua como responsable del tratamiento de datos personales recolectados en sus canales digitales.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">2. Finalidades</h2>
        <p className="text-sm text-muted-foreground">
          Gestion de compras y entregas, soporte y PQRS, prevencion de fraude, cumplimiento legal, analitica y comunicaciones
          comerciales cuando exista autorizacion valida.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">3. Derechos del titular</h2>
        <p className="text-sm text-muted-foreground">
          Puedes solicitar acceso, actualizacion, rectificacion, supresion, portabilidad y revocatoria del consentimiento.
          Tambien puedes oponerte o restringir el tratamiento en los casos aplicables.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">4. Canales para ejercer derechos</h2>
        <p className="text-sm text-muted-foreground">
          Desde tu sesion puedes usar los endpoints de privacidad para exportar tu informacion y crear solicitudes de supresion.
          Si no tienes acceso, escribe al canal oficial de soporte de Mesanova.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">5. Transferencias a terceros</h2>
        <p className="text-sm text-muted-foreground">
          Mesanova utiliza proveedores de infraestructura, analitica, mensajeria y CRM con medidas de seguridad y controles de
          minimizacion de datos.
        </p>
      </section>
    </main>
  )
}
