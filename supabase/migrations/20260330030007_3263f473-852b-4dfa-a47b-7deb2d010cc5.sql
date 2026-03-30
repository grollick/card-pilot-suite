CREATE OR REPLACE VIEW public.copilot_profile_context AS
SELECT
  b.id AS business_id,
  b.business_name,
  b.description,
  b.logo_url,
  b.cover_image_url,
  bp.headline,
  bp.subheadline,
  bp.bio,
  bp.booking_enabled,
  bp.lead_form_enabled,
  bp.marketplace_enabled,
  count(distinct s.id) AS service_count,
  count(distinct sa.id) AS service_area_count
FROM businesses b
LEFT JOIN business_profiles bp ON bp.business_id = b.id
LEFT JOIN services s ON s.business_id = b.id AND s.is_active = true
LEFT JOIN service_areas sa ON sa.business_id = b.id
GROUP BY
  b.id, b.business_name, b.description, b.logo_url, b.cover_image_url,
  bp.headline, bp.subheadline, bp.bio,
  bp.booking_enabled, bp.lead_form_enabled, bp.marketplace_enabled;

ALTER VIEW public.copilot_profile_context SET (security_invoker = true);