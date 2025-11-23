-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS PROFILE TABLE
-- This table mirrors the auth.users table but holds public profile info
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  username text unique,
  full_name text,
  avatar_url text,
  status text default 'online' check (status in ('online', 'idle', 'dnd', 'offline')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.users enable row level security;

-- Policies for Users
create policy "Public profiles are viewable by everyone."
  on public.users for select
  using ( true );

create policy "Users can insert their own profile."
  on public.users for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.users for update
  using ( auth.uid() = id );

-- Trigger to handle new user signups automatically
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, username, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. CHANNELS TABLE
create table public.channels (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  type text default 'public' check (type in ('public', 'private', 'voice')),
  created_by uuid references public.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.channels enable row level security;

create policy "Channels are viewable by everyone."
  on public.channels for select
  using ( true );

create policy "Authenticated users can create channels."
  on public.channels for insert
  with check ( auth.role() = 'authenticated' );


-- 3. MESSAGES TABLE
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  channel_id uuid references public.channels(id) on delete cascade not null,
  user_id uuid references public.users(id) not null,
  content text,
  attachments jsonb default '[]'::jsonb, -- Stores array of file URLs/metadata
  reactions jsonb default '{}'::jsonb,   -- Stores reactions like {"👍": ["user_id_1", "user_id_2"]}
  reply_to_id uuid references public.messages(id),
  is_edited boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;

create policy "Messages are viewable by everyone."
  on public.messages for select
  using ( true );

create policy "Authenticated users can insert messages."
  on public.messages for insert
  with check ( auth.role() = 'authenticated' );

create policy "Users can update their own messages."
  on public.messages for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own messages."
  on public.messages for delete
  using ( auth.uid() = user_id );


-- 4. BOARDS TABLE (for Trello-like features)
create table public.boards (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  background text,
  created_by uuid references public.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.boards enable row level security;
create policy "Boards are viewable by everyone." on public.boards for select using (true);
create policy "Auth users can create boards." on public.boards for insert with check (auth.role() = 'authenticated');


-- 5. LISTS TABLE
create table public.lists (
  id uuid default uuid_generate_v4() primary key,
  board_id uuid references public.boards(id) on delete cascade not null,
  title text not null,
  position integer not null, -- for ordering
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.lists enable row level security;
create policy "Lists are viewable by everyone." on public.lists for select using (true);
create policy "Auth users can create lists." on public.lists for insert with check (auth.role() = 'authenticated');


-- 6. CARDS TABLE
create table public.cards (
  id uuid default uuid_generate_v4() primary key,
  list_id uuid references public.lists(id) on delete cascade not null,
  title text not null,
  description text,
  position integer not null,
  priority text default 'medium',
  assignees jsonb default '[]'::jsonb, -- Array of user IDs
  labels jsonb default '[]'::jsonb,
  due_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.cards enable row level security;
create policy "Cards are viewable by everyone." on public.cards for select using (true);
create policy "Auth users can create cards." on public.cards for insert with check (auth.role() = 'authenticated');
create policy "Auth users can update cards." on public.cards for update using (auth.role() = 'authenticated');


-- 7. FRIENDSHIPS TABLE (Friend Requests & Relationships)
create table public.friendships (
  id uuid default uuid_generate_v4() primary key,
  requester_id uuid references public.users(id) on delete cascade not null,
  addressee_id uuid references public.users(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure unique friendship pairs (no duplicates)
  unique(requester_id, addressee_id),
  
  -- Prevent self-friendship
  check (requester_id != addressee_id)
);

alter table public.friendships enable row level security;

-- Users can view their own friendship records
create policy "Users can view their friendships"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Users can create friendship requests
create policy "Users can create friend requests"
  on public.friendships for insert
  with check (auth.uid() = requester_id);

-- Users can update friendships they're part of (for accepting/blocking)
create policy "Users can update their friendships"
  on public.friendships for update
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Users can delete friendships they're part of
create policy "Users can delete their friendships"
  on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);


-- 8. DM_THREADS TABLE (Direct Message Conversations)
create table public.dm_threads (
  id uuid default uuid_generate_v4() primary key,
  user_a uuid references public.users(id) on delete cascade not null,
  user_b uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure unique thread pairs (no duplicates)
  unique(user_a, user_b),
  
  -- Prevent self-threads
  check (user_a != user_b)
);

alter table public.dm_threads enable row level security;

-- Users can view threads they're part of
create policy "Users can view their DM threads"
  on public.dm_threads for select
  using (auth.uid() = user_a or auth.uid() = user_b);

-- Users can create DM threads
create policy "Users can create DM threads"
  on public.dm_threads for insert
  with check (auth.uid() = user_a or auth.uid() = user_b);


-- 9. DM_MESSAGES TABLE (Direct Messages)
create table public.dm_messages (
  id uuid default uuid_generate_v4() primary key,
  thread_id uuid references public.dm_threads(id) on delete cascade not null,
  sender_id uuid references public.users(id) on delete cascade not null,
  content text,
  attachments jsonb default '[]'::jsonb,
  reactions jsonb default '{}'::jsonb,
  reply_to_id uuid references public.dm_messages(id),
  is_edited boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.dm_messages enable row level security;

-- Users can view messages in their DM threads
create policy "Users can view their DM messages"
  on public.dm_messages for select
  using (
    exists (
      select 1 from public.dm_threads
      where dm_threads.id = dm_messages.thread_id
      and (dm_threads.user_a = auth.uid() or dm_threads.user_b = auth.uid())
    )
  );

-- Users can send messages in their DM threads
create policy "Users can send DM messages"
  on public.dm_messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.dm_threads
      where dm_threads.id = dm_messages.thread_id
      and (dm_threads.user_a = auth.uid() or dm_threads.user_b = auth.uid())
    )
  );

-- Users can update their own messages
create policy "Users can update their own DM messages"
  on public.dm_messages for update
  using (auth.uid() = sender_id);

-- Users can delete their own messages
create policy "Users can delete their own DM messages"
  on public.dm_messages for delete
  using (auth.uid() = sender_id);


-- HELPER FUNCTIONS

-- Function to create DM thread between two users (handles ordering)
create or replace function public.create_dm_thread(user_id_1 uuid, user_id_2 uuid)
returns uuid as $$
declare
  thread_id uuid;
  ordered_user_a uuid;
  ordered_user_b uuid;
begin
  -- Always order users to ensure consistent thread creation
  if user_id_1 < user_id_2 then
    ordered_user_a := user_id_1;
    ordered_user_b := user_id_2;
  else
    ordered_user_a := user_id_2;
    ordered_user_b := user_id_1;
  end if;
  
  -- Try to find existing thread
  select id into thread_id
  from public.dm_threads
  where user_a = ordered_user_a and user_b = ordered_user_b;
  
  -- Create thread if it doesn't exist
  if thread_id is null then
    insert into public.dm_threads (user_a, user_b)
    values (ordered_user_a, ordered_user_b)
    returning id into thread_id;
  end if;
  
  return thread_id;
end;
$$ language plpgsql security definer;


-- SEED DATA (Optional - Run this to get some initial data)
-- Note: You need to create a user via Auth first for the foreign keys to work perfectly, 
-- but here is how you would insert a default channel.
insert into public.channels (name, description, type)
values ('general', 'General discussion for everyone', 'public');
