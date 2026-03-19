
-- Update check_referral_activation to reward 14 days Pro to BOTH parties on first signup activation
CREATE OR REPLACE FUNCTION public.check_referral_activation(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_code text;
  v_referral_id uuid;
  v_referrer_id uuid;
  v_has_card boolean;
  v_has_lead boolean;
  v_has_estimate boolean;
  v_activated boolean;
  v_reward_days integer := 14;
BEGIN
  SELECT referred_by INTO v_referrer_code
  FROM profiles WHERE id = p_user_id;
  
  IF v_referrer_code IS NULL THEN
    RETURN jsonb_build_object('status', 'no_referrer');
  END IF;

  SELECT id INTO v_referrer_id
  FROM profiles WHERE referral_code = v_referrer_code;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('status', 'referrer_not_found');
  END IF;

  SELECT id INTO v_referral_id
  FROM referrals
  WHERE referrer_id = v_referrer_id
    AND referred_user_id = p_user_id
    AND status = 'pending';

  IF v_referral_id IS NULL THEN
    RETURN jsonb_build_object('status', 'no_pending_referral');
  END IF;

  -- Check activation: published card + (lead OR estimate)
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

  -- Mark as completed and reward BOTH parties 14 days Pro
  UPDATE referrals
  SET status = 'completed', activated_at = now(),
      rewarded = true, reward_days = v_reward_days, reward_type = 'pro_time'
  WHERE id = v_referral_id;

  -- Grant 14-day beta/pro access to REFERRED user
  INSERT INTO beta_access (user_id, granted_plan, start_date, expiry_date, notes)
  VALUES (p_user_id, 'growth', now(), now() + interval '14 days', 'Referral reward - referred user')
  ON CONFLICT DO NOTHING;

  -- Grant 14-day beta/pro access to REFERRER
  INSERT INTO beta_access (user_id, granted_plan, start_date, expiry_date, notes)
  VALUES (v_referrer_id, 'growth', now(), now() + interval '14 days', 'Referral reward - referrer')
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object(
    'status', 'activated',
    'referral_id', v_referral_id,
    'reward_days', v_reward_days,
    'both_rewarded', true
  );
END;
$$;
