
-- Fix 1: Remove dangerous INSERT and UPDATE policies on ai_credit_purchases
-- Only server-side (service role) should be able to insert/update credits
DROP POLICY IF EXISTS "Users insert own credit purchases" ON ai_credit_purchases;
DROP POLICY IF EXISTS "Users update own credit purchases" ON ai_credit_purchases;

-- Add defence-in-depth trigger to prevent credits_remaining > credits_purchased
CREATE OR REPLACE FUNCTION public.check_credits_remaining()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.credits_remaining > NEW.credits_purchased THEN
    RAISE EXCEPTION 'credits_remaining cannot exceed credits_purchased';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_credits_remaining
  BEFORE INSERT OR UPDATE ON ai_credit_purchases
  FOR EACH ROW EXECUTE FUNCTION check_credits_remaining();

-- Fix 2: Drop and recreate the buggy org members INSERT policy with correct correlation
DROP POLICY IF EXISTS "Org admins can insert members" ON organization_members;

CREATE POLICY "Org admins can insert members"
ON organization_members FOR INSERT TO authenticated
WITH CHECK (
  is_org_admin(auth.uid(), org_id)
  OR (
    auth.uid() = user_id
    AND role = 'owner'::org_role
    AND NOT EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.org_id = organization_members.org_id
    )
  )
);
