
-- Create storage bucket for card assets (avatars, backdrops)
INSERT INTO storage.buckets (id, name, public)
VALUES ('card-assets', 'card-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own card assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'card-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own card assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'card-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own card assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'card-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access for card assets
CREATE POLICY "Public can view card assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'card-assets');
