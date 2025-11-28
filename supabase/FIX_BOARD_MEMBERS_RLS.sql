-- ================================================================
-- FIX_BOARD_MEMBERS_RLS.sql
-- 
-- Fix infinite recursion in board_members RLS policies
-- 
-- PROBLEM:
-- The board_members_select policy references board_members table
-- to check if user can access private boards, creating infinite recursion:
-- "infinite recursion detected in policy for relation 'board_members'"
--
-- SOLUTION:
-- Use SECURITY DEFINER helper functions that bypass RLS internally
-- to check board membership without triggering policy recursion.
-- ================================================================

-- ================================================================
-- STEP 1: Create SECURITY DEFINER helper functions
-- These functions run with the privileges of the function owner,
-- bypassing RLS policies and avoiding recursion
-- ================================================================

-- Check if user is a member of a specific board
CREATE OR REPLACE FUNCTION public.is_board_member(check_board_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.board_members
    WHERE board_id = check_board_id
    AND user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is admin of a specific board
CREATE OR REPLACE FUNCTION public.is_board_admin(check_board_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.board_members
    WHERE board_id = check_board_id
    AND user_id = check_user_id
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get all board IDs user is a member of
CREATE OR REPLACE FUNCTION public.get_user_board_ids(check_user_id UUID)
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY 
  SELECT board_id FROM public.board_members
  WHERE user_id = check_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ================================================================
-- STEP 2: Drop existing problematic policies
-- ================================================================
DROP POLICY IF EXISTS "board_members_select" ON public.board_members;
DROP POLICY IF EXISTS "board_members_insert" ON public.board_members;
DROP POLICY IF EXISTS "board_members_delete" ON public.board_members;
DROP POLICY IF EXISTS "board_members_update" ON public.board_members;

-- Also drop and recreate boards policies that reference board_members
DROP POLICY IF EXISTS "boards_select_policy" ON public.boards;
DROP POLICY IF EXISTS "boards_update_policy" ON public.boards;

-- ================================================================
-- STEP 3: Create new board_members policies using helper functions
-- ================================================================

-- SELECT: Can see board members if you can access the board
-- Uses helper function to avoid recursion
CREATE POLICY "board_members_select" ON public.board_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = board_members.board_id
    AND (
      -- Public boards: any authenticated user
      (b.visibility = 'public' AND auth.role() = 'authenticated')
      OR
      -- Server boards: server members only
      (b.visibility = 'server' AND b.server_id IS NOT NULL AND 
        public.is_server_member(b.server_id, auth.uid())
      )
      OR
      -- Private boards: creator or board member (using helper function)
      (b.visibility = 'private' AND (
        b.created_by = auth.uid() 
        OR public.is_board_member(b.id, auth.uid())
      ))
    )
  )
);

-- INSERT: Board creator or admin can add members
CREATE POLICY "board_members_insert" ON public.board_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = board_members.board_id
    AND (
      b.created_by = auth.uid() 
      OR public.is_board_admin(b.id, auth.uid())
      -- Also allow if server board and user is server admin
      OR (b.visibility = 'server' AND b.server_id IS NOT NULL AND
          public.is_server_admin(b.server_id, auth.uid()))
    )
  )
);

-- UPDATE: Board creator or admin can update member roles
CREATE POLICY "board_members_update" ON public.board_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = board_members.board_id
    AND (
      b.created_by = auth.uid() 
      OR public.is_board_admin(b.id, auth.uid())
    )
  )
);

-- DELETE: Board creator or admin can remove members, or user can remove themselves
CREATE POLICY "board_members_delete" ON public.board_members FOR DELETE
USING (
  -- Users can always remove themselves
  user_id = auth.uid()
  OR
  -- Board creator or admin can remove others
  EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = board_members.board_id
    AND (
      b.created_by = auth.uid() 
      OR public.is_board_admin(b.id, auth.uid())
    )
  )
);

-- ================================================================
-- STEP 4: Recreate boards policies using helper functions
-- ================================================================

-- SELECT: Based on visibility type, using helper functions
CREATE POLICY "boards_select_policy" ON public.boards FOR SELECT
USING (
  -- Public boards: any authenticated user
  (visibility = 'public' AND auth.role() = 'authenticated')
  OR
  -- Server boards: server members only (using helper function)
  (visibility = 'server' AND server_id IS NOT NULL AND 
    public.is_server_member(server_id, auth.uid())
  )
  OR
  -- Private boards: creator or board member (using helper function)
  (visibility = 'private' AND (
    created_by = auth.uid() 
    OR public.is_board_member(id, auth.uid())
  ))
  OR
  -- Personal boards (null server_id, null visibility defaults to private)
  (server_id IS NULL AND created_by = auth.uid())
);

