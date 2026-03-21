CREATE POLICY "Authenticated users can insert professions"
  ON public.professions FOR INSERT TO authenticated
  WITH CHECK (true);