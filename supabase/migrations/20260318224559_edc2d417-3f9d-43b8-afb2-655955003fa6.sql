
-- Function to increment boost views for a user (called from client when boosted listing is displayed)
CREATE OR REPLACE FUNCTION public.increment_boost_views(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE neighborhood_boosts
  SET views_count = views_count + 1,
      updated_at = now()
  WHERE user_id = p_user_id
    AND status = 'active'
    AND expires_at > now();
END;
$$;

-- Function to increment boost leads for a user (called from trigger)
CREATE OR REPLACE FUNCTION public.increment_boost_leads()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE neighborhood_boosts
  SET leads_count = leads_count + 1,
      updated_at = now()
  WHERE user_id = NEW.user_id
    AND status = 'active'
    AND expires_at > now();
  RETURN NEW;
END;
$$;

-- Function to increment boost bookings for a user (called from trigger)
CREATE OR REPLACE FUNCTION public.increment_boost_bookings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE neighborhood_boosts
  SET bookings_count = bookings_count + 1,
      updated_at = now()
  WHERE user_id = NEW.user_id
    AND status = 'active'
    AND expires_at > now();
  RETURN NEW;
END;
$$;

-- Trigger: when a new lead is created, increment boost leads
CREATE TRIGGER trg_boost_lead_increment
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_boost_leads();

-- Trigger: when a new booking is created, increment boost bookings
CREATE TRIGGER trg_boost_booking_increment
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_boost_bookings();
