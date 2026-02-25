-- Enable RLS on public tables flagged by linter
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_warehouse_stock ENABLE ROW LEVEL SECURITY;

-- collections: public read for active collections
DROP POLICY IF EXISTS collections_public_read ON public.collections;
CREATE POLICY collections_public_read
ON public.collections
FOR SELECT
TO public
USING (is_active = true);

-- collections: superadmin can read all (optional but useful)
DROP POLICY IF EXISTS collections_superadmin_read ON public.collections;
CREATE POLICY collections_superadmin_read
ON public.collections
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.id = auth.uid()
      AND up.role = 'superadmin'::public.user_role
  )
);

-- companies: only superadmin read
DROP POLICY IF EXISTS companies_superadmin_read ON public.companies;
CREATE POLICY companies_superadmin_read
ON public.companies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.id = auth.uid()
      AND up.role = 'superadmin'::public.user_role
  )
);

-- company_contacts: only superadmin read
DROP POLICY IF EXISTS company_contacts_superadmin_read ON public.company_contacts;
CREATE POLICY company_contacts_superadmin_read
ON public.company_contacts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.id = auth.uid()
      AND up.role = 'superadmin'::public.user_role
  )
);

-- Views: switch to security invoker to avoid SECURITY DEFINER behavior
-- (Recreate views with security_invoker option)
CREATE OR REPLACE VIEW public.v_distributor_summary
WITH (security_invoker = true)
AS
 SELECT id,
    company_name,
    business_type,
    contact_name,
    contact_email,
    is_active,
    aliado_id,
    last_purchase_date,
    total_purchases,
    credit_limit,
    current_balance
   FROM public.distributors d;

CREATE OR REPLACE VIEW public.v_pending_invoices
WITH (security_invoker = true)
AS
 SELECT i.id,
    i.distributor_id,
    i.order_id,
    i.invoice_number,
    i.subtotal,
    i.tax,
    i.total,
    i.issue_date,
    i.due_date,
    i.payment_status,
    i.amount_paid,
    i.last_payment_date,
    i.payment_reference,
    i.created_at,
    i.updated_at,
    d.company_name AS distributor_name,
        CASE
            WHEN (i.due_date < CURRENT_DATE) THEN 'overdue'::text
            WHEN (i.due_date <= (CURRENT_DATE + '7 days'::interval)) THEN 'due_soon'::text
            ELSE 'ok'::text
        END AS urgency,
    (i.total - i.amount_paid) AS amount_pending
   FROM (public.invoices i
     JOIN public.distributors d ON ((d.id = i.distributor_id)))
  WHERE ((i.payment_status)::text = ANY ((ARRAY['pending'::character varying, 'partial'::character varying, 'overdue'::character varying])::text[]));
;
