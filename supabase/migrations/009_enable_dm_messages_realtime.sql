-- Enable realtime for dm_messages table
-- This allows real-time notifications when direct messages are received

ALTER TABLE public.dm_messages REPLICA IDENTITY FULL;

-- Note: After running this migration, you MUST enable realtime for the 'dm_messages' table
-- in the Supabase Dashboard:
-- 1. Go to Database -> Replication
-- 2. Find 'dm_messages' table
-- 3. Enable realtime
