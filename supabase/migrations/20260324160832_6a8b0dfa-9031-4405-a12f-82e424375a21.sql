
-- Re-add public profiles SELECT policy (scoped to profiles with a handle)
-- This allows the public card viewer to fetch profile data by handle
CREATE POLICY "Public can view profiles by handle"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (handle IS NOT NULL);
