-- Enable replica identity full for reactions table
-- This ensures that DELETE events contain the full row data, including message_id
-- which is required for real-time updates to work correctly when a reaction is removed.

ALTER TABLE public.reactions REPLICA IDENTITY FULL;

-- Note: After running this migration, you MUST enable realtime for the 'reactions' table
-- in the Supabase Dashboard if it's not already enabled.
