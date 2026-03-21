-- Fix 1: Replace permissive portal message INSERT with token-scoped policy
DROP POLICY IF EXISTS "Public can insert portal messages" ON public.client_portal_messages;

-- Allow anon/authenticated to insert only with valid portal token
CREATE POLICY "Portal token scoped insert"
  ON public.client_portal_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Business owner can always insert for their own user_id
    (auth.uid() = user_id)
    OR
    -- Anonymous portal visitors must have a valid, non-expired token
    EXISTS (
      SELECT 1 FROM public.client_portal_tokens t
      WHERE t.user_id = client_portal_messages.user_id
        AND t.lead_id = client_portal_messages.lead_id
        AND t.expires_at > now()
    )
  );