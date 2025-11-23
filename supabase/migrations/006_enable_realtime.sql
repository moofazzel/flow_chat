-- ================================================================
-- Enable Realtime for friendships and dm_messages tables
-- This allows Supabase to broadcast INSERT, UPDATE, DELETE events
-- ================================================================

-- Enable replica identity to send full row data in realtime events
ALTER TABLE public.friendships REPLICA IDENTITY FULL;
ALTER TABLE public.dm_messages REPLICA IDENTITY FULL;

-- Enable realtime publication (if not already enabled)
-- Note: You may also need to enable this in Supabase Dashboard:
-- Database > Replication > Enable for "friendships" and "dm_messages" tables
