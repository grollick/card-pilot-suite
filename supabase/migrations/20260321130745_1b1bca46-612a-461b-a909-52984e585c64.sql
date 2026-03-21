-- Drop the broken anon SELECT policy that exposes all rows
DROP POLICY IF EXISTS "Public view estimate requests by tracking token" ON public.estimate_requests;

-- No anonymous SELECT policy on estimate_requests anymore.
-- Customer status lookups will go through an edge function.