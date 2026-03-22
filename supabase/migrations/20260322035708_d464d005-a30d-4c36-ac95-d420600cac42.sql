DROP POLICY IF EXISTS "Anyone can submit a quote request" ON public.marketplace_quote_requests;
CREATE POLICY "Anyone can submit a quote request"
ON public.marketplace_quote_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  customer_name IS NOT NULL AND customer_name <> ''
);