-- Restrict video insertion to authenticated users invited to the event
DROP POLICY IF EXISTS "Anyone can insert videos" ON videos;
CREATE POLICY "Invited users can insert videos"
  ON videos
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND can_access_event(event_id, auth.jwt()->>'email')
  );