-- UPDATE: Creator or board admin can update (using helper function)
CREATE POLICY "boards_update_policy" ON public.boards FOR UPDATE
USING (
  created_by = auth.uid() 
  OR public.is_board_admin(id, auth.uid())
);

-- ================================================================
-- STEP 5: Also fix lists and cards policies if needed
-- ================================================================

-- Drop and recreate lists policies
DROP POLICY IF EXISTS "lists_select_policy" ON public.lists;
DROP POLICY IF EXISTS "lists_insert_policy" ON public.lists;
DROP POLICY IF EXISTS "lists_update_policy" ON public.lists;
DROP POLICY IF EXISTS "lists_delete_policy" ON public.lists;

-- Lists SELECT
CREATE POLICY "lists_select_policy" ON public.lists FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = lists.board_id
    AND (
      (b.visibility = 'public' AND auth.role() = 'authenticated')
      OR (b.visibility = 'server' AND b.server_id IS NOT NULL AND 
          public.is_server_member(b.server_id, auth.uid()))
      OR (b.visibility = 'private' AND (
          b.created_by = auth.uid() OR public.is_board_member(b.id, auth.uid())))
      OR (b.server_id IS NULL AND b.created_by = auth.uid())
    )
  )
);

-- Lists INSERT
CREATE POLICY "lists_insert_policy" ON public.lists FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = lists.board_id
    AND (
      b.created_by = auth.uid()
      OR public.is_board_member(b.id, auth.uid())
      OR (b.visibility = 'server' AND b.server_id IS NOT NULL AND 
          public.is_server_member(b.server_id, auth.uid()))
    )
  )
);

-- Lists UPDATE
CREATE POLICY "lists_update_policy" ON public.lists FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = lists.board_id
    AND (
      b.created_by = auth.uid()
      OR public.is_board_member(b.id, auth.uid())
      OR (b.visibility = 'server' AND b.server_id IS NOT NULL AND 
          public.is_server_member(b.server_id, auth.uid()))
    )
  )
);

-- Lists DELETE
CREATE POLICY "lists_delete_policy" ON public.lists FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = lists.board_id
    AND (
      b.created_by = auth.uid() 
      OR public.is_board_admin(b.id, auth.uid())
    )
  )
);

-- Drop and recreate cards policies
DROP POLICY IF EXISTS "cards_select_policy" ON public.cards;
DROP POLICY IF EXISTS "cards_insert_policy" ON public.cards;
DROP POLICY IF EXISTS "cards_update_policy" ON public.cards;
DROP POLICY IF EXISTS "cards_delete_policy" ON public.cards;

-- Cards SELECT
CREATE POLICY "cards_select_policy" ON public.cards FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.lists l
    JOIN public.boards b ON b.id = l.board_id
    WHERE l.id = cards.list_id
    AND (
      (b.visibility = 'public' AND auth.role() = 'authenticated')
      OR (b.visibility = 'server' AND b.server_id IS NOT NULL AND 
          public.is_server_member(b.server_id, auth.uid()))
      OR (b.visibility = 'private' AND (
          b.created_by = auth.uid() OR public.is_board_member(b.id, auth.uid())))
      OR (b.server_id IS NULL AND b.created_by = auth.uid())
    )
  )
);

-- Cards INSERT
CREATE POLICY "cards_insert_policy" ON public.cards FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lists l
    JOIN public.boards b ON b.id = l.board_id
    WHERE l.id = cards.list_id
    AND (
      b.created_by = auth.uid()
      OR public.is_board_member(b.id, auth.uid())
      OR (b.visibility = 'server' AND b.server_id IS NOT NULL AND 
          public.is_server_member(b.server_id, auth.uid()))
    )
  )
);

-- Cards UPDATE
CREATE POLICY "cards_update_policy" ON public.cards FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.lists l
    JOIN public.boards b ON b.id = l.board_id
    WHERE l.id = cards.list_id
    AND (
      b.created_by = auth.uid()
      OR public.is_board_member(b.id, auth.uid())
      OR (b.visibility = 'server' AND b.server_id IS NOT NULL AND 
          public.is_server_member(b.server_id, auth.uid()))
    )
  )
);

-- Cards DELETE
CREATE POLICY "cards_delete_policy" ON public.cards FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.lists l
    JOIN public.boards b ON b.id = l.board_id
    WHERE l.id = cards.list_id
    AND (
      b.created_by = auth.uid() 
      OR public.is_board_admin(b.id, auth.uid())
    )
  )
);

-- ================================================================
-- STEP 6: Verification
-- ================================================================
SELECT 'Board members RLS fix completed!' as result;

-- List all policies for verification
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('boards', 'board_members', 'lists', 'cards')
ORDER BY tablename, policyname;
