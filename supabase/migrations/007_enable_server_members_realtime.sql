-- ================================================================
-- Enable Realtime for server_members table
-- This allows Supabase to broadcast INSERT, UPDATE, DELETE events
-- ================================================================

-- Enable replica identity to send full row data in realtime events
ALTER TABLE public.server_members REPLICA IDENTITY FULL;

-- Note: You also need to enable realtime in Supabase Dashboard:
-- Database > Replication > Enable for "server_members" table
