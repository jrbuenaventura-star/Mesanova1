import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mesanova Delivery",
    short_name: "Mesanova",
    description: "Confirmación de entrega QR con soporte offline para operación logística omnicanal.",
    start_url: "/admin/ordenes?tab=confirmacion-entrega-qr",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111827",
    orientation: "portrait",
    lang: "es-CO",
    icons: [
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/icon-light-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
  }
}
