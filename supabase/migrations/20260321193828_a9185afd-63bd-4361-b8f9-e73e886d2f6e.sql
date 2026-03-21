-- Allow anyone to read profiles that have a handle set (public business cards)
CREATE POLICY "Anyone can view published profiles"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (handle IS NOT NULL AND is_suspended IS NOT TRUE);