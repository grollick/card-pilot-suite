
-- Drop the overly permissive INSERT policy on marketplace_lead_credits
-- Credits are inserted by the log_marketplace_lead_credit trigger (SECURITY DEFINER),
-- so no authenticated INSERT policy is needed.
DROP POLICY IF EXISTS "System insert lead credits" ON marketplace_lead_credits;

-- Ensure only service role (via triggers/functions) can insert
-- No new INSERT policy for authenticated users is created intentionally.
