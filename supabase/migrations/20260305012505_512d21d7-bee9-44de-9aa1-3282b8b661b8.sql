CREATE POLICY "Public can view cards by user"
ON public.cards
FOR SELECT
TO anon, authenticated
USING (true);