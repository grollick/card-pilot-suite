
-- Add verification_level enum and column
DO $$ BEGIN
  CREATE TYPE public.verification_level AS ENUM ('basic', 'verified', 'pro_verified');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_level verification_level NOT NULL DEFAULT 'basic';

-- Function to auto-recalculate verification level
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

  -- Check published card
  SELECT EXISTS(SELECT 1 FROM cards WHERE user_id = p_user_id AND status = 'published') INTO v_has_card;

  -- Check real activity
  SELECT COUNT(*) INTO v_lead_count FROM leads WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_booking_count FROM bookings WHERE user_id = p_user_id;
  v_has_activity := (v_lead_count >= 1 OR v_booking_count >= 1);

  -- Get trust score
  v_trust_score := COALESCE(v_profile.trust_score, 0);

  -- Determine level
  -- Pro Verified: trust >= 60, profile complete (name+profession+phone+avatar), consistent activity
  IF v_trust_score >= 60
     AND v_profile.name IS NOT NULL AND v_profile.name <> ''
     AND v_profile.profession IS NOT NULL AND v_profile.profession <> ''
     AND v_profile.phone IS NOT NULL AND v_profile.phone <> ''
     AND v_profile.avatar_url IS NOT NULL
     AND (v_lead_count >= 5 OR v_booking_count >= 3)
     AND v_has_card
  THEN
    v_level := 'pro_verified';
  -- Verified: profile filled, at least 1 activity
  ELSIF v_profile.name IS NOT NULL AND v_profile.name <> ''
     AND v_profile.profession IS NOT NULL AND v_profile.profession <> ''
     AND v_has_activity
  THEN
    v_level := 'verified';
  ELSE
    v_level := 'basic';
  END IF;

  -- Update
  UPDATE profiles SET verification_level = v_level::verification_level WHERE id = p_user_id;

  RETURN v_level;
END;
$$;
