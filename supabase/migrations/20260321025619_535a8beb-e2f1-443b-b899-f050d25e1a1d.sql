-- Fix: Replace overly permissive USING(true) on job_request_responses
-- with a token-scoped policy for the public customer view

-- 1. Drop the dangerous policy
DROP POLICY IF EXISTS "Public can view responses by request" ON public.job_request_responses;

-- 2. Add scoped policy: anon can only see responses linked to estimate_requests with a tracking_token
CREATE POLICY "Public view responses by tracking token"
  ON public.job_request_responses
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.estimate_requests er
      WHERE er.id = job_request_responses.estimate_request_id
        AND er.tracking_token IS NOT NULL
    )
  );

-- 3. Allow anon SELECT on estimate_requests scoped to rows with a tracking_token
CREATE POLICY "Public view estimate requests by tracking token"
  ON public.estimate_requests
  FOR SELECT
  TO anon
  USING (tracking_token IS NOT NULL);