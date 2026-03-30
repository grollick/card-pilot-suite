CREATE OR REPLACE VIEW public.copilot_lead_context AS
SELECT
  bl.id AS lead_id,
  bl.business_id,
  b.business_name,
  bl.full_name,
  bl.email,
  bl.phone,
  bl.message,
  bl.status,
  bl.source,
  bl.created_at,
  s.title AS service_title
FROM business_leads bl
JOIN businesses b ON b.id = bl.business_id
LEFT JOIN services s ON s.id = bl.service_id;