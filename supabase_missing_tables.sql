-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) NOT NULL,
  email TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Row Level Security for invitations table
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow event creators to read invitations for their events
CREATE POLICY "Event creators can read invitations"
  ON invitations
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM events WHERE id = invitations.event_id
    )
  );

-- Create policy to allow event creators to insert invitations
CREATE POLICY "Event creators can insert invitations"
  ON invitations
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM events WHERE id = invitations.event_id
    )
  );

-- Create participants view from videos table
-- This will ensure compatibility with existing code while using the videos table
CREATE OR REPLACE VIEW participants AS
SELECT 
  event_id,
  COUNT(*) as count
FROM videos
GROUP BY event_id;
