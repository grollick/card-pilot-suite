
-- Fix 1: Restrict professions INSERT to admin only
DROP POLICY IF EXISTS "Authenticated users can insert professions" ON professions;
CREATE POLICY "Admins can insert professions"
  ON professions FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Replace overly broad profiles SELECT policy with restricted version
DROP POLICY IF EXISTS "Anyone can view published profiles" ON profiles;

-- Grant access to the public_profiles view (safe columns only)
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Fix 3: Create private feedback-screenshots bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-screenshots', 'feedback-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for feedback-screenshots: authenticated users can upload
CREATE POLICY "Authenticated users can upload feedback screenshots"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'feedback-screenshots');

-- Admins can read feedback screenshots
CREATE POLICY "Admins can read feedback screenshots"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'feedback-screenshots' AND has_role(auth.uid(), 'admin'::app_role));
