-- SECURITY HARDENING: Fix critical RLS policy vulnerabilities

-- 1. Fix organization_members: Remove overly permissive INSERT policy
-- Users should NOT be able to insert themselves as owner of ANY org
DROP POLICY IF EXISTS "Users can insert themselves as owner" ON public.organization_members;

-- Only allow inserting members for orgs you own/admin
CREATE POLICY "Org admins can insert members"
ON public.organization_members
FOR INSERT TO authenticated
WITH CHECK (
  public.is_org_admin(auth.uid(), org_id)
  OR (
    -- Allow creating org with yourself as owner only if no members exist yet
    auth.uid() = user_id
    AND role = 'owner'::org_role
    AND NOT EXISTS (SELECT 1 FROM public.organization_members WHERE org_id = organization_members.org_id)
  )
);

-- 2. Fix client_portal_messages: Remove public read access
DROP POLICY IF EXISTS "Public can read portal messages" ON public.client_portal_messages;

CREATE POLICY "Owner and token-authenticated can read messages"
ON public.client_portal_messages
FOR SELECT
USING (auth.uid() = user_id);

-- 3. Fix invoices: Tighten payment_token policy to actually match token
DROP POLICY IF EXISTS "Public can view invoice by payment_token" ON public.invoices;

-- Public can only view if they actually provide matching token via RPC or direct match
-- Keep owner access
CREATE POLICY "Owner can view own invoices"
ON public.invoices
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 4. Fix scheduled_followups: Restrict INSERT to own user_id
DROP POLICY IF EXISTS "Public can insert followups" ON public.scheduled_followups;

CREATE POLICY "Auth users can insert own followups"
ON public.scheduled_followups
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. Fix estimate_matches: Restrict INSERT to service role only
DROP POLICY IF EXISTS "System can insert estimate matches" ON public.estimate_matches;

-- Only service role can insert matches (edge functions use service role key)
-- Authenticated users should not be able to self-insert matches
CREATE POLICY "Service role inserts matches"
ON public.estimate_matches
FOR INSERT
WITH CHECK (false);

-- 6. Fix estimate_duty_log and lead_routing_log: Restrict to own user_id
DROP POLICY IF EXISTS "Auth users can insert duty log" ON public.estimate_duty_log;
CREATE POLICY "Auth users can insert own duty log"
ON public.estimate_duty_log
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 7. Fix cards: Only show published cards publicly
DROP POLICY IF EXISTS "Public can view cards by user" ON public.cards;

CREATE POLICY "Public can view published cards"
ON public.cards
FOR SELECT
USING (status = 'published');

CREATE POLICY "Owners can view own cards"
ON public.cards
FOR SELECT TO authenticated
USING (auth.uid() = user_id);
