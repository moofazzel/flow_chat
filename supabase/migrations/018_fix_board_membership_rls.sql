-- ================================================================
-- 018_fix_board_membership_rls.sql
-- 
-- Fix board RLS policies to properly check membership
-- 
-- Purpose: 
-- - Server boards should only be visible to server members
-- - Private boards should only be visible to board members
-- - Public boards are visible to all authenticated users
-- 
-- Dependencies: 015_update_boards_schema.sql
-- ================================================================

-- ================================================================
-- DROP OLD POLICIES
-- ================================================================
DROP POLICY IF EXISTS "Boards are viewable by everyone." ON public.boards;
DROP POLICY IF EXISTS "Auth users can create boards." ON public.boards;
DROP POLICY IF EXISTS "Board creators can update their boards." ON public.boards;
DROP POLICY IF EXISTS "Board creators can delete their boards." ON public.boards;

DROP POLICY IF EXISTS "Lists are viewable by everyone." ON public.lists;
DROP POLICY IF EXISTS "Auth users can create lists." ON public.lists;
DROP POLICY IF EXISTS "Auth users can update lists." ON public.lists;
DROP POLICY IF EXISTS "Auth users can delete lists." ON public.lists;

DROP POLICY IF EXISTS "Cards are viewable by everyone." ON public.cards;
DROP POLICY IF EXISTS "Auth users can create cards." ON public.cards;
DROP POLICY IF EXISTS "Auth users can update cards." ON public.cards;
DROP POLICY IF EXISTS "Auth users can delete cards." ON public.cards;

-- ================================================================
-- HELPER FUNCTION: Check if user can access board
-- ================================================================
CREATE OR REPLACE FUNCTION public.can_access_board(board_row boards)
RETURNS boolean AS $$
BEGIN
  -- Public boards: anyone authenticated can view
  IF board_row.visibility = 'public' THEN
    RETURN auth.role() = 'authenticated';
  END IF;
  
  -- Server boards: must be a server member
  IF board_row.visibility = 'server' AND board_row.server_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.server_members sm
      WHERE sm.server_id = board_row.server_id
      AND sm.user_id = auth.uid()
    );
  END IF;
  
  -- Private boards: must be a board member or creator
  IF board_row.visibility = 'private' THEN
    RETURN board_row.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.board_members bm
      WHERE bm.board_id = board_row.id
      AND bm.user_id = auth.uid()
    );
  END IF;
  
  -- Default: deny access
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- BOARDS POLICIES
-- ================================================================

-- SELECT: Based on visibility type
CREATE POLICY "boards_select_policy" ON public.boards FOR SELECT
USING (
  -- Public boards: any authenticated user
  (visibility = 'public' AND auth.role() = 'authenticated')
  OR
  -- Server boards: server members only
  (visibility = 'server' AND server_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.server_members sm
    WHERE sm.server_id = boards.server_id
    AND sm.user_id = auth.uid()
  ))
  OR
  -- Private boards: board members or creator only
  (visibility = 'private' AND (
    created_by = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.board_members bm
      WHERE bm.board_id = boards.id
      AND bm.user_id = auth.uid()
    )
  ))
);

-- INSERT: Authenticated users can create boards
CREATE POLICY "boards_insert_policy" ON public.boards FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = created_by);

-- UPDATE: Creator or board admin can update
CREATE POLICY "boards_update_policy" ON public.boards FOR UPDATE
USING (
  created_by = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.board_members bm
    WHERE bm.board_id = boards.id
    AND bm.user_id = auth.uid()
    AND bm.role = 'admin'
  )
);

-- DELETE: Only creator can delete
CREATE POLICY "boards_delete_policy" ON public.boards FOR DELETE
USING (created_by = auth.uid());

-- ================================================================
-- LISTS POLICIES (inherit board access)
-- ================================================================

