
-- Fix: Require that public booking inserts must have a valid user_id (the card owner)
DROP POLICY "Public can create bookings" ON public.bookings;
CREATE POLICY "Public can create bookings" ON public.bookings FOR INSERT
  WITH CHECK (user_id IS NOT NULL AND customer_name IS NOT NULL);

-- Fix: Require analytics inserts have valid handle and user_id
DROP POLICY "Public can insert analytics" ON public.analytics_events;
CREATE POLICY "Public can insert analytics" ON public.analytics_events FOR INSERT
  WITH CHECK (user_id IS NOT NULL AND handle IS NOT NULL);
