-- ================================================================
-- COMPLETE FIX - Remove ALL broken policies and recreate fresh
-- ================================================================

-- Step 1: Drop ALL existing policies on server_members
DROP POLICY IF EXISTS "Server members can view membership." ON public.server_members;
DROP POLICY IF EXISTS "Users can view their own server memberships." ON public.server_members;
DROP POLICY IF EXISTS "Server members can view other members." ON public.server_members;
DROP POLICY IF EXISTS "Server owners/admins can add members." ON public.server_members;
DROP POLICY IF EXISTS "Owners/admins can update roles, users can update nickname." ON public.server_members;
DROP POLICY IF EXISTS "Owners/admins can remove members." ON public.server_members;

-- Step 2: Create fresh, working policies

-- SELECT: Allow users to view their own memberships
CREATE POLICY "select_own_memberships"
  ON public.server_members FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Allow server owners to add members (when creating server)
CREATE POLICY "insert_as_owner"
  ON public.server_members FOR INSERT
  WITH CHECK (
    -- Allow if you're the server owner
    EXISTS (
      SELECT 1 FROM public.servers s
      WHERE s.id = server_members.server_id
      AND s.owner_id = auth.uid()
    )
  );

-- INSERT: Allow admins to add members
CREATE POLICY "insert_as_admin"
  ON public.server_members FOR INSERT
  WITH CHECK (
    -- Allow if you're an admin of the server
    EXISTS (
      SELECT 1 FROM public.server_members sm
      WHERE sm.server_id = server_members.server_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'admin')
    )
  );

-- UPDATE: Users can update their own nickname, owners/admins can update roles
CREATE POLICY "update_members"
  ON public.server_members FOR UPDATE
  USING (
    user_id = auth.uid() -- Can update own record
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

-- DELETE: Users can leave, owners/admins can remove members
CREATE POLICY "delete_members"
  ON public.server_members FOR DELETE
  USING (
    user_id = auth.uid() -- Can leave server
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
-- Verify the fix
-- ================================================================
SELECT 'Policies on server_members:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'server_members';
