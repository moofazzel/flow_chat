-- ================================================================
-- FIX_BOARDS_TABLE.sql
-- 
-- COMPLETE BOARDS SCHEMA FIX
-- Run this in Supabase SQL Editor to create or update boards tables
-- ================================================================

-- ================================================================
-- STEP 1: CREATE TABLES IF NOT EXISTS
-- ================================================================

-- BOARDS TABLE
CREATE TABLE IF NOT EXISTS public.boards (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  background text,
  created_by uuid REFERENCES public.users(id) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- LISTS TABLE (Board Columns)
CREATE TABLE IF NOT EXISTS public.lists (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  board_id uuid REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  position integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CARDS TABLE (Tasks)
CREATE TABLE IF NOT EXISTS public.cards (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id uuid REFERENCES public.lists(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  position integer NOT NULL,
  priority text DEFAULT 'medium',
  assignees jsonb DEFAULT '[]'::jsonb,
  labels jsonb DEFAULT '[]'::jsonb,
  due_date timestamp with time zone,
  completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- STEP 2: ADD MISSING COLUMNS TO BOARDS
-- ================================================================
DO $$
BEGIN
  -- Add server_id column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'boards' AND column_name = 'server_id') THEN
    ALTER TABLE public.boards ADD COLUMN server_id uuid REFERENCES public.servers(id) ON DELETE CASCADE;
  END IF;
  
  -- Add description column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'boards' AND column_name = 'description') THEN
    ALTER TABLE public.boards ADD COLUMN description text;
  END IF;
  
  -- Add visibility column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'boards' AND column_name = 'visibility') THEN
    ALTER TABLE public.boards ADD COLUMN visibility text DEFAULT 'public';
  END IF;
  
  -- Add updated_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'boards' AND column_name = 'updated_at') THEN
    ALTER TABLE public.boards ADD COLUMN updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());
  END IF;
END $$;

-- ================================================================
-- STEP 3: ADD MISSING COLUMNS TO LISTS
-- ================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lists' AND column_name = 'color') THEN
    ALTER TABLE public.lists ADD COLUMN color text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lists' AND column_name = 'wip_limit') THEN
    ALTER TABLE public.lists ADD COLUMN wip_limit integer;
  END IF;
END $$;

-- ================================================================
-- STEP 4: ADD MISSING COLUMNS TO CARDS
-- ================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cards' AND column_name = 'task_type') THEN
    ALTER TABLE public.cards ADD COLUMN task_type text DEFAULT 'task';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cards' AND column_name = 'story_points') THEN
    ALTER TABLE public.cards ADD COLUMN story_points integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cards' AND column_name = 'reporter_id') THEN
    ALTER TABLE public.cards ADD COLUMN reporter_id uuid REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cards' AND column_name = 'epic_link') THEN
    ALTER TABLE public.cards ADD COLUMN epic_link uuid;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cards' AND column_name = 'start_date') THEN
    ALTER TABLE public.cards ADD COLUMN start_date timestamp with time zone;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cards' AND column_name = 'completed_at') THEN
    ALTER TABLE public.cards ADD COLUMN completed_at timestamp with time zone;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cards' AND column_name = 'archived') THEN
    ALTER TABLE public.cards ADD COLUMN archived boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cards' AND column_name = 'source_message_id') THEN
    ALTER TABLE public.cards ADD COLUMN source_message_id uuid;
  END IF;
END $$;

-- ================================================================
-- STEP 5: CREATE BOARD_MEMBERS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS public.board_members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  board_id uuid REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member',
  added_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(board_id, user_id)
);

-- ================================================================
-- STEP 6: CREATE CARD_COMMENTS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS public.card_comments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  card_id uuid REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_edited boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- STEP 7: CREATE CARD_ATTACHMENTS TABLE
-- ================================================================
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

-- ================================================================
-- STEP 8: ENABLE ROW LEVEL SECURITY
-- ================================================================
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_attachments ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- STEP 9: CREATE RLS POLICIES
-- ================================================================

-- BOARDS POLICIES
DROP POLICY IF EXISTS "Boards are viewable by everyone." ON public.boards;
CREATE POLICY "Boards are viewable by everyone." ON public.boards FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users can create boards." ON public.boards;
CREATE POLICY "Auth users can create boards." ON public.boards FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Board creators can update their boards." ON public.boards;
CREATE POLICY "Board creators can update their boards." ON public.boards FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Board creators can delete their boards." ON public.boards;
CREATE POLICY "Board creators can delete their boards." ON public.boards FOR DELETE USING (auth.uid() = created_by);

