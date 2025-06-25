-- Update events read policy to allow invited users
-- Drops the old "Users can read their own events" policy and replaces it
-- with a policy that also grants access to users who have pending or
-- accepted invitations.

DROP POLICY IF EXISTS "Users can read their own events" ON events;

CREATE POLICY "Users can read events they created or were invited to"
  ON events
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR id IN (
      SELECT event_id
      FROM invitations
      WHERE email = (auth.jwt()->>'email')
        AND status IN ('pending', 'accepted')
    )
  );
