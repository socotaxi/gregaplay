-- Configure RLS policies for the "videos" storage bucket

-- Enable row level security on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read files from the videos bucket
CREATE POLICY "Public read access to videos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'videos');

-- Allow anyone to insert files into the videos bucket (for public submissions)
CREATE POLICY "Anyone can insert into videos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'videos');

-- Allow authenticated users to update files within the videos bucket
CREATE POLICY "Authenticated update videos"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'videos' AND auth.uid() IS NOT NULL
  )
  WITH CHECK (bucket_id = 'videos');
