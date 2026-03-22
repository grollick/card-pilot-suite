-- Add SELECT policy to marketplace_quote_requests so only admins can read rows
-- Anonymous/authenticated users should NOT be able to read customer PII

CREATE POLICY "Only admins can read quote requests"
ON public.marketplace_quote_requests
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'founder')
);
