
-- ============================================
-- Create a centralized lead capture function
-- Handles: contact matching, pipeline assignment, activity logging, daily_metrics
-- ============================================
CREATE OR REPLACE FUNCTION public.capture_lead(
  p_owner_id uuid,
  p_name text,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_source text DEFAULT 'card_form',
  p_activity_type text DEFAULT 'form_submitted',
  p_activity_title text DEFAULT 'Contact form submitted',
  p_activity_description text DEFAULT NULL,
  p_meta_json jsonb DEFAULT '{}'::jsonb,
  p_handle text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id uuid;
  v_is_existing boolean := false;
  v_stage_id uuid;
  v_today date := CURRENT_DATE;
BEGIN
  -- 1. Contact matching: email first, then phone
  IF p_email IS NOT NULL AND p_email <> '' THEN
    SELECT id INTO v_lead_id
    FROM leads WHERE user_id = p_owner_id AND email = p_email LIMIT 1;
  END IF;

  IF v_lead_id IS NULL AND p_phone IS NOT NULL AND p_phone <> '' THEN
    SELECT id INTO v_lead_id
    FROM leads WHERE user_id = p_owner_id AND phone = p_phone LIMIT 1;
  END IF;

  -- 2. Get first pipeline stage
  SELECT id INTO v_stage_id
  FROM pipeline_stages
  WHERE user_id = p_owner_id
  ORDER BY sort_order ASC LIMIT 1;

  -- 3. Upsert contact
  IF v_lead_id IS NOT NULL THEN
    v_is_existing := true;
    UPDATE leads SET
      name = COALESCE(NULLIF(p_name, ''), name),
      phone = COALESCE(NULLIF(p_phone, ''), phone),
      email = COALESCE(NULLIF(p_email, ''), email),
      last_activity_at = now(),
      custom_fields_json = CASE
        WHEN p_meta_json <> '{}'::jsonb THEN p_meta_json
        ELSE custom_fields_json
      END,
      updated_at = now()
    WHERE id = v_lead_id;
  ELSE
    INSERT INTO leads (user_id, name, email, phone, source, stage_id, custom_fields_json)
    VALUES (
      p_owner_id,
      p_name,
      NULLIF(p_email, ''),
      NULLIF(p_phone, ''),
      p_source::lead_source,
      v_stage_id,
      p_meta_json
    )
    RETURNING id INTO v_lead_id;
  END IF;

  -- 4. Log activity event
  IF v_lead_id IS NOT NULL THEN
    INSERT INTO contact_activities (user_id, lead_id, activity_type, title, description, occurred_at)
    VALUES (p_owner_id, v_lead_id, p_activity_type, p_activity_title, p_activity_description, now());
  END IF;

  -- 5. Log analytics event
  IF p_handle IS NOT NULL AND p_handle <> '' THEN
    INSERT INTO analytics_events (user_id, handle, event_type, lead_id, meta_json)
    VALUES (p_owner_id, p_handle, 'form_submit', v_lead_id,
      jsonb_build_object('type', p_source, 'lead_id', v_lead_id, 'duplicate', v_is_existing) || p_meta_json);
  END IF;

  -- 6. Update daily_metrics
  INSERT INTO daily_metrics (user_id, metric_date, leads_count)
  VALUES (p_owner_id, v_today, CASE WHEN v_is_existing THEN 0 ELSE 1 END)
  ON CONFLICT (user_id, metric_date)
  DO UPDATE SET
    leads_count = daily_metrics.leads_count + CASE WHEN v_is_existing THEN 0 ELSE 1 END,
    updated_at = now();

  RETURN jsonb_build_object(
    'lead_id', v_lead_id,
    'is_existing', v_is_existing,
    'stage_id', v_stage_id
  );
END;
$$;

-- ============================================
-- Booking trigger: auto-link contact + update metrics
-- ============================================
CREATE OR REPLACE FUNCTION public.on_booking_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id uuid;
  v_is_existing boolean := false;
  v_stage_id uuid;
  v_service_price numeric := 0;
BEGIN
  -- Skip if lead_id already linked
  IF NEW.lead_id IS NOT NULL THEN
    -- Still log activity and metrics
    INSERT INTO contact_activities (user_id, lead_id, activity_type, title, description, occurred_at)
    VALUES (NEW.user_id, NEW.lead_id, 'booking_created',
      'Booking created: ' || NEW.customer_name,
      'Scheduled: ' || NEW.start_datetime::text,
      now());

    -- Get service price
    IF NEW.service_id IS NOT NULL THEN
      SELECT COALESCE(price, 0) INTO v_service_price FROM booking_services WHERE id = NEW.service_id;
    END IF;

    INSERT INTO daily_metrics (user_id, metric_date, bookings_count, revenue)
    VALUES (NEW.user_id, CURRENT_DATE, 1, v_service_price)
    ON CONFLICT (user_id, metric_date)
    DO UPDATE SET
      bookings_count = daily_metrics.bookings_count + 1,
      revenue = daily_metrics.revenue + v_service_price,
      updated_at = now();

    RETURN NEW;
  END IF;

  -- Contact matching
  IF NEW.customer_email IS NOT NULL AND NEW.customer_email <> '' THEN
    SELECT id INTO v_lead_id
    FROM leads WHERE user_id = NEW.user_id AND email = NEW.customer_email LIMIT 1;
  END IF;

  IF v_lead_id IS NULL AND NEW.customer_phone IS NOT NULL AND NEW.customer_phone <> '' THEN
    SELECT id INTO v_lead_id
    FROM leads WHERE user_id = NEW.user_id AND phone = NEW.customer_phone LIMIT 1;
  END IF;

  -- Get first pipeline stage
  SELECT id INTO v_stage_id
  FROM pipeline_stages WHERE user_id = NEW.user_id ORDER BY sort_order ASC LIMIT 1;

  IF v_lead_id IS NOT NULL THEN
    v_is_existing := true;
    UPDATE leads SET
      last_activity_at = now(),
      updated_at = now()
    WHERE id = v_lead_id;
  ELSE
    INSERT INTO leads (user_id, name, email, phone, source, stage_id)
    VALUES (
      NEW.user_id,
      NEW.customer_name,
      NULLIF(NEW.customer_email, ''),
      NULLIF(NEW.customer_phone, ''),
      'booking'::lead_source,
      v_stage_id
    )
    RETURNING id INTO v_lead_id;
  END IF;

  -- Link booking to lead
  NEW.lead_id := v_lead_id;

  -- Log activity
  IF v_lead_id IS NOT NULL THEN
    INSERT INTO contact_activities (user_id, lead_id, activity_type, title, description, occurred_at)
    VALUES (NEW.user_id, v_lead_id, 'booking_created',
      CASE WHEN v_is_existing THEN 'Returning customer booked' ELSE 'New booking created' END || ': ' || NEW.customer_name,
      'Scheduled: ' || NEW.start_datetime::text,
      now());
  END IF;

  -- Get service price for revenue
  IF NEW.service_id IS NOT NULL THEN
    SELECT COALESCE(price, 0) INTO v_service_price FROM booking_services WHERE id = NEW.service_id;
  END IF;

  -- Update daily metrics
  INSERT INTO daily_metrics (user_id, metric_date, bookings_count, leads_count, revenue)
  VALUES (NEW.user_id, CURRENT_DATE,
    1,
    CASE WHEN v_is_existing THEN 0 ELSE 1 END,
    v_service_price)
  ON CONFLICT (user_id, metric_date)
  DO UPDATE SET
    bookings_count = daily_metrics.bookings_count + 1,
    leads_count = daily_metrics.leads_count + CASE WHEN v_is_existing THEN 0 ELSE 1 END,
    revenue = daily_metrics.revenue + v_service_price,
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Create trigger (drop if exists to avoid duplicates)
DROP TRIGGER IF EXISTS trg_booking_lead_capture ON public.bookings;
CREATE TRIGGER trg_booking_lead_capture
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.on_booking_created();
