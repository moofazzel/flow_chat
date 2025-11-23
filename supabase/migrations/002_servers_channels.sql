-- ================================================================
-- 002_servers_channels.sql
-- 
-- Server/Group Workspaces & Channel Messaging System
-- 
-- Purpose: Discord-style servers with text/voice channels
-- Dependencies: 001_auth_users.sql
-- 
-- Features:
-- - Server workspaces (groups)
-- - Server membership with roles
-- - Text and voice channels
-- - Channel messages with threading
-- - Message reactions
-- - Rich embeds (task cards, links)
-- 
-- Rollback:
-- DROP TABLE public.reactions;
-- DROP TABLE public.message_threads;
-- DROP TABLE public.messages;
-- DROP TABLE public.channels;
-- DROP TABLE public.server_members;
-- DROP TABLE public.servers;
-- ================================================================

-- ================================================================
-- SERVERS TABLE (Workspaces/Groups)
-- ================================================================
CREATE TABLE public.servers (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon_url text,
  owner_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- SERVER_MEMBERS TABLE (Server Membership)
-- ================================================================
CREATE TABLE public.server_members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  server_id uuid REFERENCES public.servers(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  nickname text, -- Server-specific nickname
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  UNIQUE(server_id, user_id)
);

-- ================================================================
-- CHANNELS TABLE (Text/Voice Channels)
-- ================================================================
CREATE TABLE public.channels (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  server_id uuid REFERENCES public.servers(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  type text DEFAULT 'text' CHECK (type IN ('text', 'voice', 'announcement')),
  category text, -- e.g., "GENERAL", "PROJECTS", "VOICE CHANNELS"
  position integer DEFAULT 0, -- For sorting
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  UNIQUE(server_id, name)
);

-- ================================================================
-- MESSAGES TABLE (Channel Messages)
-- ================================================================
CREATE TABLE public.messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  channel_id uuid REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content text,
  message_type text DEFAULT 'user_message' CHECK (message_type IN (
    'user_message', 'system', 'bot', 'task_created', 'task_completed', 'task_assigned'
  )),
  attachments jsonb DEFAULT '[]'::jsonb, -- [{url, type, name, size}]
  embeds jsonb DEFAULT '[]'::jsonb, -- [{type: 'task', task_id: uuid}, {type: 'link', url, title, description}]
  mentions jsonb DEFAULT '[]'::jsonb, -- Array of user_ids
  reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  thread_id uuid, -- For threaded conversations (references message_threads.id)
  is_pinned boolean DEFAULT false,
  is_edited boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- REACTIONS TABLE (Message Reactions)
-- ================================================================
CREATE TABLE public.reactions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  emoji text NOT NULL, -- e.g., "👍", "❤️", "🔥"
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  UNIQUE(message_id, user_id, emoji)
);

-- ================================================================
-- MESSAGE_THREADS TABLE (Thread Metadata)
-- ================================================================
CREATE TABLE public.message_threads (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  parent_message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL UNIQUE,
  channel_id uuid REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
  reply_count integer DEFAULT 0,
  last_reply_at timestamp with time zone,
  participants jsonb DEFAULT '[]'::jsonb, -- Array of user_ids
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- ROW LEVEL SECURITY - SERVERS
-- ================================================================
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;

-- Everyone can view public servers
CREATE POLICY "Servers are viewable by everyone."
  ON public.servers FOR SELECT
  USING (true);

-- Authenticated users can create servers
CREATE POLICY "Auth users can create servers."
  ON public.servers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Server owners can update their servers
CREATE POLICY "Server owners can update their servers."
  ON public.servers FOR UPDATE
  USING (auth.uid() = owner_id);

-- Server owners can delete their servers
CREATE POLICY "Server owners can delete their servers."
  ON public.servers FOR DELETE
  USING (auth.uid() = owner_id);

-- ================================================================
-- ROW LEVEL SECURITY - SERVER_MEMBERS
-- ================================================================
ALTER TABLE public.server_members ENABLE ROW LEVEL SECURITY;

-- Members can view server membership
CREATE POLICY "Server members can view membership."
  ON public.server_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.server_members sm
      WHERE sm.server_id = server_members.server_id
      AND sm.user_id = auth.uid()
    )
  );

-- Server owners/admins can add members
CREATE POLICY "Server owners/admins can add members."
  ON public.server_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.servers s
      WHERE s.id = server_members.server_id
      AND (
        s.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.server_members sm
          WHERE sm.server_id = server_members.server_id
          AND sm.user_id = auth.uid()
          AND sm.role IN ('owner', 'admin')
        )
      )
    )
  );

-- Owners/admins can update roles, users can update their own nickname
CREATE POLICY "Owners/admins can update roles, users can update nickname."
  ON public.server_members FOR UPDATE
  USING (
    auth.uid() = user_id -- Own record
    OR EXISTS (
      SELECT 1 FROM public.servers s
      WHERE s.id = server_members.server_id
      AND s.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.server_members sm
      WHERE sm.server_id = server_members.server_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'admin')
    )
  );

-- Owners/admins can remove members
CREATE POLICY "Owners/admins can remove members."
  ON public.server_members FOR DELETE
  USING (
    auth.uid() = user_id -- Can leave server
    OR EXISTS (
      SELECT 1 FROM public.servers s
      WHERE s.id = server_members.server_id
      AND s.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.server_members sm
      WHERE sm.server_id = server_members.server_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'admin')
    )
  );

-- ================================================================
-- ROW LEVEL SECURITY - CHANNELS
-- ================================================================
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Server members can view channels
CREATE POLICY "Server members can view channels."
  ON public.channels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.server_members sm
      WHERE sm.server_id = channels.server_id
      AND sm.user_id = auth.uid()
    )
  );

