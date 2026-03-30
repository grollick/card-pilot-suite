CREATE OR REPLACE FUNCTION public.onboard_business(
  p_business_name text,
  p_city text,
  p_region text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_slug text;
  v_suffix int := 0;
  v_candidate text;
  v_business_id uuid;
  v_plan_id uuid;
  v_sub_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user already has a business
  SELECT id INTO v_business_id FROM businesses WHERE owner_user_id = v_user_id LIMIT 1;
  IF v_business_id IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'already_exists', 'business_id', v_business_id);
  END IF;

  -- Generate unique slug
  v_slug := lower(regexp_replace(trim(p_business_name), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(BOTH '-' FROM v_slug);
  v_candidate := v_slug;

  WHILE EXISTS (SELECT 1 FROM businesses WHERE slug = v_candidate) LOOP
    v_suffix := v_suffix + 1;
    v_candidate := v_slug || '-' || v_suffix;
  END LOOP;
  v_slug := v_candidate;

  -- Step 1: Create business
  INSERT INTO businesses (owner_user_id, business_name, slug, location_city, location_region, is_active, is_marketplace_visible)
  VALUES (v_user_id, trim(p_business_name), v_slug, trim(p_city), trim(p_region), true, true)
  RETURNING id INTO v_business_id;

  -- Step 2: Create business profile
  INSERT INTO business_profiles (business_id, headline, subheadline, booking_enabled, lead_form_enabled, marketplace_enabled)
  VALUES (v_business_id, trim(p_business_name), 'Professional local service provider', true, true, true);

  -- Step 3: Assign free plan
  SELECT id INTO v_plan_id FROM subscription_plans WHERE name = 'free' AND is_active = true LIMIT 1;
  IF v_plan_id IS NOT NULL THEN
    INSERT INTO business_subscriptions (business_id, plan_id, status, started_at)
    VALUES (v_business_id, v_plan_id, 'active', now())
    RETURNING id INTO v_sub_id;
  END IF;

  -- Step 4: Create default service
  INSERT INTO services (business_id, service_name, description, is_active)
  VALUES (v_business_id, 'General Service', 'Contact us for details', true);

  -- Step 5: Create default service area
  INSERT INTO service_areas (business_id, city, region, is_active)
  VALUES (v_business_id, trim(p_city), trim(p_region), true);

  RETURN jsonb_build_object(
    'status', 'created',
    'business_id', v_business_id,
    'slug', v_slug,
    'subscription_id', v_sub_id
  );
END;
$$;