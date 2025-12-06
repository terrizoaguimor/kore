-- Storage bucket for files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'files',
  'files',
  false,
  52428800, -- 50MB limit per file
  ARRAY['image/*', 'video/*', 'audio/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.*', 'application/vnd.ms-excel', 'application/vnd.ms-powerpoint', 'text/*', 'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed']
) ON CONFLICT (id) DO NOTHING;

-- Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage bucket for thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails',
  'thumbnails',
  true,
  1048576, -- 1MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for files bucket
CREATE POLICY "Users can upload files to their organization folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'files' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM organization_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view files in their organization"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'files' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM organization_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update files in their organization"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'files' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM organization_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete files in their organization"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'files' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM organization_members WHERE user_id = auth.uid()
  )
);

-- Storage policies for avatars bucket (public read)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policies for thumbnails bucket
CREATE POLICY "Anyone can view thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

CREATE POLICY "System can manage thumbnails"
ON storage.objects FOR ALL
USING (
  bucket_id = 'thumbnails' AND
  auth.role() = 'service_role'
);
