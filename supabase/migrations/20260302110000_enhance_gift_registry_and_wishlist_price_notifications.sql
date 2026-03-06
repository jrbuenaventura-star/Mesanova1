-- =============================================================================
-- Enhance gift registry management and wishlist price change notifications
-- =============================================================================

-- Gift registry status now supports draft/archived workflows.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gift_registry_status')
    AND NOT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE t.typname = 'gift_registry_status'
        AND e.enumlabel = 'draft'
    ) THEN
    ALTER TYPE public.gift_registry_status ADD VALUE 'draft';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gift_registry_status')
    AND NOT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE t.typname = 'gift_registry_status'
        AND e.enumlabel = 'archived'
    ) THEN
    ALTER TYPE public.gift_registry_status ADD VALUE 'archived';
  END IF;
END $$;

ALTER TABLE public.gift_registries
  ADD COLUMN IF NOT EXISTS event_address TEXT;

-- Notification type for any price movement (up/down)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type')
    AND NOT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE t.typname = 'notification_type'
        AND e.enumlabel = 'price_change'
    ) THEN
    ALTER TYPE public.notification_type ADD VALUE 'price_change';
  END IF;
END $$;

ALTER TABLE public.user_notifications
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS whatsapp_sent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS whatsapp_error TEXT;

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS whatsapp_price_alerts BOOLEAN DEFAULT true;

UPDATE public.notification_preferences
SET whatsapp_price_alerts = true
WHERE whatsapp_price_alerts IS NULL;

-- Trigger: notify users when wishlist products change price.
CREATE OR REPLACE FUNCTION public.notify_wishlist_price_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_name TEXT;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF OLD.precio IS NULL OR NEW.precio IS NULL OR OLD.precio = NEW.precio THEN
    RETURN NEW;
  END IF;

  v_product_name := COALESCE(NULLIF(BTRIM(NEW.nombre_comercial), ''), NULLIF(BTRIM(NEW.pdt_descripcion), ''), 'Producto');

  INSERT INTO public.user_notifications (
    user_id,
    type,
    title,
    message,
    product_id,
    metadata,
    created_at
  )
  SELECT
    wu.user_id,
    'price_change'::public.notification_type,
    format('Cambio de precio: %s', v_product_name),
    CASE
      WHEN NEW.precio < OLD.precio
        THEN format(
          '"%s" bajó de $%s a $%s en tus listas de deseos.',
          v_product_name,
          to_char(OLD.precio, 'FM999G999G999G990D00'),
          to_char(NEW.precio, 'FM999G999G999G990D00')
        )
      ELSE format(
        '"%s" subió de $%s a $%s en tus listas de deseos.',
        v_product_name,
        to_char(OLD.precio, 'FM999G999G999G990D00'),
        to_char(NEW.precio, 'FM999G999G999G990D00')
      )
    END,
    NEW.id,
    jsonb_build_object(
      'old_price', OLD.precio,
      'new_price', NEW.precio,
      'change_amount', NEW.precio - OLD.precio,
      'change_percent', CASE WHEN OLD.precio = 0 THEN NULL ELSE ROUND(((NEW.precio - OLD.precio) / OLD.precio) * 100, 2) END,
      'direction', CASE WHEN NEW.precio < OLD.precio THEN 'down' ELSE 'up' END,
      'wishlist_ids', wu.wishlist_ids,
      'wishlist_names', wu.wishlist_names
    ),
    NOW()
  FROM (
    SELECT
      w.user_id,
      ARRAY_AGG(DISTINCT w.id) AS wishlist_ids,
      ARRAY_AGG(DISTINCT w.name) AS wishlist_names
    FROM public.wishlist_items wi
    INNER JOIN public.wishlists w ON w.id = wi.wishlist_id
    WHERE wi.product_id = NEW.id
    GROUP BY w.user_id
  ) wu
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.user_notifications un
    WHERE un.user_id = wu.user_id
      AND un.product_id = NEW.id
      AND un.type IN ('price_change'::public.notification_type, 'price_drop'::public.notification_type)
      AND un.created_at >= NOW() - INTERVAL '30 minutes'
      AND CASE
        WHEN COALESCE(un.metadata ->> 'old_price', '') ~ '^-?[0-9]+(\\.[0-9]+)?$'
          THEN (un.metadata ->> 'old_price')::numeric = OLD.precio
        ELSE false
      END
      AND CASE
        WHEN COALESCE(un.metadata ->> 'new_price', '') ~ '^-?[0-9]+(\\.[0-9]+)?$'
          THEN (un.metadata ->> 'new_price')::numeric = NEW.precio
        ELSE false
      END
  );

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.notify_wishlist_price_change() OWNER TO postgres;

DROP TRIGGER IF EXISTS trigger_notify_wishlist_price_change ON public.products;

CREATE TRIGGER trigger_notify_wishlist_price_change
AFTER UPDATE OF precio ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.notify_wishlist_price_change();
