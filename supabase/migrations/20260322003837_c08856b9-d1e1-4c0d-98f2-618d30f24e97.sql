
-- Fix 1: loyalty_cards - replace overly permissive SELECT policy
DROP POLICY IF EXISTS "Public can view loyalty cards by email" ON loyalty_cards;

-- Replace with a policy that only allows authenticated users (card owners) to view
-- No anonymous public access to loyalty card PII
CREATE POLICY "Authenticated users view own loyalty cards"
  ON loyalty_cards FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Fix 2: client_portal_messages - require actual token in request header
DROP POLICY IF EXISTS "Portal token scoped insert" ON client_portal_messages;

CREATE POLICY "Portal token scoped insert"
  ON client_portal_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (auth.uid() = user_id)
    OR
    (EXISTS (
      SELECT 1 FROM client_portal_tokens t
      WHERE t.user_id = client_portal_messages.user_id
        AND t.lead_id = client_portal_messages.lead_id
        AND t.expires_at > now()
        AND t.token = current_setting('request.headers', true)::json->>'x-portal-token'
    ))
  );
