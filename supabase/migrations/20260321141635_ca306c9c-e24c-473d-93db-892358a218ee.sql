-- Drop the insecure public INSERT policy on reviews
DROP POLICY IF EXISTS "Public can insert reviews" ON public.reviews;

-- Tighten ab_test_events INSERT policy to only allow valid active test variants
DROP POLICY IF EXISTS "Anyone can insert events" ON public.ab_test_events;

CREATE POLICY "Insert events for active test variants only"
ON public.ab_test_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  variant_id IN (
    SELECT v.id FROM ab_test_variants v
    JOIN ab_tests t ON t.id = v.test_id
    WHERE t.status = 'active'
  )
  AND test_id IN (
    SELECT id FROM ab_tests WHERE status = 'active'
  )
);