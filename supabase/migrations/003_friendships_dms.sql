-- ================================================================
-- 003_friendships_dms.sql
-- 
-- Friend Request & Direct Messaging System
-- 
-- Purpose: User relationships and private messaging
-- Dependencies: 001_auth_users.sql
-- 
-- Features:
-- - Friend requests (pending/accepted/blocked status)
-- - Direct message threads between friends
-- - Private messaging with attachments and reactions
-- - Automatic thread creation helper function
-- 
-- Rollback:
-- DROP FUNCTION public.create_dm_thread(uuid, uuid);
-- DROP TABLE public.dm_messages;
-- DROP TABLE public.dm_threads;
-- DROP TABLE public.friendships;
-- ================================================================

-- ================================================================
-- FRIENDSHIPS TABLE (Friend Requests & Relationships)
-- ================================================================
CREATE TABLE public.friendships (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  requester_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  addressee_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure unique friendship pairs (no duplicates)
  UNIQUE(requester_id, addressee_id),
  
  -- Prevent self-friendship
  CHECK (requester_id != addressee_id)
);

-- ================================================================
-- DM_THREADS TABLE (Direct Message Conversations)
-- ================================================================
CREATE TABLE public.dm_threads (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_a uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  user_b uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure unique thread pairs (no duplicates)
  UNIQUE(user_a, user_b),
  
  -- Prevent self-threads
  CHECK (user_a != user_b)
);

-- ================================================================
-- DM_MESSAGES TABLE (Direct Messages)
-- ================================================================
CREATE TABLE public.dm_messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  thread_id uuid REFERENCES public.dm_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content text,
  attachments jsonb DEFAULT '[]'::jsonb,
  reactions jsonb DEFAULT '{}'::jsonb,
  reply_to_id uuid REFERENCES public.dm_messages(id),
  is_edited boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- ROW LEVEL SECURITY - FRIENDSHIPS
-- ================================================================
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can view their own friendship records
CREATE POLICY "Users can view their friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Users can create friendship requests
CREATE POLICY "Users can create friend requests"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Users can update friendships they're part of (for accepting/blocking)
CREATE POLICY "Users can update their friendships"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Users can delete friendships they're part of
CREATE POLICY "Users can delete their friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- ================================================================
-- ROW LEVEL SECURITY - DM_THREADS
-- ================================================================
ALTER TABLE public.dm_threads ENABLE ROW LEVEL SECURITY;

-- Users can view threads they're part of
CREATE POLICY "Users can view their DM threads"
  ON public.dm_threads FOR SELECT
  USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Users can create DM threads
CREATE POLICY "Users can create DM threads"
  ON public.dm_threads FOR INSERT
  WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

-- ================================================================
-- ROW LEVEL SECURITY - DM_MESSAGES
-- ================================================================
ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their DM threads
CREATE POLICY "Users can view their DM messages"
  ON public.dm_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dm_threads
      WHERE dm_threads.id = dm_messages.thread_id
      AND (dm_threads.user_a = auth.uid() OR dm_threads.user_b = auth.uid())
    )
  );

-- Users can send messages in their DM threads
CREATE POLICY "Users can send DM messages"
  ON public.dm_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.dm_threads
      WHERE dm_threads.id = dm_messages.thread_id
      AND (dm_threads.user_a = auth.uid() OR dm_threads.user_b = auth.uid())
    )
  );

-- Users can update their own messages
CREATE POLICY "Users can update their own DM messages"
  ON public.dm_messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own DM messages"
  ON public.dm_messages FOR DELETE
  USING (auth.uid() = sender_id);

-- ================================================================
-- HELPER FUNCTIONS
-- ================================================================

-- Function to create DM thread between two users (handles ordering)
CREATE OR REPLACE FUNCTION public.create_dm_thread(user_id_1 uuid, user_id_2 uuid)
RETURNS uuid AS $$
DECLARE
  thread_id uuid;
  ordered_user_a uuid;
  ordered_user_b uuid;
BEGIN
  -- Always order users to ensure consistent thread creation
  IF user_id_1 < user_id_2 THEN
    ordered_user_a := user_id_1;
    ordered_user_b := user_id_2;
  ELSE
    ordered_user_a := user_id_2;
    ordered_user_b := user_id_1;
  END IF;
  
  -- Try to find existing thread
  SELECT id INTO thread_id
  FROM public.dm_threads
  WHERE user_a = ordered_user_a AND user_b = ordered_user_b;
  
  -- Create thread if it doesn't exist
  IF thread_id IS NULL THEN
    INSERT INTO public.dm_threads (user_a, user_b)
    VALUES (ordered_user_a, ordered_user_b)
    RETURNING id INTO thread_id;
  END IF;
  
  RETURN thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_friendships_requester_id ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee_id ON public.friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);
CREATE INDEX IF NOT EXISTS idx_friendships_created_at ON public.friendships(created_at);

CREATE INDEX IF NOT EXISTS idx_dm_threads_user_a ON public.dm_threads(user_a);
CREATE INDEX IF NOT EXISTS idx_dm_threads_user_b ON public.dm_threads(user_b);

CREATE INDEX IF NOT EXISTS idx_dm_messages_thread_id ON public.dm_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_sender_id ON public.dm_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_created_at ON public.dm_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_dm_messages_reply_to_id ON public.dm_messages(reply_to_id);