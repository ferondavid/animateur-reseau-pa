-- =====================================================
-- Création des buckets Storage + policies
-- À jouer dans Supabase SQL Editor
-- =====================================================

-- Bucket photos-remontees (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos-remontees',
  'photos-remontees',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/heic','application/pdf','video/mp4','video/quicktime','audio/mpeg','audio/mp4']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Bucket news-images (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'news-images',
  'news-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ---- Policies photos-remontees ----

-- Lecture publique
CREATE POLICY IF NOT EXISTS "photos_remontees_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'photos-remontees');

-- Upload par anon (membres non authentifiés)
CREATE POLICY IF NOT EXISTS "photos_remontees_anon_insert"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'photos-remontees');

-- Suppression par authenticated
CREATE POLICY IF NOT EXISTS "photos_remontees_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'photos-remontees');

-- ---- Policies news-images ----

CREATE POLICY IF NOT EXISTS "news_images_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'news-images');

CREATE POLICY IF NOT EXISTS "news_images_auth_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'news-images');
