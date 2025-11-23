-- ================================================================
-- 002_workspaces_channels.sql
-- 
-- Workspace & Channel Communication System
-- 
-- Purpose: Core chat infrastructure for team communication
-- Dependencies: 001_auth_users.sql
-- 
-- Features:
-- - Public/private/voice channels
-- - Channel messages with attachments and reactions
-- - Message editing, replies, and reactions
-- 
-- Rollback:
-- DROP TABLE public.messages;
-- DROP TABLE public.channels;
-- ================================================================

-- ================================================================
-- CHANNELS TABLE
-- ================================================================
CREATE TABLE public.channels (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  description text,
  type text DEFAULT 'public' CHECK (type IN ('public', 'private', 'voice')),
  created_by uuid REFERENCES public.users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- MESSAGES TABLE
-- ================================================================
CREATE TABLE public.messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  channel_id uuid REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) NOT NULL,
  content text,
  attachments jsonb DEFAULT '[]'::jsonb, -- Stores array of file URLs/metadata
  reactions jsonb DEFAULT '{}'::jsonb,   -- Stores reactions like {"👍": ["user_id_1", "user_id_2"]}
  reply_to_id uuid REFERENCES public.messages(id),
  is_edited boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- ROW LEVEL SECURITY - CHANNELS
-- ================================================================
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Channels are viewable by everyone (for now - can be restricted later)
CREATE POLICY "Channels are viewable by everyone."
  ON public.channels FOR SELECT
  USING (true);

-- Authenticated users can create channels
CREATE POLICY "Authenticated users can create channels."
  ON public.channels FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Channel creators can update their channels
CREATE POLICY "Channel creators can update their channels."
  ON public.channels FOR UPDATE
  USING (auth.uid() = created_by);

-- ================================================================
-- ROW LEVEL SECURITY - MESSAGES
-- ================================================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages are viewable by everyone (for now - can be restricted later)
CREATE POLICY "Messages are viewable by everyone."
  ON public.messages FOR SELECT
  USING (true);

-- Authenticated users can insert messages
CREATE POLICY "Authenticated users can insert messages."
  ON public.messages FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own messages
CREATE POLICY "Users can update their own messages."
  ON public.messages FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages."
  ON public.messages FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON public.messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON public.messages(reply_to_id);

CREATE INDEX IF NOT EXISTS idx_channels_type ON public.channels(type);
CREATE INDEX IF NOT EXISTS idx_channels_created_by ON public.channels(created_by);

-- ================================================================
-- SEED DATA
-- ================================================================
-- Insert default general channel
INSERT INTO public.channels (name, description, type)
VALUES ('general', 'General discussion for everyone', 'public');