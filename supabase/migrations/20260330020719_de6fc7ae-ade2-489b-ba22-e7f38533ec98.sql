CREATE OR REPLACE VIEW public.business_plan_status
WITH (security_invoker = true)
AS
SELECT
  b.id AS business_id,
  sp.name AS plan_name,
  pl.max_services,
  pl.max_bookings_per_month,
  pl.max_service_areas,
  pl.branding_removed,
  pl.featured_enabled
FROM businesses b
JOIN business_subscriptions bs ON bs.business_id = b.id
JOIN subscription_plans sp ON sp.id = bs.plan_id
JOIN plan_limits pl ON pl.plan_id = sp.id;