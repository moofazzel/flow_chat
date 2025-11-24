-- Migration: Add Message Features (Attachments, Pins, Mentions, Search)
-- Date: 2025-11-24
-- Note: reactions and message_threads tables already exist in schema

-- 1. Add columns to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES messages (id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS edited_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_messages_pinned ON messages (channel_id, is_pinned)
WHERE
    is_pinned = true;

CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages (reply_to_id)
WHERE
    reply_to_id IS NOT NULL;

-- 2. Reactions table already exists in schema as 'reactions'
-- No need to create message_reactions table

-- 3. Create message_attachments table
CREATE TABLE IF NOT EXISTS public.message_attachments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
    message_id uuid REFERENCES messages (id) ON DELETE CASCADE NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text NOT NULL,
    file_size bigint,
    mime_type text,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_message_attachments_message ON message_attachments (message_id);

-- 4. Create message_mentions table
CREATE TABLE IF NOT EXISTS public.message_mentions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
    message_id uuid REFERENCES messages (id) ON DELETE CASCADE NOT NULL,
    mentioned_user_id uuid REFERENCES users (id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (message_id, mentioned_user_id)
);

CREATE INDEX idx_message_mentions_message ON message_mentions (message_id);

CREATE INDEX idx_message_mentions_user ON message_mentions (mentioned_user_id);

-- 5. Create message_task_links table (link messages to tasks/cards)
CREATE TABLE IF NOT EXISTS public.message_task_links (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
    message_id uuid REFERENCES messages (id) ON DELETE CASCADE NOT NULL,
    card_id uuid REFERENCES cards (id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (message_id, card_id)
);

CREATE INDEX idx_message_task_links_message ON message_task_links (message_id);

CREATE INDEX idx_message_task_links_card ON message_task_links (card_id);

-- 6. Enable Row Level Security
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

ALTER TABLE message_mentions ENABLE ROW LEVEL SECURITY;

ALTER TABLE message_task_links ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for reactions table (already exists, just add policies if not present)
-- Note: Check if policies already exist before creating

-- 8. RLS Policies for message_attachments
CREATE POLICY "Users can view attachments on messages they can see" ON message_attachments FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM
                messages m
                JOIN channels c ON m.channel_id = c.id
                JOIN server_members sm ON c.server_id = sm.server_id
            WHERE
                m.id = message_attachments.message_id
                AND sm.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can add attachments to their messages" ON message_attachments FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM messages m
            WHERE
                m.id = message_attachments.message_id
                AND m.author_id = auth.uid ()
        )
    );

CREATE POLICY "Users can delete their own message attachments" ON message_attachments FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM messages m
        WHERE
            m.id = message_attachments.message_id
            AND m.author_id = auth.uid ()
    )
);

-- 9. RLS Policies for message_mentions
CREATE POLICY "Users can view mentions in messages they can see" ON message_mentions FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM
                messages m
                JOIN channels c ON m.channel_id = c.id
                JOIN server_members sm ON c.server_id = sm.server_id
            WHERE
                m.id = message_mentions.message_id
                AND sm.user_id = auth.uid ()
        )
    );

CREATE POLICY "Message authors can create mentions" ON message_mentions FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM messages m
            WHERE
                m.id = message_mentions.message_id
                AND m.author_id = auth.uid ()
        )
    );

-- 10. RLS Policies for message_task_links
CREATE POLICY "Users can view task links in messages they can see" ON message_task_links FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM
                messages m
                JOIN channels c ON m.channel_id = c.id
                JOIN server_members sm ON c.server_id = sm.server_id
            WHERE
                m.id = message_task_links.message_id
                AND sm.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can link tasks to messages in their channels" ON message_task_links FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM
                messages m
                JOIN channels c ON m.channel_id = c.id
                JOIN server_members sm ON c.server_id = sm.server_id
            WHERE
                m.id = message_task_links.message_id
                AND sm.user_id = auth.uid ()
        )
    );

-- 11. Create function to get reaction counts
CREATE OR REPLACE FUNCTION get_message_reaction_counts(message_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_object_agg(emoji, reaction_data)
  INTO result
  FROM (
    SELECT 
      emoji,
      jsonb_build_object(
        'count', COUNT(*),
        'users', jsonb_agg(
          jsonb_build_object(
            'id', user_id,
            'username', u.username
          )
        )
      ) as reaction_data
    FROM reactions mr
    JOIN users u ON mr.user_id = u.id
    WHERE mr.message_id = message_id_param
    GROUP BY emoji
  ) subquery;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- 12. Add full-text search to messages
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
    setweight (
        to_tsvector (
            'english',
            coalesce(content, '')
        ),
        'A'
    )
) STORED;

CREATE INDEX IF NOT EXISTS idx_messages_search ON messages USING GIN (search_vector);

-- 13. Create function to search messages
CREATE OR REPLACE FUNCTION search_messages(
  channel_id_param uuid,
  search_query text,
  limit_param int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  content text,
  author_id uuid,
  created_at timestamptz,
  rank real
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.author_id,
    m.created_at,
    ts_rank(m.search_vector, websearch_to_tsquery('english', search_query)) as rank
  FROM messages m
  WHERE m.channel_id = channel_id_param
    AND m.search_vector @@ websearch_to_tsquery('english', search_query)
  ORDER BY rank DESC, m.created_at DESC
  LIMIT limit_param;
END;
$$;

COMMENT ON
TABLE message_reactions IS 'Stores emoji reactions to messages';

COMMENT ON
TABLE message_attachments IS 'Stores file attachments for messages';

COMMENT ON
TABLE message_mentions IS 'Stores user mentions in messages';

COMMENT ON
TABLE message_task_links IS 'Links messages to task cards';