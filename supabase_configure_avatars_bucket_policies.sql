-- Configure RLS policies for the "avatars" storage bucket

-- Enable row level security on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read files from the avatars bucket
CREATE POLICY "Public read access to avatars"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- Allow authenticated users to insert files into the avatars bucket
CREATE POLICY "Authenticated insert into avatars"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND auth.uid() IS NOT NULL
  );

-- Allow authenticated users to update files within the avatars bucket
CREATE POLICY "Authenticated update avatars"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars' AND auth.uid() IS NOT NULL
  )
  WITH CHECK (bucket_id = 'avatars');
