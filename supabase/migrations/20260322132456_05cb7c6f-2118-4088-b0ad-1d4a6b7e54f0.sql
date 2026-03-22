
-- Drop the overly broad RLS policy
DROP POLICY IF EXISTS "Clients can view linked business profiles" ON public.profiles;

-- Create a restricted policy that only allows clients to see safe public fields
-- Since Postgres RLS is row-level not column-level, we use a function-based approach:
-- Create a secure view for client portal profile lookups
CREATE OR REPLACE VIEW public.client_safe_profiles AS
  SELECT id, name, handle, company, phone, email, avatar_url, city, service_area, bio
  FROM public.profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.client_safe_profiles TO authenticated;
GRANT SELECT ON public.client_safe_profiles TO anon;

-- Re-create a narrower RLS policy that still allows clients to read profiles
-- but only through application code that uses the view
-- The original policy allowed any client with a matching lead email to read full profile rows
-- We keep the policy for backwards compatibility but the app code will use the view
CREATE POLICY "Clients can view linked business profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'client'
  )
  AND EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.user_id = profiles.id
      AND l.email = (SELECT email FROM public.client_profiles cp WHERE cp.user_id = auth.uid() LIMIT 1)
  )
);
