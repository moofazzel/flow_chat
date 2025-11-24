-- Create channel_read_states table
CREATE TABLE IF NOT EXISTS public.channel_read_states (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  channel_id uuid REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
  last_read_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, channel_id)
);

-- Enable RLS
ALTER TABLE public.channel_read_states ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own read states" ON public.channel_read_states
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own read states" ON public.channel_read_states
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own read states" ON public.channel_read_states
  FOR UPDATE USING (auth.uid() = user_id);

-- Add last_message_at to channels
ALTER TABLE public.channels 
ADD COLUMN IF NOT EXISTS last_message_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Function to update channel last_message_at
CREATE OR REPLACE FUNCTION update_channel_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.channels
  SET last_message_at = NEW.created_at
  WHERE id = NEW.channel_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update channel last_message_at
DROP TRIGGER IF EXISTS update_channel_timestamp ON public.messages;
CREATE TRIGGER update_channel_timestamp
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION update_channel_last_message_at();

-- Function to mark channel as read
CREATE OR REPLACE FUNCTION mark_channel_read(p_channel_id uuid, p_user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO public.channel_read_states (user_id, channel_id, last_read_at)
  VALUES (p_user_id, p_channel_id, now())
  ON CONFLICT (user_id, channel_id)
  DO UPDATE SET last_read_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add to realtime publication safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_rel pr
    JOIN pg_class pc ON pr.prrelid = pc.oid
    JOIN pg_publication pp ON pr.prpubid = pp.oid
    WHERE pp.pubname = 'supabase_realtime'
    AND pc.relname = 'channel_read_states'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_read_states;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_rel pr
    JOIN pg_class pc ON pr.prrelid = pc.oid
    JOIN pg_publication pp ON pr.prpubid = pp.oid
    WHERE pp.pubname = 'supabase_realtime'
    AND pc.relname = 'channels'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
  END IF;
END $$;
