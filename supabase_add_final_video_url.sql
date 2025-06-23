-- Add final_video_url column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS final_video_url TEXT;
