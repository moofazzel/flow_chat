-- Voice Sessions Table
-- This table tracks active users in voice channels and their states

CREATE TABLE IF NOT EXISTS voice_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  is_muted BOOLEAN DEFAULT false,
  is_deafened BOOLEAN DEFAULT false,
  is_video_enabled BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, channel_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_sessions_channel ON voice_sessions(channel_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user ON voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_active ON voice_sessions(channel_id, joined_at);

-- Enable Row Level Security
ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view voice sessions in their servers" ON voice_sessions;
DROP POLICY IF EXISTS "Users can manage their own voice sessions" ON voice_sessions;

-- Policy: Users can view voice sessions in channels they have access to
CREATE POLICY "Users can view voice sessions in their servers"
  ON voice_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM channels c
      JOIN server_members sm ON sm.server_id = c.server_id
      WHERE c.id = voice_sessions.channel_id
        AND sm.user_id = auth.uid()
    )
  );

-- Policy: Users can manage their own voice sessions
CREATE POLICY "Users can manage their own voice sessions"
  ON voice_sessions FOR ALL
  USING (user_id = auth.uid());

-- Function to clean up stale sessions
CREATE OR REPLACE FUNCTION cleanup_stale_voice_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM voice_sessions
  WHERE last_activity < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Function to update last activity timestamp
CREATE OR REPLACE FUNCTION update_voice_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update last_activity on UPDATE
DROP TRIGGER IF EXISTS update_voice_session_activity_trigger ON voice_sessions;
CREATE TRIGGER update_voice_session_activity_trigger
  BEFORE UPDATE ON voice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_voice_session_activity();
