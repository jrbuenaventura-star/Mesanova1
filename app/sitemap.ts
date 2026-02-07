import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mesanova.co'
  const supabase = await createClient()

  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/productos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ofertas`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/nosotros/sobre-mesanova`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/nosotros/por-que-elegirnos`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contacto/mayoristas`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contacto/minoristas`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contacto/institucional`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contacto/cliente-final`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  // Blog posts dinámicos
  let blogPages: MetadataRoute.Sitemap = []
  try {
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('status', 'published')
    
    if (posts) {
      blogPages = posts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    }
  } catch (e) {
    console.error('Sitemap: error fetching blog posts', e)
  }

  // Categorías de productos (silos)
  let siloPages: MetadataRoute.Sitemap = []
  try {
    const { data: silos } = await supabase
      .from('silos')
      .select('slug, updated_at')
      .eq('is_active', true)

    if (silos) {
      siloPages = silos.map((silo) => ({
        url: `${baseUrl}/productos/${silo.slug}`,
        lastModified: new Date(silo.updated_at),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }))
    }
  } catch (e) {
    console.error('Sitemap: error fetching silos', e)
  }

  // Productos individuales
  let productPages: MetadataRoute.Sitemap = []
  try {
    const { data: products } = await supabase
      .from('products')
      .select(`
        slug,
        updated_at,
        categories(
          is_primary,
          subcategory:subcategories(
            silo:silos(slug)
          )
        )
      `)
      .eq('is_active', true)
      .not('slug', 'is', null)
      .limit(5000)

    if (products) {
      productPages = products
        .filter((p: any) => p.slug)
        .map((product: any) => {
          const primaryCat = product.categories?.find((c: any) => c.is_primary)
          const siloSlug = primaryCat?.subcategory?.silo?.slug || 'productos'
          return {
            url: `${baseUrl}/productos/${siloSlug}/${product.slug}`,
            lastModified: new Date(product.updated_at),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
          }
        })
    }
  } catch (e) {
    console.error('Sitemap: error fetching products', e)
  }

  return [...staticPages, ...siloPages, ...productPages, ...blogPages]
}
