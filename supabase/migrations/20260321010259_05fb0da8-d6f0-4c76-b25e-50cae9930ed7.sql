CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT id,
    name,
    handle,
    company,
    avatar_url,
    bio,
    city,
    service_area,
    available_for_work,
    marketplace_enabled,
    avg_response_minutes,
    verification_level,
    featured,
    featured_until,
    profession_id,
    primary_cta,
    style_pack
FROM profiles
WHERE handle IS NOT NULL;