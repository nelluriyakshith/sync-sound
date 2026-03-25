-- Create a shared audio bucket for room tracks
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'room-audio',
  'room-audio',
  true,
  104857600,
  ARRAY['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/mp4','audio/aac','audio/ogg','audio/webm']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Ensure deterministic policy state
DROP POLICY IF EXISTS "Public can read room audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload room audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own room audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own room audio" ON storage.objects;

-- Public read for playback across all devices
CREATE POLICY "Public can read room audio"
ON storage.objects
FOR SELECT
USING (bucket_id = 'room-audio');

-- Authenticated users can upload only into their own root folder: {user_id}/...
CREATE POLICY "Authenticated can upload room audio"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'room-audio'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own room audio"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'room-audio'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'room-audio'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own room audio"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'room-audio'
  AND auth.uid()::text = (storage.foldername(name))[1]
);