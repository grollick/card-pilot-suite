
-- Add trust_score and trust signals to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trust_score integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS trust_signals jsonb NOT NULL DEFAULT '{}';

-- DB function to recalculate trust score for a user
CREATE OR REPLACE FUNCTION public.recalculate_trust_score(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_score integer := 10; -- base score for new accounts
  v_signals jsonb := '{}';
  v_profile record;
  v_has_card boolean;
  v_lead_count integer;
  v_booking_count integer;
  v_abuse_count integer;
  v_disposable_flag boolean;
  v_ip_dupes integer;
BEGIN
  -- Get profile
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- POSITIVE: Email confirmed (Supabase confirms via auth)
  -- If user can log in, email is confirmed = +15
  v_score := v_score + 15;
  v_signals := v_signals || '{"email_verified": true}'::jsonb;

  -- POSITIVE: Profile completion (name + profession filled)
  IF v_profile.name IS NOT NULL AND v_profile.name <> '' THEN
    v_score := v_score + 5;
    v_signals := v_signals || '{"has_name": true}'::jsonb;
  END IF;
  IF v_profile.profession IS NOT NULL AND v_profile.profession <> '' THEN
    v_score := v_score + 5;
    v_signals := v_signals || '{"has_profession": true}'::jsonb;
  END IF;
  IF v_profile.phone IS NOT NULL AND v_profile.phone <> '' THEN
    v_score := v_score + 10;
    v_signals := v_signals || '{"has_phone": true}'::jsonb;
  END IF;

  -- POSITIVE: Has published card
  SELECT EXISTS(SELECT 1 FROM cards WHERE user_id = p_user_id AND status = 'published') INTO v_has_card;
  IF v_has_card THEN
    v_score := v_score + 15;
    v_signals := v_signals || '{"has_published_card": true}'::jsonb;
  END IF;

  -- POSITIVE: Real activity (leads)
  SELECT COUNT(*) INTO v_lead_count FROM leads WHERE user_id = p_user_id;
  IF v_lead_count >= 1 THEN v_score := v_score + 5; END IF;
  IF v_lead_count >= 5 THEN v_score := v_score + 5; END IF;
  IF v_lead_count >= 20 THEN v_score := v_score + 5; END IF;
  v_signals := v_signals || jsonb_build_object('lead_count', v_lead_count);

  -- POSITIVE: Real activity (bookings)
  SELECT COUNT(*) INTO v_booking_count FROM bookings WHERE user_id = p_user_id;
  IF v_booking_count >= 1 THEN v_score := v_score + 5; END IF;
  IF v_booking_count >= 10 THEN v_score := v_score + 5; END IF;
  v_signals := v_signals || jsonb_build_object('booking_count', v_booking_count);

  -- NEGATIVE: Disposable email flag
  v_disposable_flag := 'disposable_email' = ANY(v_profile.abuse_flags);
  IF v_disposable_flag THEN
    v_score := v_score - 20;
    v_signals := v_signals || '{"disposable_email": true}'::jsonb;
  END IF;

  -- NEGATIVE: Abuse log count (high risk entries)
  SELECT COUNT(*) INTO v_abuse_count
  FROM signup_abuse_log
  WHERE (email = v_profile.email OR user_id = p_user_id)
    AND risk_level IN ('medium', 'high');
  IF v_abuse_count >= 1 THEN v_score := v_score - 5; END IF;
  IF v_abuse_count >= 3 THEN v_score := v_score - 10; END IF;
  v_signals := v_signals || jsonb_build_object('abuse_log_count', v_abuse_count);

  -- NEGATIVE: IP/fingerprint duplicates
  SELECT COUNT(DISTINCT fingerprint_hash) INTO v_ip_dupes
  FROM signup_abuse_log
  WHERE email = v_profile.email AND fingerprint_hash IS NOT NULL;
  IF v_ip_dupes >= 3 THEN
    v_score := v_score - 10;
    v_signals := v_signals || '{"multi_device_signup": true}'::jsonb;
  END IF;

  -- NEGATIVE: Suspended
  IF v_profile.is_suspended THEN
    v_score := 0;
    v_signals := v_signals || '{"suspended": true}'::jsonb;
  END IF;

  -- Clamp 0-100
  v_score := GREATEST(0, LEAST(100, v_score));

  -- Update profile
  UPDATE profiles
  SET trust_score = v_score,
      trust_signals = v_signals,
      trust_level = CASE
        WHEN v_score >= 60 THEN 'trusted'
        WHEN v_score >= 30 THEN 'verified'
        ELSE 'new'
      END
  WHERE id = p_user_id;

  RETURN v_score;
END;
$$;
