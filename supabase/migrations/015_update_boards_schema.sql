-- ================================================================
-- 015_update_boards_schema.sql
-- 
-- Update boards table to add missing columns
-- Run this in Supabase SQL Editor
-- ================================================================

-- Add missing columns to boards table
ALTER TABLE public.boards 
ADD COLUMN IF NOT EXISTS server_id uuid REFERENCES public.servers(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'server')),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Add missing columns to lists table
ALTER TABLE public.lists
ADD COLUMN IF NOT EXISTS color text,
ADD COLUMN IF NOT EXISTS wip_limit integer;

-- Create board_members table if not exists
CREATE TABLE IF NOT EXISTS public.board_members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  board_id uuid REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'member', 'observer')),
  added_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(board_id, user_id)
);

-- Enable RLS on board_members if it's a new table
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;

-- Policies for board_members
DROP POLICY IF EXISTS "board_members_select" ON public.board_members;
CREATE POLICY "board_members_select" ON public.board_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "board_members_insert" ON public.board_members;
CREATE POLICY "board_members_insert" ON public.board_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "board_members_delete" ON public.board_members;
CREATE POLICY "board_members_delete" ON public.board_members FOR DELETE USING (auth.role() = 'authenticated');

-- Create card_comments table if not exists
CREATE TABLE IF NOT EXISTS public.card_comments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  card_id uuid REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_edited boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.card_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "card_comments_select" ON public.card_comments;
CREATE POLICY "card_comments_select" ON public.card_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "card_comments_insert" ON public.card_comments;
CREATE POLICY "card_comments_insert" ON public.card_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "card_comments_update" ON public.card_comments;
CREATE POLICY "card_comments_update" ON public.card_comments FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "card_comments_delete" ON public.card_comments;
CREATE POLICY "card_comments_delete" ON public.card_comments FOR DELETE USING (auth.uid() = author_id);

-- Create card_attachments table if not exists
CREATE TABLE IF NOT EXISTS public.card_attachments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  card_id uuid REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
  uploader_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  filename text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.card_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "card_attachments_select" ON public.card_attachments;
CREATE POLICY "card_attachments_select" ON public.card_attachments FOR SELECT USING (true);

DROP POLICY IF EXISTS "card_attachments_insert" ON public.card_attachments;
CREATE POLICY "card_attachments_insert" ON public.card_attachments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "card_attachments_delete" ON public.card_attachments;
CREATE POLICY "card_attachments_delete" ON public.card_attachments FOR DELETE USING (auth.uid() = uploader_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_boards_server ON public.boards(server_id) WHERE server_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_board_members_board ON public.board_members(board_id);
CREATE INDEX IF NOT EXISTS idx_board_members_user ON public.board_members(user_id);
CREATE INDEX IF NOT EXISTS idx_card_comments_card ON public.card_comments(card_id);
CREATE INDEX IF NOT EXISTS idx_card_comments_author ON public.card_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_card_attachments_card ON public.card_attachments(card_id);

-- Add additional card columns if missing
ALTER TABLE public.cards
ADD COLUMN IF NOT EXISTS task_type text DEFAULT 'task' CHECK (task_type IN ('story', 'task', 'bug', 'epic', 'subtask')),
ADD COLUMN IF NOT EXISTS story_points integer,
ADD COLUMN IF NOT EXISTS reporter_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS epic_link uuid REFERENCES public.cards(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS start_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS source_message_id uuid;

-- Update priority constraint to support more values
ALTER TABLE public.cards DROP CONSTRAINT IF EXISTS cards_priority_check;
ALTER TABLE public.cards ADD CONSTRAINT cards_priority_check 
  CHECK (priority IN ('lowest', 'low', 'medium', 'high', 'highest', 'urgent'));

-- Enable realtime
DO $$
BEGIN
  -- Check if boards is already in the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'boards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE boards;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'lists'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE lists;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'cards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE cards;
  END IF;
END $$;

-- Success message
SELECT 'Boards schema updated successfully!' as result;
