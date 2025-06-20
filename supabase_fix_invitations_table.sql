-- Fix invitations table with all required columns
-- Drop existing table if it exists (be careful in production)
DROP TABLE IF EXISTS invitations CASCADE;

-- Create invitations table with all required columns
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) NOT NULL,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'expired')) DEFAULT 'pending',
  invited_by UUID REFERENCES auth.users(id),
  message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS invitations_event_id_idx ON invitations(event_id);
CREATE INDEX IF NOT EXISTS invitations_token_idx ON invitations(token);
CREATE INDEX IF NOT EXISTS invitations_email_idx ON invitations(email);
CREATE INDEX IF NOT EXISTS invitations_status_idx ON invitations(status);

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

-- Create policy to allow event creators to update invitations
CREATE POLICY "Event creators can update invitations"
  ON invitations
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM events WHERE id = invitations.event_id
    )
  );

-- Create policy to allow anyone to read invitations by token (for acceptance)
CREATE POLICY "Anyone can read invitations by token"
  ON invitations
  FOR SELECT
  USING (token IS NOT NULL);

-- Create policy to allow anyone to update invitation status by token
CREATE POLICY "Anyone can update invitation status by token"
  ON invitations
  FOR UPDATE
  USING (token IS NOT NULL);

-- Create function to generate secure tokens (if not exists)
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to accept invitations atomically
CREATE OR REPLACE FUNCTION accept_invitation(
  invitation_token TEXT,
  user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Get invitation details
  SELECT * INTO invitation_record
  FROM invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update invitation status
  UPDATE invitations
  SET status = 'accepted',
      responded_at = NOW()
  WHERE token = invitation_token;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for invitation statistics
CREATE OR REPLACE VIEW invitation_stats AS
SELECT 
  event_id,
  COUNT(*) as total_invitations,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_invitations,
  COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_invitations,
  COUNT(CASE WHEN status = 'declined' THEN 1 END) as declined_invitations,
  COUNT(CASE WHEN status = 'expired' OR expires_at < NOW() THEN 1 END) as expired_invitations
FROM invitations
GROUP BY event_id;
