
-- ============================================================
-- COMPREHENSIVE SECURITY HARDENING MIGRATION
-- ============================================================

-- 1. FIX: estimate_requests — restrict SELECT to matched providers + admins
--    Currently has an INSERT policy for anon but SELECT is only for matched users.
--    The existing "Users view routed estimate requests" policy is correct.
--    However we need to ensure anon cannot SELECT at all (RLS is enabled, and
--    only the authenticated policy exists, so anon is already blocked).
--    No change needed here — verified RLS enabled + no anon SELECT policy.

-- 2. FIX: client_safe_profiles view — remove phone and email columns
DROP VIEW IF EXISTS public.client_safe_profiles CASCADE;
CREATE OR REPLACE VIEW public.client_safe_profiles AS
  SELECT id, name, handle, company, avatar_url, city, service_area, bio
  FROM public.profiles;
ALTER VIEW public.client_safe_profiles SET (security_invoker = on);
GRANT SELECT ON public.client_safe_profiles TO authenticated;

-- 3. FIX: public_reviews view — remove reported_reason and other internal fields
DROP VIEW IF EXISTS public.public_reviews CASCADE;
CREATE OR REPLACE VIEW public.public_reviews AS
  SELECT id, user_id, lead_id, reviewer_name, rating, review_text,
         is_public, source, created_at
  FROM public.reviews
  WHERE is_public = true;
ALTER VIEW public.public_reviews SET (security_invoker = on);
-- Add a permissive anon SELECT policy on reviews for public reviews only
-- so that security_invoker views can read them
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Anon can view public reviews') THEN
    CREATE POLICY "Anon can view public reviews" ON public.reviews
      FOR SELECT TO anon USING (is_public = true);
  END IF;
END $$;
GRANT SELECT ON public.public_reviews TO anon, authenticated;

-- 4. FIX: public_profiles view — replace with SECURITY DEFINER function
--    to allow anon access to safe columns without exposing the profiles table
DROP VIEW IF EXISTS public.public_profiles CASCADE;

CREATE OR REPLACE FUNCTION public.get_public_profiles(p_handle text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  name text,
  handle text,
  company text,
  avatar_url text,
  bio text,
  city text,
  service_area text,
  available_for_work boolean,
  marketplace_enabled boolean,
  avg_response_minutes numeric,
  verification_level text,
  featured boolean,
  featured_until timestamptz,
  profession_id uuid,
  primary_cta text,
  style_pack text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.id, p.name, p.handle, p.company, p.avatar_url, p.bio,
         p.city, p.service_area, p.available_for_work, p.marketplace_enabled,
         p.avg_response_minutes, p.verification_level::text, p.featured,
         p.featured_until, p.profession_id, p.primary_cta, p.style_pack
  FROM profiles p
  WHERE p.handle IS NOT NULL
    AND (p_handle IS NULL OR p.handle = lower(trim(p_handle)));
$$;

-- Recreate the view using the function (for backward compatibility with queries)
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT * FROM public.get_public_profiles();
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 5. FIX: marketplace_quote_requests — verified RLS enabled + admin-only SELECT.
--    Already fixed in prior migration. No change needed.

-- 6. HARDEN: Add explicit DENY-by-default comment — RLS is already enabled
--    on estimate_requests and marketplace_quote_requests with appropriate policies.
