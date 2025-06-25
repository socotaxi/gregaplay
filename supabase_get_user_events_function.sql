CREATE OR REPLACE FUNCTION get_user_events(p_user_id UUID, p_user_email TEXT)
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
  SELECT * FROM (
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
    WHERE e.user_id = p_user_id

    UNION

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
    WHERE i.email = p_user_email
      AND i.status IN ('pending', 'accepted')
  ) AS combined
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_events(UUID, TEXT) TO authenticated;
