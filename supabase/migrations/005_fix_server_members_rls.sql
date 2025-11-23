-- Fix RLS policy for server_members to prevent circular dependency
-- This allows users to query their own memberships

-- Drop the problematic policy
DROP POLICY IF EXISTS "Server members can view membership." ON public.server_members;

-- Create a better policy that allows users to see their own memberships
-- Without needing to already be in the table (circular dependency fix)
CREATE POLICY "Users can view their own server memberships."
  ON public.server_members FOR SELECT
  USING (user_id = auth.uid());

-- Also allow viewing all members of servers you belong to
CREATE POLICY "Server members can view other members."
  ON public.server_members FOR SELECT
  USING (
    server_id IN (
      SELECT server_id FROM public.server_members
      WHERE user_id = auth.uid()
    )
  );
