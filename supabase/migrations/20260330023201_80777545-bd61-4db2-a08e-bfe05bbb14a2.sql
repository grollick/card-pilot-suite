
-- Function to refresh marketplace_score for a specific business or all businesses
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
    -- avg rating and review count
    SELECT COALESCE(AVG(br.rating), 0), COUNT(*)
    INTO v_avg_rating, v_review_count
    FROM business_reviews br
    WHERE br.business_id = r.id AND br.is_approved = true;

    -- bookings last 30 days
    SELECT COUNT(*) INTO v_booking_30d
    FROM business_bookings bb
    WHERE bb.business_id = r.id
      AND bb.created_at >= now() - interval '30 days';

    -- leads last 30 days
    SELECT COUNT(*) INTO v_lead_30d
    FROM business_leads bl
    WHERE bl.business_id = r.id
      AND bl.created_at >= now() - interval '30 days';

    -- profile completeness (0-100)
    v_profile_score := 0;
    IF r.description IS NOT NULL AND r.description <> '' THEN v_profile_score := v_profile_score + 20; END IF;
    IF r.logo_url IS NOT NULL THEN v_profile_score := v_profile_score + 20; END IF;
    IF r.cover_image_url IS NOT NULL THEN v_profile_score := v_profile_score + 15; END IF;
    IF r.phone IS NOT NULL THEN v_profile_score := v_profile_score + 15; END IF;
    IF r.email IS NOT NULL THEN v_profile_score := v_profile_score + 15; END IF;
    IF r.website IS NOT NULL AND r.website <> '' THEN v_profile_score := v_profile_score + 15; END IF;

    -- Weighted marketplace score (0-100 scale)
    v_score := (
      (LEAST(v_avg_rating, 5) / 5.0) * 35 +              -- rating: 35%
      LEAST(v_review_count::numeric / 50.0, 1) * 20 +      -- reviews: 20%
      LEAST(v_booking_30d::numeric / 20.0, 1) * 15 +       -- bookings: 15%
      LEAST(v_lead_30d::numeric / 30.0, 1) * 15 +          -- leads: 15%
      (v_profile_score / 100.0) * 15                        -- profile: 15%
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

-- Function for geo-filtered marketplace search
CREATE OR REPLACE FUNCTION public.search_marketplace(
  p_city text DEFAULT NULL,
  p_keyword text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_min_rating numeric DEFAULT 0,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE(
  business_id uuid,
  slug text,
  business_name text,
  description text,
  logo_url text,
  cover_image_url text,
  location_city text,
  location_region text,
  phone text,
  email text,
  avg_rating numeric,
  review_count int,
  marketplace_score numeric,
  is_featured boolean,
  is_boosted boolean,
  has_premium_badge boolean,
  categories text[],
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total bigint;
BEGIN
  -- Count total matches first
  SELECT COUNT(DISTINCT b.id) INTO v_total
  FROM businesses b
  LEFT JOIN service_areas sa ON sa.business_id = b.id
  LEFT JOIN business_categories bc ON bc.business_id = b.id
  LEFT JOIN marketplace_metrics mm ON mm.business_id = b.id
  LEFT JOIN business_subscriptions bs ON bs.business_id = b.id AND bs.status = 'active'
  LEFT JOIN subscription_plans sp ON sp.id = bs.plan_id
  LEFT JOIN plan_limits pl ON pl.plan_id = sp.id
  WHERE b.is_active = true
    AND b.is_marketplace_visible = true
    AND (p_city IS NULL OR lower(b.location_city) = lower(p_city) OR lower(sa.city) = lower(p_city))
    AND (p_category IS NULL OR bc.category_key = p_category)
    AND (p_keyword IS NULL OR
      b.business_name ILIKE '%' || p_keyword || '%' OR
      b.description ILIKE '%' || p_keyword || '%')
    AND (COALESCE(mm.avg_rating, 0) >= p_min_rating);

  RETURN QUERY
  SELECT DISTINCT ON (b.id)
    b.id AS business_id,
    b.slug,
    b.business_name,
    b.description,
    b.logo_url,
    b.cover_image_url,
    b.location_city,
    b.location_region,
    b.phone,
    b.email,
    COALESCE(mm.avg_rating, 0)::numeric AS avg_rating,
    COALESCE(mm.review_count, 0)::int AS review_count,
    COALESCE(mm.marketplace_score, 0)::numeric AS marketplace_score,
    COALESCE(pl.featured_enabled, false) AS is_featured,
    false AS is_boosted,  -- will be computed from neighborhood_boosts
    (sp.name IN ('growth')) AS has_premium_badge,
    ARRAY(SELECT bc2.category_key FROM business_categories bc2 WHERE bc2.business_id = b.id) AS categories,
    v_total AS total_count
  FROM businesses b
  LEFT JOIN service_areas sa ON sa.business_id = b.id
  LEFT JOIN business_categories bc ON bc.business_id = b.id
  LEFT JOIN marketplace_metrics mm ON mm.business_id = b.id
  LEFT JOIN business_subscriptions bs ON bs.business_id = b.id AND bs.status = 'active'
  LEFT JOIN subscription_plans sp ON sp.id = bs.plan_id
  LEFT JOIN plan_limits pl ON pl.plan_id = sp.id
  WHERE b.is_active = true
    AND b.is_marketplace_visible = true
    AND (p_city IS NULL OR lower(b.location_city) = lower(p_city) OR lower(sa.city) = lower(p_city))
    AND (p_category IS NULL OR bc.category_key = p_category)
    AND (p_keyword IS NULL OR
      b.business_name ILIKE '%' || p_keyword || '%' OR
      b.description ILIKE '%' || p_keyword || '%')
    AND (COALESCE(mm.avg_rating, 0) >= p_min_rating)
  ORDER BY b.id, 
    COALESCE(pl.featured_enabled, false) DESC,
    COALESCE(mm.marketplace_score, 0) DESC,
    b.business_name ASC
  LIMIT p_limit OFFSET p_offset;

  -- Re-sort outside DISTINCT ON
  RETURN;
END;
$$;
