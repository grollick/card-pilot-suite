CREATE OR REPLACE FUNCTION public.get_busy_times_by_user(p_user_id uuid)
RETURNS TABLE(start_datetime timestamptz, end_datetime timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT b.start_datetime, b.end_datetime
  FROM public.bookings b
  WHERE b.user_id = p_user_id
    AND b.status::text IN ('requested','pending','confirmed')
    AND b.end_datetime >= now()
    AND b.start_datetime <= now() + interval '60 days'
$$;
REVOKE ALL ON FUNCTION public.get_busy_times_by_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_busy_times_by_user(uuid) TO anon, authenticated;