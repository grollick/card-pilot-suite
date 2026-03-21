-- Drop the overly permissive SELECT policy on client_portal_tokens
DROP POLICY IF EXISTS "Public can read by token" ON client_portal_tokens;

-- Create a restricted policy that requires the exact token via request header
CREATE POLICY "Public can read by exact token" ON client_portal_tokens
  FOR SELECT TO anon, authenticated
  USING (
    token = (current_setting('request.headers', true)::json->>'x-portal-token')
    AND expires_at > now()
  );

-- Keep existing owner-scoped policies for authenticated management