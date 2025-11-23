-- ================================================================
-- 005_functions_triggers.sql
-- 
-- Database Functions & Triggers
-- 
-- Purpose: Advanced database functionality and automation
-- Dependencies: All previous migrations
-- 
-- Features:
-- - Updated timestamp triggers
-- - Database functions for complex operations
-- - Performance optimizations
-- - Data integrity triggers
-- 
-- Rollback:
-- DROP TRIGGER IF EXISTS update_updated_at_*;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- ================================================================

-- ================================================================
-- UPDATED_AT TIMESTAMP FUNCTION
-- ================================================================
-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- UPDATED_AT TRIGGERS
-- ================================================================
-- Apply updated_at triggers to tables that have the column

-- Users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Messages table
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- DM Messages table
CREATE TRIGGER update_dm_messages_updated_at
  BEFORE UPDATE ON public.dm_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Friendships table
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Cards table
CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON public.cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- FRIEND REQUEST HELPER FUNCTIONS
-- ================================================================

-- Function to check if two users are friends
CREATE OR REPLACE FUNCTION public.are_users_friends(user_id_1 uuid, user_id_2 uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.friendships
    WHERE status = 'accepted'
    AND (
      (requester_id = user_id_1 AND addressee_id = user_id_2) OR
      (requester_id = user_id_2 AND addressee_id = user_id_1)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get friendship status between two users
CREATE OR REPLACE FUNCTION public.get_friendship_status(user_id_1 uuid, user_id_2 uuid)
RETURNS text AS $$
DECLARE
  friendship_status text;
BEGIN
  SELECT status INTO friendship_status
  FROM public.friendships
  WHERE (
    (requester_id = user_id_1 AND addressee_id = user_id_2) OR
    (requester_id = user_id_2 AND addressee_id = user_id_1)
  );
  
  RETURN COALESCE(friendship_status, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- BOARD HELPER FUNCTIONS
-- ================================================================

-- Function to get next position in a list
CREATE OR REPLACE FUNCTION public.get_next_card_position(list_uuid uuid)
RETURNS integer AS $$
DECLARE
  max_position integer;
BEGIN
  SELECT COALESCE(MAX(position), 0) + 1 INTO max_position
  FROM public.cards
  WHERE list_id = list_uuid;
  
  RETURN max_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next list position in a board
CREATE OR REPLACE FUNCTION public.get_next_list_position(board_uuid uuid)
RETURNS integer AS $$
DECLARE
  max_position integer;
BEGIN
  SELECT COALESCE(MAX(position), 0) + 1 INTO max_position
  FROM public.lists
  WHERE board_id = board_uuid;
  
  RETURN max_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- SEARCH FUNCTIONS
-- ================================================================

-- Function to search users (for friend requests)
CREATE OR REPLACE FUNCTION public.search_users(
  search_query text,
  current_user_id uuid DEFAULT NULL,
  limit_count integer DEFAULT 10
)
RETURNS SETOF public.users AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.users
  WHERE (
    COALESCE(current_user_id, '00000000-0000-0000-0000-000000000000') != id
    AND (
      username ILIKE '%' || search_query || '%' OR
      full_name ILIKE '%' || search_query || '%' OR
      email ILIKE '%' || search_query || '%'
    )
  )
  ORDER BY
    CASE 
      WHEN username ILIKE search_query || '%' THEN 1
      WHEN full_name ILIKE search_query || '%' THEN 2
      ELSE 3
    END,
    username
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- NOTIFICATION FUNCTIONS (Placeholder for future)
-- ================================================================

-- Function to create a notification (stub for future implementation)
CREATE OR REPLACE FUNCTION public.create_notification(
  user_id uuid,
  notification_type text,
  title text,
  message text,
  metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  -- This is a placeholder function
  -- In the future, this would insert into a notifications table
  -- For now, just return a dummy UUID
  notification_id := uuid_generate_v4();
  
  -- TODO: Insert into notifications table when implemented
  -- INSERT INTO public.notifications (id, user_id, type, title, message, metadata)
  -- VALUES (notification_id, user_id, notification_type, title, message, metadata);
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- PERFORMANCE VIEWS (Optional)
-- ================================================================

-- View for user's friend count
CREATE OR REPLACE VIEW public.user_friend_counts AS
SELECT 
  u.id,
  u.username,
  u.full_name,
  COUNT(f.id) as friend_count
FROM public.users u
LEFT JOIN public.friendships f ON (
  (f.requester_id = u.id OR f.addressee_id = u.id)
  AND f.status = 'accepted'
)
GROUP BY u.id, u.username, u.full_name;

-- View for recent DM activity
CREATE OR REPLACE VIEW public.recent_dm_activity AS
SELECT 
  t.id as thread_id,
  t.user_a,
  t.user_b,
  m.content as last_message,
  m.created_at as last_message_at,
  u.username as last_sender_username
FROM public.dm_threads t
LEFT JOIN LATERAL (
  SELECT * FROM public.dm_messages 
  WHERE thread_id = t.id 
  ORDER BY created_at DESC 
  LIMIT 1
) m ON true
LEFT JOIN public.users u ON u.id = m.sender_id
ORDER BY m.created_at DESC NULLS LAST;