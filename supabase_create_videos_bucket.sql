-- Create "videos" bucket if it doesn't exist
-- This bucket stores submitted video clips
INSERT INTO storage.buckets (id, name, public)
SELECT 'videos', 'videos', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'videos'
);
