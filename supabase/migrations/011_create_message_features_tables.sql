-- Create message_attachments table
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  file_type text,
  file_url text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create message_mentions table
CREATE TABLE IF NOT EXISTS public.message_mentions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create message_task_links table
CREATE TABLE IF NOT EXISTS public.message_task_links (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  card_id text NOT NULL, -- Assuming card_id is text (from board cards)
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_task_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid errors
DROP POLICY IF EXISTS "Users can view attachments" ON public.message_attachments;
DROP POLICY IF EXISTS "Users can insert attachments" ON public.message_attachments;
DROP POLICY IF EXISTS "Users can view mentions" ON public.message_mentions;
DROP POLICY IF EXISTS "Users can insert mentions" ON public.message_mentions;
DROP POLICY IF EXISTS "Users can view task links" ON public.message_task_links;
DROP POLICY IF EXISTS "Users can insert task links" ON public.message_task_links;

-- RLS Policies (Simplified for now - accessible to authenticated users)
-- In a real app, you'd check if the user is a member of the server/channel

-- Attachments
CREATE POLICY "Users can view attachments" ON public.message_attachments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert attachments" ON public.message_attachments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Mentions
CREATE POLICY "Users can view mentions" ON public.message_mentions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert mentions" ON public.message_mentions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Task Links
CREATE POLICY "Users can view task links" ON public.message_task_links
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert task links" ON public.message_task_links
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Enable Realtime for these tables
ALTER TABLE public.message_attachments REPLICA IDENTITY FULL;
ALTER TABLE public.message_mentions REPLICA IDENTITY FULL;
ALTER TABLE public.message_task_links REPLICA IDENTITY FULL;
