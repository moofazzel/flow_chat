-- ================================================================
-- 016_card_subtasks_labels.sql
-- 
-- Add subtasks (checklist items) for cards and labels for boards
-- Run this in Supabase SQL Editor
-- ================================================================

-- ================================================================
-- CARD_SUBTASKS TABLE (Checklist items for cards)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.card_subtasks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  card_id uuid REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  completed boolean DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.card_subtasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "card_subtasks_select" ON public.card_subtasks;
CREATE POLICY "card_subtasks_select" ON public.card_subtasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "card_subtasks_insert" ON public.card_subtasks;
CREATE POLICY "card_subtasks_insert" ON public.card_subtasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "card_subtasks_update" ON public.card_subtasks;
CREATE POLICY "card_subtasks_update" ON public.card_subtasks FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "card_subtasks_delete" ON public.card_subtasks;
CREATE POLICY "card_subtasks_delete" ON public.card_subtasks FOR DELETE USING (auth.role() = 'authenticated');

-- ================================================================
-- BOARD_LABELS TABLE (Custom labels for boards)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.board_labels (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  board_id uuid REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT 'bg-blue-500',
  text_color text NOT NULL DEFAULT 'text-white',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.board_labels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "board_labels_select" ON public.board_labels;
CREATE POLICY "board_labels_select" ON public.board_labels FOR SELECT USING (true);

DROP POLICY IF EXISTS "board_labels_insert" ON public.board_labels;
CREATE POLICY "board_labels_insert" ON public.board_labels FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "board_labels_update" ON public.board_labels;
CREATE POLICY "board_labels_update" ON public.board_labels FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "board_labels_delete" ON public.board_labels;
CREATE POLICY "board_labels_delete" ON public.board_labels FOR DELETE USING (auth.role() = 'authenticated');

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_card_subtasks_card ON public.card_subtasks(card_id);
CREATE INDEX IF NOT EXISTS idx_card_subtasks_position ON public.card_subtasks(position);
CREATE INDEX IF NOT EXISTS idx_board_labels_board ON public.board_labels(board_id);

-- ================================================================
-- ENABLE REALTIME
-- ================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'card_subtasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE card_subtasks;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'board_labels'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE board_labels;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'card_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE card_comments;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'card_attachments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE card_attachments;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'board_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE board_members;
  END IF;
END $$;

-- Success message
SELECT 'Card subtasks and board labels tables created successfully!' as result;