-- LISTS POLICIES
DROP POLICY IF EXISTS "Lists are viewable by everyone." ON public.lists;
CREATE POLICY "Lists are viewable by everyone." ON public.lists FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users can create lists." ON public.lists;
CREATE POLICY "Auth users can create lists." ON public.lists FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth users can update lists." ON public.lists;
CREATE POLICY "Auth users can update lists." ON public.lists FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth users can delete lists." ON public.lists;
CREATE POLICY "Auth users can delete lists." ON public.lists FOR DELETE USING (auth.role() = 'authenticated');

-- CARDS POLICIES
DROP POLICY IF EXISTS "Cards are viewable by everyone." ON public.cards;
CREATE POLICY "Cards are viewable by everyone." ON public.cards FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users can create cards." ON public.cards;
CREATE POLICY "Auth users can create cards." ON public.cards FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth users can update cards." ON public.cards;
CREATE POLICY "Auth users can update cards." ON public.cards FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth users can delete cards." ON public.cards;
CREATE POLICY "Auth users can delete cards." ON public.cards FOR DELETE USING (auth.role() = 'authenticated');

-- BOARD_MEMBERS POLICIES
DROP POLICY IF EXISTS "board_members_select" ON public.board_members;
CREATE POLICY "board_members_select" ON public.board_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "board_members_insert" ON public.board_members;
CREATE POLICY "board_members_insert" ON public.board_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "board_members_delete" ON public.board_members;
CREATE POLICY "board_members_delete" ON public.board_members FOR DELETE USING (auth.role() = 'authenticated');

-- CARD_COMMENTS POLICIES
DROP POLICY IF EXISTS "card_comments_select" ON public.card_comments;
CREATE POLICY "card_comments_select" ON public.card_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "card_comments_insert" ON public.card_comments;
CREATE POLICY "card_comments_insert" ON public.card_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "card_comments_update" ON public.card_comments;
CREATE POLICY "card_comments_update" ON public.card_comments FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "card_comments_delete" ON public.card_comments;
CREATE POLICY "card_comments_delete" ON public.card_comments FOR DELETE USING (auth.uid() = author_id);

-- CARD_ATTACHMENTS POLICIES
DROP POLICY IF EXISTS "card_attachments_select" ON public.card_attachments;
CREATE POLICY "card_attachments_select" ON public.card_attachments FOR SELECT USING (true);

DROP POLICY IF EXISTS "card_attachments_insert" ON public.card_attachments;
CREATE POLICY "card_attachments_insert" ON public.card_attachments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "card_attachments_delete" ON public.card_attachments;
CREATE POLICY "card_attachments_delete" ON public.card_attachments FOR DELETE USING (auth.uid() = uploader_id);

-- ================================================================
-- STEP 10: CREATE INDEXES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_boards_created_by ON public.boards(created_by);
CREATE INDEX IF NOT EXISTS idx_boards_server ON public.boards(server_id) WHERE server_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lists_board_id ON public.lists(board_id);
CREATE INDEX IF NOT EXISTS idx_lists_position ON public.lists(position);
CREATE INDEX IF NOT EXISTS idx_cards_list_id ON public.cards(list_id);
CREATE INDEX IF NOT EXISTS idx_cards_position ON public.cards(position);
CREATE INDEX IF NOT EXISTS idx_cards_priority ON public.cards(priority);
CREATE INDEX IF NOT EXISTS idx_cards_assignees ON public.cards USING GIN(assignees);
CREATE INDEX IF NOT EXISTS idx_cards_labels ON public.cards USING GIN(labels);
CREATE INDEX IF NOT EXISTS idx_board_members_board ON public.board_members(board_id);
CREATE INDEX IF NOT EXISTS idx_board_members_user ON public.board_members(user_id);
CREATE INDEX IF NOT EXISTS idx_card_comments_card ON public.card_comments(card_id);
CREATE INDEX IF NOT EXISTS idx_card_attachments_card ON public.card_attachments(card_id);

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================
SELECT 'Boards tables created/updated successfully!' as result;
