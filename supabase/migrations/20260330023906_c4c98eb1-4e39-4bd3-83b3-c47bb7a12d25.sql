
CREATE OR REPLACE FUNCTION public.refresh_marketplace_scores(p_business_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r record;
  v_avg_rating numeric;
  v_review_count int;
  v_booking_30d int;
  v_lead_30d int;
  v_profile_score numeric;
  v_score numeric;
BEGIN
  FOR r IN
    SELECT b.id, b.business_name, b.description, b.logo_url, b.cover_image_url,
           b.phone, b.email, b.website, b.location_city
    FROM businesses b
    WHERE b.is_active = true
      AND b.is_marketplace_visible = true
      AND (p_business_id IS NULL OR b.id = p_business_id)
  LOOP
    SELECT COALESCE(AVG(br.rating), 0), COUNT(*)
    INTO v_avg_rating, v_review_count
    FROM business_reviews br
    WHERE br.business_id = r.id AND br.is_approved = true;

    SELECT COUNT(*) INTO v_booking_30d
    FROM business_bookings bb
    WHERE bb.business_id = r.id AND bb.created_at >= now() - interval '30 days';

    SELECT COUNT(*) INTO v_lead_30d
    FROM business_leads bl
    WHERE bl.business_id = r.id AND bl.created_at >= now() - interval '30 days';

    v_profile_score := 0;
    IF r.description IS NOT NULL AND r.description <> '' THEN v_profile_score := v_profile_score + 20; END IF;
    IF r.logo_url IS NOT NULL THEN v_profile_score := v_profile_score + 20; END IF;
    IF r.cover_image_url IS NOT NULL THEN v_profile_score := v_profile_score + 15; END IF;
    IF r.phone IS NOT NULL THEN v_profile_score := v_profile_score + 15; END IF;
    IF r.email IS NOT NULL THEN v_profile_score := v_profile_score + 15; END IF;
    IF r.website IS NOT NULL AND r.website <> '' THEN v_profile_score := v_profile_score + 15; END IF;

    -- Weighted score: rating 40%, bookings 30%, reviews 10%, leads 10%, profile 10%
    v_score := (
      (LEAST(v_avg_rating, 5) / 5.0) * 40 +
      LEAST(v_review_count::numeric / 50.0, 1) * 10 +
      LEAST(v_booking_30d::numeric / 20.0, 1) * 30 +
      LEAST(v_lead_30d::numeric / 30.0, 1) * 10 +
      (v_profile_score / 100.0) * 10
    );

    INSERT INTO marketplace_metrics (business_id, avg_rating, review_count, booking_count_30d, lead_count_30d, profile_completeness_score, marketplace_score, updated_at)
    VALUES (r.id, v_avg_rating, v_review_count, v_booking_30d, v_lead_30d, v_profile_score, v_score, now())
    ON CONFLICT (business_id) DO UPDATE SET
      avg_rating = EXCLUDED.avg_rating,
      review_count = EXCLUDED.review_count,
      booking_count_30d = EXCLUDED.booking_count_30d,
      lead_count_30d = EXCLUDED.lead_count_30d,
      profile_completeness_score = EXCLUDED.profile_completeness_score,
      marketplace_score = EXCLUDED.marketplace_score,
      updated_at = now();
  END LOOP;
END;
$$;
