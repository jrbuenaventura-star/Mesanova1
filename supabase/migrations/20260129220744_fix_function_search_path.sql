-- Fix database linter: function_search_path_mutable
-- Set a stable search_path to prevent malicious object shadowing.

ALTER FUNCTION public.handle_new_user() SET search_path = pg_catalog, public;
ALTER FUNCTION public.generate_order_number() SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_orders_updated_at() SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_gift_registry_purchased_quantity() SET search_path = pg_catalog, public;
ALTER FUNCTION public.is_superadmin() SET search_path = pg_catalog, public;
ALTER FUNCTION public.ensure_single_default_address() SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_review_helpfulness() SET search_path = pg_catalog, public;
ALTER FUNCTION public.upsert_recently_viewed(uuid, uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_loyalty_points() SET search_path = pg_catalog, public;
ALTER FUNCTION public.calculate_user_segment(timestamp with time zone, numeric, numeric) SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_user_metrics_after_order() SET search_path = pg_catalog, public;
ALTER FUNCTION public.create_agent_commission_on_order() SET search_path = pg_catalog, public;
ALTER FUNCTION public.generate_ticket_number() SET search_path = pg_catalog, public;
ALTER FUNCTION public.set_ticket_number() SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_pqrs_ticket_timestamp() SET search_path = pg_catalog, public;
ALTER FUNCTION public.generate_distributor_inactivity_alerts() SET search_path = pg_catalog, public;
ALTER FUNCTION public.auto_resolve_distributor_alerts() SET search_path = pg_catalog, public;
ALTER FUNCTION public.sync_product_total_stock() SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = pg_catalog, public;
ALTER FUNCTION public.calculate_distributor_monthly_sales(uuid, integer, integer) SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_blog_post_updated_at() SET search_path = pg_catalog, public;
;
