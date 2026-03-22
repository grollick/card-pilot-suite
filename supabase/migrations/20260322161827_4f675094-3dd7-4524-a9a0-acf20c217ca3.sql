
-- 1. FIX: reviews table exposes reviewer_email to anon
-- Replace the broad anon policy with a SECURITY DEFINER function that excludes email
DROP POLICY IF EXISTS "Anon can view public reviews" ON public.reviews;

-- The public_reviews view already excludes reviewer_email (fixed earlier).
-- Anon should use the view, not the table directly.
-- No anon SELECT policy on reviews table needed — the view uses security_invoker
-- but needs an underlying policy. Create a narrow one that works with the view:
CREATE POLICY "Anon can view public reviews via view"
  ON public.reviews FOR SELECT TO anon
  USING (is_public = true);

-- Since the anon policy exposes all columns, replace it with a function approach:
-- Actually, the public_reviews view with security_invoker needs the anon policy to work.
-- The solution is to make public_reviews NOT use security_invoker, and instead
-- make it a plain view that selects safe columns only (no reviewer_email).
DROP POLICY IF EXISTS "Anon can view public reviews via view" ON public.reviews;
DROP POLICY IF EXISTS "Anon can view public reviews" ON public.reviews;

-- Recreate public_reviews as a SECURITY DEFINER function instead
DROP VIEW IF EXISTS public.public_reviews CASCADE;

CREATE OR REPLACE FUNCTION public.get_public_reviews(p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  lead_id uuid,
  reviewer_name text,
  rating integer,
  review_text text,
  is_public boolean,
  source text,
  owner_response text,
  owner_response_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT r.id, r.user_id, r.lead_id, r.reviewer_name, r.rating, r.review_text,
         r.is_public, r.source, r.owner_response, r.owner_response_at, r.created_at
  FROM reviews r
  WHERE r.is_public = true
    AND (p_user_id IS NULL OR r.user_id = p_user_id);
$$;

CREATE OR REPLACE VIEW public.public_reviews AS
  SELECT * FROM public.get_public_reviews();
ALTER VIEW public.public_reviews SET (security_invoker = on);
GRANT SELECT ON public.public_reviews TO anon, authenticated;

-- 2. FIX: neighborhood_boosts — create a safe public view
CREATE OR REPLACE FUNCTION public.get_active_boosts()
RETURNS TABLE (
  target_city text,
  radius_km numeric,
  status text,
  expires_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT nb.target_city, nb.radius_km, nb.status, nb.expires_at
  FROM neighborhood_boosts nb
  WHERE nb.status = 'active' AND nb.expires_at > now();
$$;
