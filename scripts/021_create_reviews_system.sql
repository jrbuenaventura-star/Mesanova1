-- =====================================================
-- SISTEMA DE REVIEWS Y RATINGS DE PRODUCTOS
-- =====================================================

-- Tabla principal de reviews
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Calificación y contenido
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  
  -- Verificación de compra
  verified_purchase BOOLEAN DEFAULT false,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Imágenes de la review (URLs de Supabase Storage)
  images JSONB, -- Array de URLs: ["url1", "url2", ...]
  
  -- Utilidad de la review (votos)
  helpful_count INTEGER DEFAULT 0 CHECK (helpful_count >= 0),
  not_helpful_count INTEGER DEFAULT 0 CHECK (not_helpful_count >= 0),
  
  -- Estado y moderación
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')),
  moderation_notes TEXT,
  moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  
  -- Respuesta del vendedor
  seller_response TEXT,
  seller_response_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON product_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_reviews_verified ON product_reviews(verified_purchase);

-- Tabla de votos de utilidad de reviews
CREATE TABLE IF NOT EXISTS review_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  vote_type TEXT NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un usuario solo puede votar una vez por review
  UNIQUE(review_id, user_id)
);

-- Índices para votos
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_user_id ON review_votes(user_id);

-- Vista materializada para estadísticas de reviews por producto
CREATE MATERIALIZED VIEW IF NOT EXISTS product_review_stats AS
SELECT 
  product_id,
  COUNT(*) as total_reviews,
  AVG(rating)::DECIMAL(3,2) as average_rating,
  COUNT(*) FILTER (WHERE rating = 5) as five_star_count,
  COUNT(*) FILTER (WHERE rating = 4) as four_star_count,
  COUNT(*) FILTER (WHERE rating = 3) as three_star_count,
  COUNT(*) FILTER (WHERE rating = 2) as two_star_count,
  COUNT(*) FILTER (WHERE rating = 1) as one_star_count,
  COUNT(*) FILTER (WHERE verified_purchase = true) as verified_purchases_count
FROM product_reviews
WHERE status = 'approved'
GROUP BY product_id;

-- Índice para la vista materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_review_stats_product_id ON product_review_stats(product_id);

-- Función para refrescar estadísticas de reviews
CREATE OR REPLACE FUNCTION refresh_product_review_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY product_review_stats;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_product_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_reviews_updated_at_trigger
  BEFORE UPDATE ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_reviews_updated_at();

-- Trigger para actualizar contadores de votos
CREATE OR REPLACE FUNCTION update_review_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'helpful' THEN
      UPDATE product_reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    ELSE
      UPDATE product_reviews SET not_helpful_count = not_helpful_count + 1 WHERE id = NEW.review_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'helpful' THEN
      UPDATE product_reviews SET helpful_count = helpful_count - 1 WHERE id = OLD.review_id;
    ELSE
      UPDATE product_reviews SET not_helpful_count = not_helpful_count - 1 WHERE id = OLD.review_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type = 'helpful' THEN
      UPDATE product_reviews SET helpful_count = helpful_count - 1 WHERE id = OLD.review_id;
    ELSE
      UPDATE product_reviews SET not_helpful_count = not_helpful_count - 1 WHERE id = OLD.review_id;
    END IF;
    IF NEW.vote_type = 'helpful' THEN
      UPDATE product_reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    ELSE
      UPDATE product_reviews SET not_helpful_count = not_helpful_count + 1 WHERE id = NEW.review_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER review_votes_update_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON review_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_vote_counts();

-- Habilitar RLS
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para product_reviews
-- Todos pueden ver reviews aprobadas
CREATE POLICY "Anyone can view approved reviews"
  ON product_reviews FOR SELECT
  USING (status = 'approved');

-- Usuarios pueden ver sus propias reviews
CREATE POLICY "Users can view their own reviews"
  ON product_reviews FOR SELECT
  USING (auth.uid() = user_id);

-- Superadmins pueden ver todas las reviews
CREATE POLICY "Superadmins can view all reviews"
  ON product_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'superadmin'
    )
  );

-- Usuarios autenticados pueden crear reviews
CREATE POLICY "Authenticated users can create reviews"
  ON product_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuarios pueden actualizar sus propias reviews (solo si están pendientes)
CREATE POLICY "Users can update their pending reviews"
  ON product_reviews FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Superadmins pueden actualizar cualquier review (moderación)
CREATE POLICY "Superadmins can update any review"
  ON product_reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'superadmin'
    )
  );

-- Usuarios pueden eliminar sus propias reviews
CREATE POLICY "Users can delete their own reviews"
  ON product_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Superadmins pueden eliminar cualquier review
CREATE POLICY "Superadmins can delete any review"
  ON product_reviews FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'superadmin'
    )
  );

-- Políticas RLS para review_votes
-- Usuarios pueden ver todos los votos
CREATE POLICY "Anyone can view review votes"
  ON review_votes FOR SELECT
  USING (true);

-- Usuarios autenticados pueden votar
CREATE POLICY "Authenticated users can vote"
  ON review_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuarios pueden actualizar su propio voto
CREATE POLICY "Users can update their own vote"
  ON review_votes FOR UPDATE
  USING (auth.uid() = user_id);

-- Usuarios pueden eliminar su propio voto
CREATE POLICY "Users can delete their own vote"
  ON review_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Comentarios para documentación
COMMENT ON TABLE product_reviews IS 'Tabla de reviews y calificaciones de productos';
COMMENT ON COLUMN product_reviews.status IS 'Estados: pending (pendiente moderación), approved (aprobada), rejected (rechazada), hidden (oculta)';
COMMENT ON COLUMN product_reviews.verified_purchase IS 'Indica si la review es de un comprador verificado';
COMMENT ON TABLE review_votes IS 'Votos de utilidad de reviews';
COMMENT ON MATERIALIZED VIEW product_review_stats IS 'Estadísticas agregadas de reviews por producto';