-- Server owners/admins can create channels
CREATE POLICY "Server owners/admins can create channels."
  ON public.channels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.servers s
      WHERE s.id = channels.server_id
      AND (
        s.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.server_members sm
          WHERE sm.server_id = channels.server_id
          AND sm.user_id = auth.uid()
          AND sm.role IN ('owner', 'admin')
        )
      )
    )
  );

-- Server owners/admins can update channels
CREATE POLICY "Server owners/admins can update channels."
  ON public.channels FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.servers s
      WHERE s.id = channels.server_id
      AND (
        s.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.server_members sm
          WHERE sm.server_id = channels.server_id
          AND sm.user_id = auth.uid()
          AND sm.role IN ('owner', 'admin')
        )
      )
    )
  );

-- Server owners/admins can delete channels
CREATE POLICY "Server owners/admins can delete channels."
  ON public.channels FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.servers s
      WHERE s.id = channels.server_id
      AND (
        s.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.server_members sm
          WHERE sm.server_id = channels.server_id
          AND sm.user_id = auth.uid()
          AND sm.role IN ('owner', 'admin')
        )
      )
    )
  );

-- ================================================================
-- ROW LEVEL SECURITY - MESSAGES
-- ================================================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Server members can view messages in channels
CREATE POLICY "Server members can view messages."
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.channels c
      JOIN public.server_members sm ON sm.server_id = c.server_id
      WHERE c.id = messages.channel_id
      AND sm.user_id = auth.uid()
    )
  );

-- Server members can send messages
CREATE POLICY "Server members can send messages."
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM public.channels c
      JOIN public.server_members sm ON sm.server_id = c.server_id
      WHERE c.id = messages.channel_id
      AND sm.user_id = auth.uid()
    )
  );

-- Authors can update their own messages
CREATE POLICY "Authors can update their own messages."
  ON public.messages FOR UPDATE
  USING (auth.uid() = author_id);

-- Authors and admins can delete messages
CREATE POLICY "Authors and admins can delete messages."
  ON public.messages FOR DELETE
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.channels c
      JOIN public.servers s ON s.id = c.server_id
      WHERE c.id = messages.channel_id
      AND (
        s.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.server_members sm
          WHERE sm.server_id = c.server_id
          AND sm.user_id = auth.uid()
          AND sm.role IN ('owner', 'admin', 'moderator')
        )
      )
    )
  );

-- ================================================================
-- ROW LEVEL SECURITY - REACTIONS
-- ================================================================
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Server members can view reactions
CREATE POLICY "Server members can view reactions."
  ON public.reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.channels c ON c.id = m.channel_id
      JOIN public.server_members sm ON sm.server_id = c.server_id
      WHERE m.id = reactions.message_id
      AND sm.user_id = auth.uid()
    )
  );

-- Server members can add reactions
CREATE POLICY "Server members can add reactions."
  ON public.reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.channels c ON c.id = m.channel_id
      JOIN public.server_members sm ON sm.server_id = c.server_id
      WHERE m.id = reactions.message_id
      AND sm.user_id = auth.uid()
    )
  );

-- Users can remove their own reactions
CREATE POLICY "Users can remove their own reactions."
  ON public.reactions FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================================
-- ROW LEVEL SECURITY - MESSAGE_THREADS
-- ================================================================
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;

-- Server members can view threads
CREATE POLICY "Server members can view threads."
  ON public.message_threads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.channels c
      JOIN public.server_members sm ON sm.server_id = c.server_id
      WHERE c.id = message_threads.channel_id
      AND sm.user_id = auth.uid()
    )
  );

-- Server members can create threads
CREATE POLICY "Server members can create threads."
  ON public.message_threads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.channels c
      JOIN public.server_members sm ON sm.server_id = c.server_id
      WHERE c.id = message_threads.channel_id
      AND sm.user_id = auth.uid()
    )
  );

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_servers_owner ON public.servers(owner_id);
CREATE INDEX IF NOT EXISTS idx_servers_created ON public.servers(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_server_members_server ON public.server_members(server_id);
CREATE INDEX IF NOT EXISTS idx_server_members_user ON public.server_members(user_id);
CREATE INDEX IF NOT EXISTS idx_server_members_role ON public.server_members(role);

CREATE INDEX IF NOT EXISTS idx_channels_server ON public.channels(server_id);
CREATE INDEX IF NOT EXISTS idx_channels_type ON public.channels(type);
CREATE INDEX IF NOT EXISTS idx_channels_position ON public.channels(server_id, position);

CREATE INDEX IF NOT EXISTS idx_messages_channel ON public.messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_author ON public.messages(author_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_channel_created ON public.messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON public.messages(thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_pinned ON public.messages(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_messages_mentions ON public.messages USING GIN(mentions);
CREATE INDEX IF NOT EXISTS idx_messages_embeds ON public.messages USING GIN(embeds);

CREATE INDEX IF NOT EXISTS idx_reactions_message ON public.reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON public.reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_message_threads_parent ON public.message_threads(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_channel ON public.message_threads(channel_id);

-- ================================================================
-- HELPER FUNCTIONS
-- ================================================================

-- Auto-increment thread reply count
CREATE OR REPLACE FUNCTION update_thread_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.thread_id IS NOT NULL THEN
    UPDATE public.message_threads
    SET 
      reply_count = reply_count + 1,
      last_reply_at = NEW.created_at
    WHERE id = NEW.thread_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_message_thread_reply
  AFTER INSERT ON public.messages
  FOR EACH ROW
  WHEN (NEW.thread_id IS NOT NULL)
  EXECUTE FUNCTION update_thread_reply_count();
