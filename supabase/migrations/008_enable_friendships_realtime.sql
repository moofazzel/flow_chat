-- Enable realtime for friendships table
-- This allows real-time notifications when friend requests are sent, accepted, or updated

ALTER TABLE public.friendships REPLICA IDENTITY FULL;

-- Note: After running this migration, you MUST enable realtime for the 'friendships' table
-- in the Supabase Dashboard:
-- 1. Go to Database -> Replication
-- 2. Find 'friendships' table
-- 3. Enable realtime
