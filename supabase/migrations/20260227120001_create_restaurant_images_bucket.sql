-- Create public bucket for restaurant cover photos and logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-images', 'restaurant-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read restaurant images (public bucket)
CREATE POLICY "Public read restaurant images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'restaurant-images');

-- Allow authenticated users to upload/update/delete their restaurant images
CREATE POLICY "Authenticated manage restaurant images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'restaurant-images');

CREATE POLICY "Authenticated update restaurant images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'restaurant-images');

CREATE POLICY "Authenticated delete restaurant images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'restaurant-images');
