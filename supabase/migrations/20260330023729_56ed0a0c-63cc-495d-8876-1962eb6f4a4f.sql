
-- Add lat/lon to businesses table for primary location
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric;

-- Update search_marketplace to support distance-based sorting
CREATE OR REPLACE FUNCTION public.search_marketplace(
  p_city text DEFAULT NULL,
  p_keyword text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_min_rating numeric DEFAULT 0,
  p_lat numeric DEFAULT NULL,
  p_lon numeric DEFAULT NULL,
  p_radius_km numeric DEFAULT 50,
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
  distance_km numeric,
  total_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH matched AS (
    SELECT DISTINCT b.id,
      CASE
        WHEN p_lat IS NOT NULL AND p_lon IS NOT NULL AND (b.latitude IS NOT NULL OR sa.latitude IS NOT NULL) THEN
          (extensions.ST_DistanceSphere(
            extensions.ST_MakePoint(p_lon, p_lat),
            extensions.ST_MakePoint(
              COALESCE(sa.longitude, b.longitude),
              COALESCE(sa.latitude, b.latitude)
            )
          ) / 1000.0)
        ELSE NULL
      END AS dist_km
    FROM businesses b
    LEFT JOIN service_areas sa ON sa.business_id = b.id
    LEFT JOIN business_categories bc ON bc.business_id = b.id
    LEFT JOIN marketplace_metrics mm ON mm.business_id = b.id
    WHERE b.is_active = true
      AND b.is_marketplace_visible = true
      AND (p_city IS NULL OR lower(b.location_city) = lower(p_city) OR lower(sa.city) = lower(p_city))
      AND (p_category IS NULL OR bc.category_key = p_category)
      AND (p_keyword IS NULL OR
        b.business_name ILIKE '%' || p_keyword || '%' OR
        b.description ILIKE '%' || p_keyword || '%')
      AND (COALESCE(mm.avg_rating, 0) >= p_min_rating)
  ),
  -- Keep closest distance per business
  deduped AS (
    SELECT id, MIN(dist_km) AS dist_km
    FROM matched
    GROUP BY id
  ),
  -- Filter by radius when lat/lon provided
  filtered AS (
    SELECT * FROM deduped
    WHERE p_lat IS NULL OR dist_km IS NULL OR dist_km <= p_radius_km
  ),
  total AS (SELECT COUNT(*) AS cnt FROM filtered)
  SELECT
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
    EXISTS(
      SELECT 1 FROM neighborhood_boosts nb
      WHERE nb.user_id = b.owner_user_id AND nb.status = 'active' AND nb.expires_at > now()
    ) AS is_boosted,
    COALESCE(sp.name = 'growth', false) AS has_premium_badge,
    ARRAY(SELECT bc2.category_key FROM business_categories bc2 WHERE bc2.business_id = b.id) AS categories,
    ROUND(f.dist_km::numeric, 1) AS distance_km,
    t.cnt AS total_count
  FROM filtered f
  JOIN businesses b ON b.id = f.id
  CROSS JOIN total t
  LEFT JOIN marketplace_metrics mm ON mm.business_id = b.id
  LEFT JOIN business_subscriptions bs ON bs.business_id = b.id AND bs.status = 'active'
  LEFT JOIN subscription_plans sp ON sp.id = bs.plan_id
  LEFT JOIN plan_limits pl ON pl.plan_id = sp.id
  ORDER BY
    COALESCE(pl.featured_enabled, false) DESC,
    CASE WHEN f.dist_km IS NOT NULL THEN f.dist_km ELSE 9999 END ASC,
    COALESCE(mm.marketplace_score, 0) DESC
  LIMIT p_limit OFFSET p_offset;
$$;
