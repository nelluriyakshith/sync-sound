DROP POLICY IF EXISTS "Public can read room audio" ON storage.objects;

CREATE POLICY "Authenticated can read room audio"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'room-audio');