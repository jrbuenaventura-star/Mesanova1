-- Create blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  author_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blog categories table
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create many-to-many relationship between posts and categories
CREATE TABLE IF NOT EXISTS blog_post_categories (
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES blog_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_post_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_post_updated_at();

-- Insert default blog categories based on Alumar structure
INSERT INTO blog_categories (name, slug, description) VALUES
  ('General', 'general', 'Artículos generales sobre decoración y mesa'),
  ('Tendencias', 'tendencias', 'Las últimas tendencias en decoración de mesa'),
  ('Historia y Cultura', 'historia-cultura', 'Historia de los objetos de mesa'),
  ('Consejos y Tips', 'consejos-tips', 'Consejos prácticos para el hogar'),
  ('Productos Destacados', 'productos-destacados', 'Spotlight de productos especiales')
ON CONFLICT (slug) DO NOTHING;

-- Sample blog post structure (content should be migrated from original site)
INSERT INTO blog_posts (slug, title, excerpt, content, status, published_at) VALUES
  (
    'la-importancia-olvidada-de-la-manteleria',
    'La Importancia Olvidada de la Mantelería',
    'El mantel es mucho más que un simple protector; es la base de la decoración, la primera impresión en cualquier comida.',
    '[CONTENIDO A MIGRAR DESDE ALUMARONLINE.COM]',
    'draft',
    '2024-12-04T00:00:00Z'
  ),
  (
    'tendencias-de-navidad-2025',
    'Tendencias de Navidad 2025 para vestir su mesa',
    'La Navidad de este año llega con propuestas muy definidas que permiten transformar la mesa según el estilo de cada hogar.',
    '[CONTENIDO A MIGRAR DESDE ALUMARONLINE.COM]',
    'draft',
    '2024-12-02T00:00:00Z'
  ),
  (
    'gallinita-salero-vintage',
    'Gallinita salero vintage: el clásico de mesa que nos conecta con nuestros recuerdos',
    'Hay piezas que jamás desaparecen del todo. Simplemente esperan a ser redescubiertas.',
    '[CONTENIDO A MIGRAR DESDE ALUMARONLINE.COM]',
    'draft',
    '2024-12-02T00:00:00Z'
  ),
  (
    'el-dia-que-una-duquesa-tuvo-hambre',
    'El día en que una duquesa tuvo hambre… y nació el étagère',
    'Hay objetos que parecieran estar en la mesa desde siempre, pero todos tienen un origen.',
    '[CONTENIDO A MIGRAR DESDE ALUMARONLINE.COM]',
    'draft',
    '2024-11-28T00:00:00Z'
  ),
  (
    'vajilla-blanca-el-punto-de-partida',
    'Vajilla blanca: el punto de partida para cualquier mesa',
    'Si solo pudiera tener una vajilla en casa, debería ser una buena vajilla blanca.',
    '[CONTENIDO A MIGRAR DESDE ALUMARONLINE.COM]',
    'draft',
    '2024-11-27T00:00:00Z'
  ),
  (
    'platos-de-vidrio-tendencia',
    'Tendencia: Platos base y de servir en vidrio',
    'Una categoría que se ha convertido en protagonista de las mesas contemporáneas.',
    '[CONTENIDO A MIGRAR DESDE ALUMARONLINE.COM]',
    'draft',
    '2024-11-25T00:00:00Z'
  )
ON CONFLICT (slug) DO NOTHING;

-- Link sample posts to 'General' category
INSERT INTO blog_post_categories (post_id, category_id)
SELECT bp.id, bc.id
FROM blog_posts bp
CROSS JOIN blog_categories bc
WHERE bc.slug = 'general'
ON CONFLICT DO NOTHING;
