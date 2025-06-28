-- Drop old policy and allow creators or invited users to add videos
DROP POLICY IF EXISTS "Invited users can insert videos" ON videos;
CREATE POLICY "Creators and invited users can insert videos"
  ON videos
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      auth.uid() = (SELECT user_id FROM events WHERE id = event_id)
      OR can_access_event(event_id, auth.jwt()->>'email')
    )
  );
