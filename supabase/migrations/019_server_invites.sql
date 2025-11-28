-- ================================================================
-- 019_server_invites.sql
-- 
-- Create server_invites table for invite link functionality
-- 
-- Purpose:
-- - Store invite codes with expiration and usage limits
-- - Track who created invites and how many times they've been used
-- - Enable shareable invite links for servers
-- ================================================================

-- ================================================================
-- CREATE TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS public.server_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  uses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- INDEXES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_server_invites_server_id ON public.server_invites(server_id);
CREATE INDEX IF NOT EXISTS idx_server_invites_code ON public.server_invites(code);
CREATE INDEX IF NOT EXISTS idx_server_invites_expires_at ON public.server_invites(expires_at);

-- ================================================================
-- RLS POLICIES
-- ================================================================
ALTER TABLE public.server_invites ENABLE ROW LEVEL SECURITY;

-- SELECT: Anyone authenticated can view invites (needed to validate codes)
CREATE POLICY "server_invites_select" ON public.server_invites FOR SELECT
USING (auth.role() = 'authenticated');

-- INSERT: Server members can create invites
CREATE POLICY "server_invites_insert" ON public.server_invites FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.server_members sm
    WHERE sm.server_id = server_invites.server_id
    AND sm.user_id = auth.uid()
  )
);

-- UPDATE: Creator or server admin/owner can update
CREATE POLICY "server_invites_update" ON public.server_invites FOR UPDATE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.server_members sm
    WHERE sm.server_id = server_invites.server_id
    AND sm.user_id = auth.uid()
    AND sm.role IN ('owner', 'admin')
  )
);

-- DELETE: Creator or server admin/owner can delete
CREATE POLICY "server_invites_delete" ON public.server_invites FOR DELETE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.server_members sm
    WHERE sm.server_id = server_invites.server_id
    AND sm.user_id = auth.uid()
    AND sm.role IN ('owner', 'admin')
  )
);

-- ================================================================
-- REALTIME
-- ================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.server_invites;

-- ================================================================
-- Success message
-- ================================================================
SELECT 'Server invites table created successfully!' as result;
