-- =============================================================================
-- RLS Policies para todas las nuevas tablas
-- =============================================================================

-- Habilitar RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_registries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_registry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_registry_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_viewed_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- FAVORITES: Usuario ve/gestiona sus propios favoritos
CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- WISHLISTS: Usuario gestiona sus wishlists, públicas son visibles
CREATE POLICY "Users can view own wishlists" ON wishlists FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Users can insert own wishlists" ON wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wishlists" ON wishlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wishlists" ON wishlists FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "View wishlist items" ON wishlist_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM wishlists w WHERE w.id = wishlist_id AND (w.user_id = auth.uid() OR w.is_public = true)));
CREATE POLICY "Users manage own wishlist items" ON wishlist_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM wishlists w WHERE w.id = wishlist_id AND w.user_id = auth.uid()));
CREATE POLICY "Users update own wishlist items" ON wishlist_items FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM wishlists w WHERE w.id = wishlist_id AND w.user_id = auth.uid()));
CREATE POLICY "Users delete own wishlist items" ON wishlist_items FOR DELETE 
  USING (EXISTS (SELECT 1 FROM wishlists w WHERE w.id = wishlist_id AND w.user_id = auth.uid()));

-- GIFT REGISTRIES: Buscables por nombre o share_token
CREATE POLICY "View searchable gift registries" ON gift_registries FOR SELECT 
  USING (auth.uid() = user_id OR is_searchable = true OR share_token IS NOT NULL);
CREATE POLICY "Users manage own registries" ON gift_registries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own registries" ON gift_registries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own registries" ON gift_registries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "View registry items" ON gift_registry_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM gift_registries g WHERE g.id = registry_id AND (g.user_id = auth.uid() OR g.is_searchable = true)));
CREATE POLICY "Manage own registry items" ON gift_registry_items FOR ALL 
  USING (EXISTS (SELECT 1 FROM gift_registries g WHERE g.id = registry_id AND g.user_id = auth.uid()));

-- Cualquiera puede comprar de una lista pública
CREATE POLICY "Anyone can purchase gifts" ON gift_registry_purchases FOR INSERT WITH CHECK (true);
CREATE POLICY "View purchases" ON gift_registry_purchases FOR SELECT 
  USING (EXISTS (SELECT 1 FROM gift_registry_items i JOIN gift_registries g ON g.id = i.registry_id 
                 WHERE i.id = registry_item_id AND g.user_id = auth.uid()));

-- SHIPPING ADDRESSES
CREATE POLICY "Users view own addresses" ON shipping_addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own addresses" ON shipping_addresses FOR ALL USING (auth.uid() = user_id);

-- CARRIERS: Público para lectura
CREATE POLICY "Anyone can view carriers" ON carriers FOR SELECT USING (true);

-- ORDER TRACKING: Ver tracking de propias órdenes
CREATE POLICY "Users view own order tracking" ON order_tracking_history FOR SELECT 
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- PRODUCT REVIEWS: Públicas, pero solo el autor puede editar
CREATE POLICY "Anyone can view approved reviews" ON product_reviews FOR SELECT USING (is_approved = true OR auth.uid() = user_id);
CREATE POLICY "Users can insert own reviews" ON product_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON product_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON product_reviews FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users manage own votes" ON review_votes FOR ALL USING (auth.uid() = user_id);

-- RECENTLY VIEWED, ALERTS, COMPARISONS: Solo el propietario
CREATE POLICY "Users view own recently viewed" ON recently_viewed_products FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage price alerts" ON price_alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage stock alerts" ON stock_alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage comparisons" ON product_comparisons FOR ALL USING (auth.uid() = user_id OR session_id IS NOT NULL);

-- LOYALTY: Solo el propietario ve sus puntos
CREATE POLICY "Users view own loyalty" ON loyalty_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own transactions" ON loyalty_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view loyalty config" ON loyalty_config FOR SELECT USING (true);

-- NOTIFICATIONS
CREATE POLICY "Users view own notifications" ON user_notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage notification prefs" ON notification_preferences FOR ALL USING (auth.uid() = user_id);;
