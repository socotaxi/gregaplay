-- Function to check if a user can access an event
CREATE OR REPLACE FUNCTION can_access_event(p_event_id uuid, p_user_email text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM invitations i
    WHERE i.event_id = p_event_id
      AND i.email = p_user_email
      AND i.status IN ('pending', 'accepted')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION can_access_event(uuid, text) TO authenticated;
