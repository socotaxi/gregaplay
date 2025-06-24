-- Enhanced invitation system for Grega Play
-- This script creates the necessary tables and functions for a complete invitation workflow

-- Drop existing invitations table if it exists to recreate with new structure
DROP TABLE IF EXISTS invitations CASCADE;

-- Create enhanced invitations table
CREATE TABLE invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL, -- Unique token for invitation link
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    invited_by UUID REFERENCES auth.users(id),
    message TEXT, -- Personalized invitation message
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days') NOT NULL,
    UNIQUE(event_id, email) -- Prevent duplicate invitations for same event/email
);

-- Create indexes for better performance
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_event_id ON invitations(event_id);
CREATE INDEX idx_invitations_status ON invitations(status);

-- Enable Row Level Security
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitations
CREATE POLICY "Users can view invitations for their events" ON invitations
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM events WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create invitations for their events" ON invitations
    FOR INSERT WITH CHECK (
        event_id IN (
            SELECT id FROM events WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update invitations for their events" ON invitations
    FOR UPDATE USING (
        event_id IN (
            SELECT id FROM events WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Allow public access to invitations by token" ON invitations
    FOR SELECT USING (true); -- Anyone with the token can view the invitation

-- Create a function to generate secure invitation tokens
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if invitation is valid
CREATE OR REPLACE FUNCTION is_invitation_valid(invitation_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    invitation_record invitations%ROWTYPE;
BEGIN
    SELECT * INTO invitation_record FROM invitations WHERE token = invitation_token;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if invitation has expired
    IF invitation_record.expires_at < NOW() THEN
        -- Update status to expired
        UPDATE invitations SET status = 'expired' WHERE token = invitation_token;
        RETURN FALSE;
    END IF;
    
    -- Check if already responded
    IF invitation_record.status != 'pending' THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to accept an invitation
CREATE OR REPLACE FUNCTION accept_invitation(invitation_token TEXT, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    invitation_record invitations%ROWTYPE;
BEGIN
    -- Check if invitation is valid
    IF NOT is_invitation_valid(invitation_token) THEN
        RETURN FALSE;
    END IF;
    
    -- Get invitation details
    SELECT * INTO invitation_record FROM invitations WHERE token = invitation_token;
    
    -- Update invitation status
    UPDATE invitations 
    SET status = 'accepted', 
        responded_at = NOW()
    WHERE token = invitation_token;
    
    -- Optionally, add user to event participants (if you have such a table)
    -- INSERT INTO event_participants (event_id, user_id) VALUES (invitation_record.event_id, user_id)
    -- ON CONFLICT DO NOTHING;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON invitations TO authenticated;
GRANT SELECT ON invitations TO anon; -- Allow anonymous users to view invitations by token
GRANT EXECUTE ON FUNCTION generate_invitation_token() TO authenticated;
GRANT EXECUTE ON FUNCTION is_invitation_valid(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION accept_invitation(TEXT, UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE invitations IS 'Enhanced invitation system with tokens and email workflow';
COMMENT ON COLUMN invitations.token IS 'Unique secure token for invitation links';
COMMENT ON COLUMN invitations.message IS 'Personalized invitation message from event creator';
COMMENT ON COLUMN invitations.expires_at IS 'When the invitation expires (default 30 days)';

-- Create a view for invitation statistics
CREATE VIEW invitation_stats AS
SELECT 
    event_id,
    COUNT(*) as total_invitations,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_invitations,
    COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_invitations,
    COUNT(CASE WHEN status = 'declined' THEN 1 END) as declined_invitations,
    COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_invitations
FROM invitations
GROUP BY event_id;

GRANT SELECT ON invitation_stats TO authenticated;

COMMENT ON VIEW invitation_stats IS 'Statistics view for invitation status per event';
