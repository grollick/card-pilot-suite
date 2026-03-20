
-- Create a view that exposes ONLY publicly safe profile columns
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  id,
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
FROM public.profiles
WHERE handle IS NOT NULL;

-- Grant access to anon and authenticated roles
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Drop the overly permissive public profiles RLS policy
DROP POLICY IF EXISTS "Public profiles by handle" ON public.profiles;
