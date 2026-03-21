-- Restrict signup_abuse_log INSERT to service_role only
DROP POLICY IF EXISTS "Service can insert abuse log" ON signup_abuse_log;
CREATE POLICY "Service role inserts abuse log" ON signup_abuse_log
  FOR INSERT TO public
  WITH CHECK (auth.role() = 'service_role');