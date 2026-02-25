-- Lock down permissive INSERT policies flagged by linter (WITH CHECK true)
-- After this, writes should happen via server-side API using service role.

-- orders
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- coupon_usages
DROP POLICY IF EXISTS "Anyone can create coupon usage" ON public.coupon_usages;

-- gift_cards
DROP POLICY IF EXISTS "Anyone can create gift cards" ON public.gift_cards;

-- gift_card_transactions
DROP POLICY IF EXISTS "Anyone can create transactions" ON public.gift_card_transactions;

-- gift_registry_purchases
DROP POLICY IF EXISTS "Anyone can purchase gifts" ON public.gift_registry_purchases;

-- blog_posts
DROP POLICY IF EXISTS "Authenticated users can create blog posts" ON public.blog_posts;

-- user_profiles
DROP POLICY IF EXISTS "allow_insert_during_signup" ON public.user_profiles;
;
