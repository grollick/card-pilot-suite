
-- Create a public_reviews view that excludes reviewer_email for anonymous access
CREATE OR REPLACE VIEW public.public_reviews
WITH (security_invoker = true)
AS
  SELECT id, user_id, lead_id, reviewer_name, rating, review_text,
         is_public, project_id, source, owner_response, owner_response_at,
         reported, reported_reason, created_at
  FROM public.reviews
  WHERE is_public = true;

-- Grant SELECT on the view to anon and authenticated
GRANT SELECT ON public.public_reviews TO anon, authenticated;

-- Drop the old public SELECT policy that exposes all columns
DROP POLICY IF EXISTS "Public can view public reviews" ON public.reviews;