-- SELECT: Can view lists if can access the board
CREATE POLICY "lists_select_policy" ON public.lists FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = lists.board_id
    AND (
      (b.visibility = 'public' AND auth.role() = 'authenticated')
      OR
      (b.visibility = 'server' AND b.server_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.server_members sm
        WHERE sm.server_id = b.server_id AND sm.user_id = auth.uid()
      ))
      OR
      (b.visibility = 'private' AND (
        b.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM public.board_members bm
          WHERE bm.board_id = b.id AND bm.user_id = auth.uid()
        )
      ))
    )
  )
);

-- INSERT: Can create lists if board member (not observer)
CREATE POLICY "lists_insert_policy" ON public.lists FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boards b
    LEFT JOIN public.board_members bm ON bm.board_id = b.id AND bm.user_id = auth.uid()
    WHERE b.id = lists.board_id
    AND (
      b.created_by = auth.uid()
      OR (bm.role IN ('admin', 'member'))
      OR (b.visibility = 'server' AND b.server_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.server_members sm
        WHERE sm.server_id = b.server_id AND sm.user_id = auth.uid()
      ))
    )
  )
);

-- UPDATE: Same as insert
CREATE POLICY "lists_update_policy" ON public.lists FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.boards b
    LEFT JOIN public.board_members bm ON bm.board_id = b.id AND bm.user_id = auth.uid()
    WHERE b.id = lists.board_id
    AND (
      b.created_by = auth.uid()
      OR (bm.role IN ('admin', 'member'))
      OR (b.visibility = 'server' AND b.server_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.server_members sm
        WHERE sm.server_id = b.server_id AND sm.user_id = auth.uid()
      ))
    )
  )
);

-- DELETE: Board creator or admin only
CREATE POLICY "lists_delete_policy" ON public.lists FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.boards b
    LEFT JOIN public.board_members bm ON bm.board_id = b.id AND bm.user_id = auth.uid()
    WHERE b.id = lists.board_id
    AND (b.created_by = auth.uid() OR bm.role = 'admin')
  )
);

-- ================================================================
-- CARDS POLICIES (inherit board access through lists)
-- ================================================================

-- SELECT: Can view cards if can access the board
CREATE POLICY "cards_select_policy" ON public.cards FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.lists l
    JOIN public.boards b ON b.id = l.board_id
    WHERE l.id = cards.list_id
    AND (
      (b.visibility = 'public' AND auth.role() = 'authenticated')
      OR
      (b.visibility = 'server' AND b.server_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.server_members sm
        WHERE sm.server_id = b.server_id AND sm.user_id = auth.uid()
      ))
      OR
      (b.visibility = 'private' AND (
        b.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM public.board_members bm
          WHERE bm.board_id = b.id AND bm.user_id = auth.uid()
        )
      ))
    )
  )
);

-- INSERT: Can create cards if board member (not observer)
CREATE POLICY "cards_insert_policy" ON public.cards FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lists l
    JOIN public.boards b ON b.id = l.board_id
    LEFT JOIN public.board_members bm ON bm.board_id = b.id AND bm.user_id = auth.uid()
    WHERE l.id = cards.list_id
    AND (
      b.created_by = auth.uid()
      OR (bm.role IN ('admin', 'member'))
      OR (b.visibility = 'server' AND b.server_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.server_members sm
        WHERE sm.server_id = b.server_id AND sm.user_id = auth.uid()
      ))
    )
  )
);

-- UPDATE: Same as insert
CREATE POLICY "cards_update_policy" ON public.cards FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.lists l
    JOIN public.boards b ON b.id = l.board_id
    LEFT JOIN public.board_members bm ON bm.board_id = b.id AND bm.user_id = auth.uid()
    WHERE l.id = cards.list_id
    AND (
      b.created_by = auth.uid()
      OR (bm.role IN ('admin', 'member'))
      OR (b.visibility = 'server' AND b.server_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.server_members sm
        WHERE sm.server_id = b.server_id AND sm.user_id = auth.uid()
      ))
    )
  )
);

