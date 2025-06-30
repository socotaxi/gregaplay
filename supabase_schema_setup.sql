-- Script to set up Supabase database schema for Grega Play

-- Create profiles table (required for authentication)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Row Level Security for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create policy to allow insertion of profiles (during signup)
CREATE POLICY "Allow insertion of profiles"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  max_videos INTEGER DEFAULT 10,
  status TEXT CHECK (status IN ('open', 'processing', 'done')) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  final_video_url TEXT
);

-- Row Level Security for events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own events
CREATE POLICY "Users can read their own events"
  ON events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to update their own events
CREATE POLICY "Users can update their own events"
  ON events
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert events
CREATE POLICY "Users can insert events"
  ON events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  participant_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  duration INTEGER,
  status TEXT CHECK (status IN ('uploading', 'processing', 'ready', 'error')) DEFAULT 'uploading',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Row Level Security for videos table
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read videos related to their events
CREATE POLICY "Users can read videos from their events"
  ON videos
  FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM events WHERE id = videos.event_id
  ));

-- Create policy to allow event creators or invited users to insert videos
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

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Row Level Security for notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own notifications
CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);
