
-- Tighten anonymous insert policies to require a business_id reference
DROP POLICY "Anyone can submit leads" ON public.business_leads;
CREATE POLICY "Anyone can submit leads" ON public.business_leads FOR INSERT TO anon
  WITH CHECK (business_id IS NOT NULL AND full_name IS NOT NULL);

DROP POLICY "Anyone can create bookings" ON public.business_bookings;
CREATE POLICY "Anyone can create bookings" ON public.business_bookings FOR INSERT TO anon
  WITH CHECK (business_id IS NOT NULL AND customer_name IS NOT NULL);

DROP POLICY "Anyone can submit reviews" ON public.business_reviews;
CREATE POLICY "Anyone can submit reviews" ON public.business_reviews FOR INSERT TO anon
  WITH CHECK (business_id IS NOT NULL AND reviewer_name IS NOT NULL AND rating IS NOT NULL);
