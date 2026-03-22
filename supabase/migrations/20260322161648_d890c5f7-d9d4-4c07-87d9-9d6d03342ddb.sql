
-- Add file type validation for feedback-screenshots uploads
-- Drop and recreate with MIME type restriction
DROP POLICY IF EXISTS "Authenticated users can upload feedback screenshots" ON storage.objects;
CREATE POLICY "Authenticated users can upload feedback screenshots"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'feedback-screenshots'
    AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'gif', 'webp'))
  );

-- Add file type validation for card-assets uploads
DROP POLICY IF EXISTS "Users can upload own card assets" ON storage.objects;
CREATE POLICY "Users can upload own card assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'card-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico'))
  );
