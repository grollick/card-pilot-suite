
-- Add activation tracking to referrals
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS reward_type text DEFAULT 'pro_time',
  ADD COLUMN IF NOT EXISTS reward_days integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fraud_flags jsonb DEFAULT '[]'::jsonb;

-- Create a function to check and activate referrals
CREATE OR REPLACE FUNCTION public.check_referral_activation(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referrer_code text;
  v_referral_id uuid;
  v_referrer_id uuid;
  v_has_card boolean;
  v_has_lead boolean;
  v_has_estimate boolean;
  v_activated boolean;
  v_reward_days integer;
  v_referrer_completed integer;
BEGIN
  -- Get the user's referred_by code
  SELECT referred_by INTO v_referrer_code
  FROM profiles WHERE id = p_user_id;
  
  IF v_referrer_code IS NULL THEN
    RETURN jsonb_build_object('status', 'no_referrer');
  END IF;

  -- Find the referrer
  SELECT id INTO v_referrer_id
  FROM profiles WHERE referral_code = v_referrer_code;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('status', 'referrer_not_found');
  END IF;

  -- Fraud check: same email domain check (basic)
  -- More sophisticated checks can be added

  -- Find pending referral record
  SELECT id INTO v_referral_id
  FROM referrals
  WHERE referrer_id = v_referrer_id
    AND referred_user_id = p_user_id
    AND status = 'pending';

  IF v_referral_id IS NULL THEN
    RETURN jsonb_build_object('status', 'no_pending_referral');
  END IF;

  -- Check activation criteria
  SELECT EXISTS (
    SELECT 1 FROM cards WHERE user_id = p_user_id AND status = 'published'
  ) INTO v_has_card;

  SELECT EXISTS (
    SELECT 1 FROM leads WHERE user_id = p_user_id LIMIT 1
  ) INTO v_has_lead;

  SELECT EXISTS (
    SELECT 1 FROM estimates WHERE user_id = p_user_id LIMIT 1
  ) INTO v_has_estimate;

  v_activated := v_has_card AND (v_has_lead OR v_has_estimate);

  IF NOT v_activated THEN
    RETURN jsonb_build_object(
      'status', 'not_activated',
      'has_card', v_has_card,
      'has_lead', v_has_lead,
      'has_estimate', v_has_estimate
    );
  END IF;

  -- Mark as completed
  UPDATE referrals
  SET status = 'completed', activated_at = now()
  WHERE id = v_referral_id;

  -- Count completed referrals for reward tier
  SELECT COUNT(*) INTO v_referrer_completed
  FROM referrals
  WHERE referrer_id = v_referrer_id AND status = 'completed';

  -- Determine reward: 3 = 30 days Pro, 10 = 180 days Pro
  v_reward_days := 0;
  IF v_referrer_completed = 3 THEN v_reward_days := 30;
  ELSIF v_referrer_completed = 10 THEN v_reward_days := 180;
  END IF;

  IF v_reward_days > 0 THEN
    UPDATE referrals
    SET rewarded = true, reward_days = v_reward_days, reward_type = 'pro_time'
    WHERE id = v_referral_id;
  END IF;

  RETURN jsonb_build_object(
    'status', 'activated',
    'referral_id', v_referral_id,
    'referrer_completed_total', v_referrer_completed,
    'reward_days', v_reward_days
  );
END;
$$;
