CREATE OR REPLACE FUNCTION get_invited_events(user_email TEXT)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    title TEXT,
    description TEXT,
    theme TEXT,
    deadline TIMESTAMPTZ,
    max_videos INTEGER,
    status TEXT,
    created_at TIMESTAMPTZ,
    final_video_url TEXT,
    video_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.user_id,
    e.title,
    e.description,
    e.theme,
    e.deadline,
    e.max_videos,
    e.status,
    e.created_at,
    e.final_video_url,
    (
      SELECT COUNT(*) FROM videos v WHERE v.event_id = e.id
    ) AS video_count
  FROM events e
  JOIN invitations i ON e.id = i.event_id
  WHERE i.email = user_email
    AND i.status IN ('pending', 'accepted')
  ORDER BY e.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_invited_events(TEXT) TO authenticated;
