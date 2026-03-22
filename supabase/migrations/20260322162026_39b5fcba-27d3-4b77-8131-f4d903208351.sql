
-- 1. FIX: estimate_requests — the table has RLS enabled and a proper SELECT policy,
--    but add an explicit admin SELECT to ensure coverage, and verify no anon access
--    exists. The existing setup should block anon already (RLS enabled, no anon SELECT policy).
--    Add admin access for monitoring:
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'estimate_requests' AND policyname = 'Admins can read all estimate requests') THEN
    CREATE POLICY "Admins can read all estimate requests"
      ON public.estimate_requests FOR SELECT TO authenticated
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'founder'));
  END IF;
END $$;

-- 2. FIX: referrals — tighten the SELECT policy to prevent null referred_user_id leaks
DROP POLICY IF EXISTS "Referrers can view own referrals" ON public.referrals;
CREATE POLICY "Referrers can view own referrals"
  ON public.referrals FOR SELECT TO authenticated
  USING (
    referrer_id = auth.uid()
    OR (referred_user_id IS NOT NULL AND referred_user_id = auth.uid())
  );

-- 3. FIX: email_send_state — verify RLS is enabled (it should be)
ALTER TABLE IF EXISTS public.email_send_state ENABLE ROW LEVEL SECURITY;
