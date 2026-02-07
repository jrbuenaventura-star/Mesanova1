import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mesanova.co'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/perfil/',
          '/aliado/',
          '/distributor/',
          '/checkout/',
          '/carrito/',
          '/buscar/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
