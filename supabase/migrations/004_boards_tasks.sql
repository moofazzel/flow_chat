-- ================================================================
-- 004_boards_tasks.sql
-- 
-- Kanban Board & Task Management System
-- 
-- Purpose: Project management with Trello-like boards
-- Dependencies: 001_auth_users.sql
-- 
-- Features:
-- - Kanban boards with custom columns
-- - Task cards with priorities, labels, assignments
-- - Drag & drop positioning system
-- - Task descriptions, due dates, subtasks
-- 
-- Rollback:
-- DROP TABLE public.cards;
-- DROP TABLE public.lists;
-- DROP TABLE public.boards;
-- ================================================================

-- ================================================================
-- BOARDS TABLE (Kanban Boards)
-- ================================================================
CREATE TABLE public.boards (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  background text,
  created_by uuid REFERENCES public.users(id) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- LISTS TABLE (Board Columns)
-- ================================================================
CREATE TABLE public.lists (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  board_id uuid REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  position integer NOT NULL, -- For ordering columns
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- CARDS TABLE (Tasks/Cards)
-- ================================================================
CREATE TABLE public.cards (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id uuid REFERENCES public.lists(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  position integer NOT NULL, -- For ordering within lists
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assignees jsonb DEFAULT '[]'::jsonb, -- Array of user IDs
  labels jsonb DEFAULT '[]'::jsonb,    -- Array of label objects
  due_date timestamp with time zone,
  completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- ROW LEVEL SECURITY - BOARDS
-- ================================================================
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- Boards are viewable by everyone (can be restricted later for team access)
CREATE POLICY "Boards are viewable by everyone." 
  ON public.boards FOR SELECT 
  USING (true);

-- Authenticated users can create boards
CREATE POLICY "Auth users can create boards." 
  ON public.boards FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Board creators can update their boards
CREATE POLICY "Board creators can update their boards."
  ON public.boards FOR UPDATE
  USING (auth.uid() = created_by);

-- Board creators can delete their boards
CREATE POLICY "Board creators can delete their boards."
  ON public.boards FOR DELETE
  USING (auth.uid() = created_by);

-- ================================================================
-- ROW LEVEL SECURITY - LISTS
-- ================================================================
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;

-- Lists are viewable by everyone (inherits board permissions)
CREATE POLICY "Lists are viewable by everyone." 
  ON public.lists FOR SELECT 
  USING (true);

-- Authenticated users can create lists
CREATE POLICY "Auth users can create lists." 
  ON public.lists FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can update lists
CREATE POLICY "Auth users can update lists."
  ON public.lists FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Authenticated users can delete lists
CREATE POLICY "Auth users can delete lists."
  ON public.lists FOR DELETE
  USING (auth.role() = 'authenticated');

-- ================================================================
-- ROW LEVEL SECURITY - CARDS
-- ================================================================
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Cards are viewable by everyone (inherits board permissions)
CREATE POLICY "Cards are viewable by everyone." 
  ON public.cards FOR SELECT 
  USING (true);

-- Authenticated users can create cards
CREATE POLICY "Auth users can create cards." 
  ON public.cards FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can update cards
CREATE POLICY "Auth users can update cards." 
  ON public.cards FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Authenticated users can delete cards
CREATE POLICY "Auth users can delete cards."
  ON public.cards FOR DELETE
  USING (auth.role() = 'authenticated');

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_boards_created_by ON public.boards(created_by);
CREATE INDEX IF NOT EXISTS idx_boards_created_at ON public.boards(created_at);

CREATE INDEX IF NOT EXISTS idx_lists_board_id ON public.lists(board_id);
CREATE INDEX IF NOT EXISTS idx_lists_position ON public.lists(position);

CREATE INDEX IF NOT EXISTS idx_cards_list_id ON public.cards(list_id);
CREATE INDEX IF NOT EXISTS idx_cards_position ON public.cards(position);
CREATE INDEX IF NOT EXISTS idx_cards_priority ON public.cards(priority);
CREATE INDEX IF NOT EXISTS idx_cards_due_date ON public.cards(due_date);
CREATE INDEX IF NOT EXISTS idx_cards_completed ON public.cards(completed);
CREATE INDEX IF NOT EXISTS idx_cards_assignees ON public.cards USING GIN(assignees);
CREATE INDEX IF NOT EXISTS idx_cards_labels ON public.cards USING GIN(labels);