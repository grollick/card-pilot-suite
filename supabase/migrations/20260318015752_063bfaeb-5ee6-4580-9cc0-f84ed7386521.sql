
CREATE OR REPLACE FUNCTION public.check_booking_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_plan text;
  v_monthly_limit int;
  v_current_count int;
BEGIN
  -- Get user plan
  SELECT COALESCE(plan, 'starter') INTO v_plan
  FROM profiles WHERE id = NEW.user_id;

  -- Only enforce on starter plan
  IF v_plan IS DISTINCT FROM 'starter' THEN
    RETURN NEW;
  END IF;

  v_monthly_limit := 200;

  SELECT COUNT(*) INTO v_current_count
  FROM bookings
  WHERE user_id = NEW.user_id
    AND created_at >= date_trunc('month', now())
    AND created_at < date_trunc('month', now()) + interval '1 month';

  IF v_current_count >= v_monthly_limit THEN
    RAISE EXCEPTION 'Monthly booking limit reached (% / %). Please upgrade your plan.', v_current_count, v_monthly_limit
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_booking_limit
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_booking_limit();
