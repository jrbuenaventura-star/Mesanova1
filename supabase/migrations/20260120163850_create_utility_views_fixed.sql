CREATE OR REPLACE VIEW v_distributor_summary AS
SELECT 
  d.id,
  d.company_name,
  d.business_type,
  d.contact_name,
  d.contact_email,
  d.is_active,
  d.aliado_id,
  d.last_purchase_date,
  d.total_purchases,
  d.credit_limit,
  d.current_balance
FROM distributors d;

CREATE OR REPLACE VIEW v_pending_invoices AS
SELECT 
  i.*,
  d.company_name as distributor_name,
  CASE 
    WHEN i.due_date < CURRENT_DATE THEN 'overdue'
    WHEN i.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
    ELSE 'ok'
  END as urgency,
  i.total - i.amount_paid as amount_pending
FROM invoices i
JOIN distributors d ON d.id = i.distributor_id
WHERE i.payment_status IN ('pending', 'partial', 'overdue');

COMMENT ON TABLE aliados IS 'Aliados comerciales (ex corredores/canales) que gestionan distribuidores';
COMMENT ON TABLE distributor_documents IS 'Documentos legales y financieros de distribuidores';
COMMENT ON TABLE leads IS 'Prospectos de potenciales distribuidores (CRM)';
COMMENT ON TABLE lead_activities IS 'Historial de actividades del CRM';
COMMENT ON TABLE invoices IS 'Facturas de distribuidores';;
