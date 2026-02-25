-- Agregar columnas faltantes a product_reviews
ALTER TABLE product_reviews 
  ADD COLUMN IF NOT EXISTS comment TEXT,
  ADD COLUMN IF NOT EXISTS verified_purchase BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')),
  ADD COLUMN IF NOT EXISTS moderation_notes TEXT,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS seller_response TEXT,
  ADD COLUMN IF NOT EXISTS seller_response_at TIMESTAMPTZ;

-- Migrar datos existentes
UPDATE product_reviews SET comment = review_text WHERE comment IS NULL AND review_text IS NOT NULL;
UPDATE product_reviews SET verified_purchase = is_verified_purchase WHERE verified_purchase IS NULL;
UPDATE product_reviews SET status = CASE WHEN is_approved = true THEN 'approved' ELSE 'pending' END WHERE status IS NULL;

-- Crear tabla de votos si no existe
CREATE TABLE IF NOT EXISTS review_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON review_votes(review_id);

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
      UPDATE product_reviews SET helpful_count = GREATEST(helpful_count - 1, 0) WHERE id = OLD.review_id;
    ELSE
      UPDATE product_reviews SET not_helpful_count = GREATEST(not_helpful_count - 1, 0) WHERE id = OLD.review_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS review_votes_update_counts_trigger ON review_votes;
CREATE TRIGGER review_votes_update_counts_trigger
  AFTER INSERT OR DELETE ON review_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_vote_counts();

-- Actualizar RLS para review_votes
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view review votes" ON review_votes;
CREATE POLICY "Anyone can view review votes"
  ON review_votes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can vote" ON review_votes;
CREATE POLICY "Authenticated users can vote"
  ON review_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own vote" ON review_votes;
CREATE POLICY "Users can delete their own vote"
  ON review_votes FOR DELETE
  USING (auth.uid() = user_id);;
