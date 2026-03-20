
-- Fix recalculate_verification_level to use profession_id instead of profession
CREATE OR REPLACE FUNCTION public.recalculate_verification_level(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile record;
  v_has_card boolean;
  v_has_activity boolean;
  v_trust_score integer;
  v_lead_count integer;
  v_booking_count integer;
  v_level text;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN 'basic'; END IF;

  SELECT EXISTS(SELECT 1 FROM cards WHERE user_id = p_user_id AND status = 'published') INTO v_has_card;

  SELECT COUNT(*) INTO v_lead_count FROM leads WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_booking_count FROM bookings WHERE user_id = p_user_id;
  v_has_activity := (v_lead_count >= 1 OR v_booking_count >= 1);

  v_trust_score := COALESCE(v_profile.trust_score, 0);

  IF v_trust_score >= 60
     AND v_profile.name IS NOT NULL AND v_profile.name <> ''
     AND v_profile.profession_id IS NOT NULL
     AND v_profile.phone IS NOT NULL AND v_profile.phone <> ''
     AND v_profile.avatar_url IS NOT NULL
     AND (v_lead_count >= 5 OR v_booking_count >= 3)
     AND v_has_card
  THEN
    v_level := 'pro_verified';
  ELSIF v_profile.name IS NOT NULL AND v_profile.name <> ''
     AND v_profile.profession_id IS NOT NULL
     AND v_has_activity
  THEN
    v_level := 'verified';
  ELSE
    v_level := 'basic';
  END IF;

  UPDATE profiles SET verification_level = v_level::verification_level WHERE id = p_user_id;

  RETURN v_level;
END;
$$;
