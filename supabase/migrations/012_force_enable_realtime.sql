-- Force enable realtime for required tables by adding them to the supabase_realtime publication
-- This is often required in addition to setting REPLICA IDENTITY FULL

BEGIN;

-- Check if publication exists, if not create it (standard Supabase setup)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

-- Add tables to publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.server_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_attachments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_mentions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_task_links;

COMMIT;
