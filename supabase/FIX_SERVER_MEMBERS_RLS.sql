-- ================================================================
-- FIX SERVER MEMBERS RLS - Run this in Supabase SQL Editor
-- ================================================================
-- This fixes:
-- 1. "42501 row-level security policy" error when owners/admins invite
-- 2. "infinite recursion" error in SELECT policy

-- Step 1: Drop ALL existing policies on server_members (clean slate)
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'server_members' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.server_members', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Step 2: Create helper functions with SECURITY DEFINER to avoid recursion
-- These functions run with elevated privileges and bypass RLS

-- Function to check if user is member of a server
CREATE OR REPLACE FUNCTION public.is_server_member(p_server_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.server_members
    WHERE server_id = p_server_id AND user_id = p_user_id
  );
$$;

-- Function to check if user is admin/owner of a server
CREATE OR REPLACE FUNCTION public.is_server_admin(p_server_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.server_members
    WHERE server_id = p_server_id 
    AND user_id = p_user_id
    AND role IN ('owner', 'admin')
  );
$$;

-- Function to get all server IDs where user is a member
CREATE OR REPLACE FUNCTION public.get_user_server_ids(p_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT server_id FROM public.server_members WHERE user_id = p_user_id;
$$;

-- Step 3: Make sure RLS is enabled
ALTER TABLE public.server_members ENABLE ROW LEVEL SECURITY;

-- Step 4: Create NON-RECURSIVE policies using the helper functions

-- SELECT: Users can see members of servers they belong to
CREATE POLICY "server_members_select"
  ON public.server_members FOR SELECT
  USING (
    -- This row's server is one the current user is a member of
    server_id IN (SELECT public.get_user_server_ids(auth.uid()))
    -- OR you're the server owner (from servers table)
    OR EXISTS (
      SELECT 1 FROM public.servers s
      WHERE s.id = server_members.server_id
      AND s.owner_id = auth.uid()
    )
  );

-- INSERT: Server owners can add members
CREATE POLICY "server_members_insert_owner"
  ON public.server_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.servers s
      WHERE s.id = server_members.server_id
      AND s.owner_id = auth.uid()
    )
  );

-- INSERT: Server admins can add members
CREATE POLICY "server_members_insert_admin"
  ON public.server_members FOR INSERT
  WITH CHECK (
    public.is_server_admin(server_members.server_id, auth.uid())
  );

-- INSERT: Users can add themselves (for accepting invites via link)
CREATE POLICY "server_members_insert_self"
  ON public.server_members FOR INSERT
  WITH CHECK (
    -- User is adding themselves
    server_members.user_id = auth.uid()
    -- AND a valid invite exists for this server
    AND EXISTS (
      SELECT 1 FROM public.server_invites si
      WHERE si.server_id = server_members.server_id
      AND (si.expires_at IS NULL OR si.expires_at > NOW())
      AND (si.max_uses IS NULL OR si.uses < si.max_uses)
    )
  );

-- UPDATE: Owners can update, admins can update, users can update own
CREATE POLICY "server_members_update"
  ON public.server_members FOR UPDATE
  USING (
    -- Can update own record (for nickname)
    user_id = auth.uid()
    -- OR you're the server owner
    OR EXISTS (
      SELECT 1 FROM public.servers s
      WHERE s.id = server_members.server_id
      AND s.owner_id = auth.uid()
    )
    -- OR you're an admin (using helper function)
    OR public.is_server_admin(server_members.server_id, auth.uid())
  );

-- DELETE: Users can leave, owners/admins can remove members
CREATE POLICY "server_members_delete"
  ON public.server_members FOR DELETE
  USING (
    -- Can leave server (delete own membership)
    user_id = auth.uid()
    -- OR you're the server owner
    OR EXISTS (
      SELECT 1 FROM public.servers s
      WHERE s.id = server_members.server_id
      AND s.owner_id = auth.uid()
    )
    -- OR you're an admin (using helper function)
    OR public.is_server_admin(server_members.server_id, auth.uid())
  );

-- ================================================================
-- Verify the fix
-- ================================================================
SELECT 'New policies on server_members:' as info;
SELECT policyname, cmd, permissive FROM pg_policies WHERE tablename = 'server_members' ORDER BY policyname;

SELECT 'Helper functions created:' as info;
SELECT proname FROM pg_proc WHERE proname IN ('is_server_member', 'is_server_admin', 'get_user_server_ids');
