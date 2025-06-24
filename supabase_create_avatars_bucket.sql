-- Create "avatars" bucket if it doesn't exist
-- Adjust the privacy (public) as needed
INSERT INTO storage.buckets (id, name, public)
SELECT 'avatars', 'avatars', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'avatars'
);
