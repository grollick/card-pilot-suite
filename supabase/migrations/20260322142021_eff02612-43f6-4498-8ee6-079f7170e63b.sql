
-- 1. Drop the overly broad anon SELECT policy
DROP POLICY IF EXISTS "Public can view active services by user" ON public.booking_services;

-- 2. Create a SECURITY DEFINER function to fetch services scoped to a handle
CREATE OR REPLACE FUNCTION public.get_services_by_handle(p_handle text)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  duration_min integer,
  price numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT bs.id, bs.name, bs.description, bs.duration_min, bs.price
  FROM booking_services bs
  JOIN profiles p ON p.id = bs.user_id
  WHERE p.handle = lower(trim(p_handle))
    AND bs.active = true
  ORDER BY bs.name;
$$;
