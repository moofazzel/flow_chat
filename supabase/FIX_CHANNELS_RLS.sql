-- ================================================================
-- FIX CHANNELS RLS - Similar to server_members fix
-- ================================================================
-- 
-- The channels table might have RLS policies that prevent users
-- from viewing channels even if they're server members.
--
-- This fix ensures server members can view and manage channels.
-- ================================================================

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "Server members can view channels." ON public.channels;
DROP POLICY IF EXISTS "Server owners/admins can create channels." ON public.channels;
DROP POLICY IF EXISTS "Server owners/admins can update channels." ON public.channels;
DROP POLICY IF EXISTS "Server owners/admins can delete channels." ON public.channels;

-- Step 2: Create working policies

-- SELECT: Server members can view channels
CREATE POLICY "members_can_view_channels"
  ON public.channels FOR SELECT
  USING (
    server_id IN (
      SELECT server_id FROM public.server_members
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Server owners can create channels
CREATE POLICY "owners_can_create_channels"
  ON public.channels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.servers s
      WHERE s.id = channels.server_id
      AND s.owner_id = auth.uid()
    )
  );

-- INSERT: Server admins can create channels
CREATE POLICY "admins_can_create_channels"
  ON public.channels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.server_members sm
      WHERE sm.server_id = channels.server_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'admin')
    )
  );

-- UPDATE: Server owners/admins can update channels
CREATE POLICY "owners_admins_can_update_channels"
  ON public.channels FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.servers s
      WHERE s.id = channels.server_id
      AND s.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.server_members sm
      WHERE sm.server_id = channels.server_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'admin')
    )
  );

-- DELETE: Server owners/admins can delete channels
CREATE POLICY "owners_admins_can_delete_channels"
  ON public.channels FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.servers s
      WHERE s.id = channels.server_id
      AND s.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.server_members sm
      WHERE sm.server_id = channels.server_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'admin')
    )
  );

-- ================================================================
-- Verify the fix
-- ================================================================
SELECT 'Policies on channels:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'channels';

-- ================================================================
-- Check existing channels
-- ================================================================
SELECT 'Existing channels:' as info;
SELECT 
  c.id,
  c.name,
  c.type,
  c.server_id,
  s.name as server_name
FROM public.channels c
JOIN public.servers s ON s.id = c.server_id
ORDER BY c.created_at DESC
LIMIT 10;