-- DELETE: Board creator or admin only
CREATE POLICY "cards_delete_policy" ON public.cards FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.lists l
    JOIN public.boards b ON b.id = l.board_id
    LEFT JOIN public.board_members bm ON bm.board_id = b.id AND bm.user_id = auth.uid()
    WHERE l.id = cards.list_id
    AND (b.created_by = auth.uid() OR bm.role = 'admin')
  )
);

-- ================================================================
-- BOARD MEMBERS POLICIES (update existing)
-- ================================================================
DROP POLICY IF EXISTS "board_members_select" ON public.board_members;
DROP POLICY IF EXISTS "board_members_insert" ON public.board_members;
DROP POLICY IF EXISTS "board_members_delete" ON public.board_members;

-- SELECT: Can see members if you can access the board
CREATE POLICY "board_members_select" ON public.board_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = board_members.board_id
    AND (
      (b.visibility = 'public' AND auth.role() = 'authenticated')
      OR
      (b.visibility = 'server' AND b.server_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.server_members sm
        WHERE sm.server_id = b.server_id AND sm.user_id = auth.uid()
      ))
      OR
      (b.visibility = 'private' AND (
        b.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM public.board_members bm2
          WHERE bm2.board_id = b.id AND bm2.user_id = auth.uid()
        )
      ))
    )
  )
);

-- INSERT: Board creator or admin can add members
CREATE POLICY "board_members_insert" ON public.board_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boards b
    LEFT JOIN public.board_members bm ON bm.board_id = b.id AND bm.user_id = auth.uid()
    WHERE b.id = board_members.board_id
    AND (b.created_by = auth.uid() OR bm.role = 'admin')
  )
);

-- DELETE: Board creator or admin can remove members
CREATE POLICY "board_members_delete" ON public.board_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.boards b
    LEFT JOIN public.board_members bm ON bm.board_id = b.id AND bm.user_id = auth.uid()
    WHERE b.id = board_members.board_id
    AND (b.created_by = auth.uid() OR bm.role = 'admin')
  )
  OR user_id = auth.uid() -- Users can remove themselves
);

-- ================================================================
-- AUTO-ADD SERVER MEMBERS TO SERVER BOARDS
-- This function automatically adds all server members to board_members
-- when a board is created with visibility='server'
-- ================================================================
CREATE OR REPLACE FUNCTION public.auto_add_server_members_to_board()
RETURNS TRIGGER AS $$
BEGIN
  -- Only for server boards
  IF NEW.visibility = 'server' AND NEW.server_id IS NOT NULL THEN
    -- Add all server members as board members
    INSERT INTO public.board_members (board_id, user_id, role)
    SELECT NEW.id, sm.user_id, 
      CASE WHEN sm.role = 'owner' THEN 'admin' ELSE 'member' END
    FROM public.server_members sm
    WHERE sm.server_id = NEW.server_id
    ON CONFLICT (board_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-adding members
DROP TRIGGER IF EXISTS trigger_auto_add_server_members_to_board ON public.boards;
CREATE TRIGGER trigger_auto_add_server_members_to_board
  AFTER INSERT ON public.boards
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_server_members_to_board();

-- ================================================================
-- AUTO-ADD NEW SERVER MEMBERS TO EXISTING SERVER BOARDS
-- When someone joins a server, add them to all server boards
-- ================================================================
CREATE OR REPLACE FUNCTION public.auto_add_member_to_server_boards()
RETURNS TRIGGER AS $$
BEGIN
  -- Add new server member to all boards of this server
  INSERT INTO public.board_members (board_id, user_id, role)
  SELECT b.id, NEW.user_id, 'member'
  FROM public.boards b
  WHERE b.server_id = NEW.server_id
  AND b.visibility = 'server'
  ON CONFLICT (board_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-adding to boards when joining server
DROP TRIGGER IF EXISTS trigger_auto_add_member_to_server_boards ON public.server_members;
CREATE TRIGGER trigger_auto_add_member_to_server_boards
  AFTER INSERT ON public.server_members
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_member_to_server_boards();

-- ================================================================
-- Success message
-- ================================================================
SELECT 'Board membership RLS policies updated successfully!' as result;
