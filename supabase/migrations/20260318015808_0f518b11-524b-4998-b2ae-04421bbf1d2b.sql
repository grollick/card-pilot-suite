
CREATE OR REPLACE FUNCTION public.check_contact_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_plan text;
  v_limit int;
  v_current_count int;
BEGIN
  SELECT COALESCE(plan, 'starter') INTO v_plan
  FROM profiles WHERE id = NEW.user_id;

  IF v_plan IS DISTINCT FROM 'starter' THEN
    RETURN NEW;
  END IF;

  v_limit := 100;

  SELECT COUNT(*) INTO v_current_count
  FROM leads WHERE user_id = NEW.user_id;

  IF v_current_count >= v_limit THEN
    RAISE EXCEPTION 'Contact limit reached (% / %). Please upgrade your plan.', v_current_count, v_limit
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_contact_limit
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.check_contact_limit();

CREATE OR REPLACE FUNCTION public.check_service_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_plan text;
  v_limit int;
  v_current_count int;
BEGIN
  SELECT COALESCE(plan, 'starter') INTO v_plan
  FROM profiles WHERE id = NEW.user_id;

  IF v_plan IS DISTINCT FROM 'starter' THEN
    RETURN NEW;
  END IF;

  v_limit := 3;

  SELECT COUNT(*) INTO v_current_count
  FROM booking_services WHERE user_id = NEW.user_id AND active = true;

  IF v_current_count >= v_limit THEN
    RAISE EXCEPTION 'Service limit reached (% / %). Please upgrade your plan.', v_current_count, v_limit
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_service_limit
  BEFORE INSERT ON public.booking_services
  FOR EACH ROW
  EXECUTE FUNCTION public.check_service_limit();
