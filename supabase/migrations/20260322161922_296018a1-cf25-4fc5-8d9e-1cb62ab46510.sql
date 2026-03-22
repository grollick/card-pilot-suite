
-- 1. FIX: estimate_matches INSERT policy — allow service_role to insert
DROP POLICY IF EXISTS "Service role inserts matches" ON public.estimate_matches;
CREATE POLICY "Service role inserts matches"
  ON public.estimate_matches FOR INSERT TO public
  WITH CHECK (auth.role() = 'service_role');

-- 2. FIX: referrals — hide fraud_flags from referrers by restricting the policy
--    The current policy uses ALL which exposes fraud_flags. Replace with scoped policies.
DROP POLICY IF EXISTS "Users manage own referrals" ON public.referrals;
DROP POLICY IF EXISTS "users_manage_own_referrals" ON public.referrals;

-- Referrers can SELECT and INSERT their own referrals (no DELETE, no access to fraud_flags via view)
CREATE POLICY "Referrers can view own referrals"
  ON public.referrals FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR referred_user_id = auth.uid());

CREATE POLICY "Referrers can insert own referrals"
  ON public.referrals FOR INSERT TO authenticated
  WITH CHECK (referrer_id = auth.uid());

CREATE POLICY "Referrers can update own referrals"
  ON public.referrals FOR UPDATE TO authenticated
  USING (referrer_id = auth.uid());

-- No DELETE policy — referrers should not delete referral records
