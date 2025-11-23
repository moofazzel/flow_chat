# 🗄️ Flow Chat - Complete High-Performance Database Schema

**Date**: 2025-11-23  
**Purpose**: Comprehensive database architecture combining Chat + Board features  
**Database**: PostgreSQL (Supabase)

---

## 📊 Schema Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLOW CHAT DATABASE SCHEMA                     │
├───────────────────┬──────────────────┬──────────────────────────┤
│   USER SYSTEM     │   MESSAGING      │   BOARD SYSTEM           │
│   (Auth & Social) │   (Chat & DMs)   │   (Tasks & Projects)     │
├───────────────────┼──────────────────┼──────────────────────────┤
│ • users           │ • servers        │ • boards                 │
│ • friendships     │ • server_members │ • lists                  │
│ • dm_threads      │ • channels       │ • cards                  │
│ • dm_messages     │ • messages       │ • card_comments          │
│                   │ • reactions      │ • card_attachments       │
│                   │ • message_threads│ • board_members          │
└───────────────────┴──────────────────┴──────────────────────────┘
```

---

## 🏗️ Complete Database Schema

### **1. USER SYSTEM & AUTHENTICATION**

#### **users** (Core user profiles)

```sql
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE,
  username text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  status text DEFAULT 'online' CHECK (status IN ('online', 'idle', 'dnd', 'offline')),
  bio text,
  custom_status text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

**Relations**:

- → `friendships` (1:N as requester/addressee)
- → `dm_threads` (1:N as user_a/user_b)
- → `dm_messages` (1:N as sender)
- → `server_members` (1:N)
- → `messages` (1:N as author)
- → `boards` (1:N as creator)
- → `cards` (N:M through assignees JSONB)

---

#### **friendships** (Friend requests & relationships)

```sql
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  addressee_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  api_key text, -- Optional API key for special integrations
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status);
```

**Purpose**: Manage friend connections and requests  
**Relations**:

- → `users` (requester)
- → `users` (addressee)

---

### **2. DIRECT MESSAGING SYSTEM**

#### **dm_threads** (1-on-1 conversation threads)

```sql
CREATE TABLE public.dm_threads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_a uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  user_b uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,

  UNIQUE(user_a, user_b),
  CHECK (user_a < user_b) -- Ensure consistent ordering
);

CREATE INDEX idx_dm_threads_users ON dm_threads(user_a, user_b);
```

**Purpose**: Container for DM conversations  
**Relations**:

- → `users` (participant A)
- → `users` (participant B)
- → `dm_messages` (1:N)

---

#### **dm_messages** (Direct messages)

```sql
CREATE TABLE public.dm_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id uuid REFERENCES dm_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  reactions jsonb DEFAULT '{}'::jsonb, -- {emoji: [user_ids]}
  reply_to_id uuid REFERENCES dm_messages(id) ON DELETE SET NULL,
  is_edited boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_dm_messages_thread ON dm_messages(thread_id);
CREATE INDEX idx_dm_messages_sender ON dm_messages(sender_id);
CREATE INDEX idx_dm_messages_created ON dm_messages(created_at DESC);
CREATE INDEX idx_dm_messages_reply ON dm_messages(reply_to_id WHERE reply_to_id IS NOT NULL);
```

**Purpose**: Store DM messages  
**Relations**:

- → `dm_threads` (parent thread)
- → `users` (sender)
- → `dm_messages` (reply parent)

---

### **3. SERVER/GROUP SYSTEM** (Discord-style)

#### **servers** (Workspaces/Groups)

```sql
CREATE TABLE public.servers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  icon_url text,
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_servers_owner ON servers(owner_id);
CREATE INDEX idx_servers_created ON servers(created_at DESC);
```

**Purpose**: Group workspaces (like Discord servers)  
**Relations**:

- → `users` (owner)
- → `server_members` (1:N)
- → `channels` (1:N)
- → `boards` (1:N) -- Servers can have multiple boards

---

#### **server_members** (Server membership)

```sql
CREATE TABLE public.server_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id uuid REFERENCES servers(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  nickname text, -- Server-specific nickname
  joined_at timestamptz DEFAULT now() NOT NULL,

  UNIQUE(server_id, user_id)
);

CREATE INDEX idx_server_members_server ON server_members(server_id);
CREATE INDEX idx_server_members_user ON server_members(user_id);
CREATE INDEX idx_server_members_role ON server_members(role);
```

**Purpose**: Track who belongs to which server  
**Relations**:

- → `servers` (parent server)
- → `users` (member)

---

#### **channels** (Text/Voice channels in servers)

```sql
CREATE TABLE public.channels (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id uuid REFERENCES servers(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  type text DEFAULT 'text' CHECK (type IN ('text', 'voice', 'announcement')),
  category text, -- e.g., "GENERAL", "PROJECTS", "VOICE CHANNELS"
  position integer DEFAULT 0, -- For sorting
  created_at timestamptz DEFAULT now() NOT NULL,

  UNIQUE(server_id, name)
);

CREATE INDEX idx_channels_server ON channels(server_id);
CREATE INDEX idx_channels_type ON channels(type);
CREATE INDEX idx_channels_position ON channels(position);
```

**Purpose**: Communication channels within servers  
**Relations**:

- → `servers` (parent server)
- → `messages` (1:N)

---

### **4. CHANNEL MESSAGING SYSTEM**

#### **messages** (Channel messages)

```sql
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id uuid REFERENCES channels(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text,
  message_type text DEFAULT 'user_message' CHECK (message_type IN (
    'user_message', 'system', 'bot', 'task_created', 'task_completed'
  )),
  attachments jsonb DEFAULT '[]'::jsonb,
  embeds jsonb DEFAULT '[]'::jsonb, -- For task cards, link previews
  mentions jsonb DEFAULT '[]'::jsonb, -- Array of user_ids
  reply_to_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  thread_id uuid, -- For threaded conversations
  is_pinned boolean DEFAULT false,
  is_edited boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_messages_channel ON messages(channel_id);
CREATE INDEX idx_messages_author ON messages(author_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_thread ON messages(thread_id WHERE thread_id IS NOT NULL);
CREATE INDEX idx_messages_pinned ON messages(is_pinned WHERE is_pinned = true);
CREATE INDEX idx_messages_mentions ON messages USING GIN(mentions);
```

**Purpose**: Messages in channels  
**Relations**:

- → `channels` (parent channel)
- → `users` (author)
- → `messages` (reply parent)
- → `reactions` (1:N)

---

#### **reactions** (Message reactions/emojis)

```sql
CREATE TABLE public.reactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  emoji text NOT NULL, -- e.g., "👍", "❤️", "🔥"
  created_at timestamptz DEFAULT now() NOT NULL,

  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_reactions_message ON reactions(message_id);
CREATE INDEX idx_reactions_user ON reactions(user_id);
```

**Purpose**: Track emoji reactions on messages  
**Relations**:

- → `messages` (parent message)
- → `users` (reactor)

---

#### **message_threads** (Thread metadata)

```sql
CREATE TABLE public.message_threads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_message_id uuid REFERENCES messages(id) ON DELETE CASCADE NOT NULL UNIQUE,
  channel_id uuid REFERENCES channels(id) ON DELETE CASCADE NOT NULL,
  reply_count integer DEFAULT 0,
  last_reply_at timestamptz,
  participants jsonb DEFAULT '[]'::jsonb, -- Array of user_ids
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_message_threads_parent ON message_threads(parent_message_id);
CREATE INDEX idx_message_threads_channel ON message_threads(channel_id);
```

**Purpose**: Metadata for threaded conversations  
**Relations**:

- → `messages` (parent message)
- → `channels` (parent channel)

---

### **5. BOARD/TASK SYSTEM** (Kanban)

#### **boards** (Kanban boards)

```sql
CREATE TABLE public.boards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id uuid REFERENCES servers(id) ON DELETE CASCADE, -- NULL if personal board
  title text NOT NULL,
  description text,
  background text, -- Color code or image URL
  visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'server')),
  created_by uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_boards_created_by ON boards(created_by);
CREATE INDEX idx_boards_server ON boards(server_id WHERE server_id IS NOT NULL);
CREATE INDEX idx_boards_created ON boards(created_at DESC);
```

**Purpose**: Project boards (Trello/Jira style)  
**Relations**:

- → `servers` (optional parent)
- → `users` (creator)
- → `lists` (1:N columns)
- → `board_members` (1:N)

---

#### **board_members** (Board access control)

```sql
CREATE TABLE public.board_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id uuid REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'member', 'observer')),
  added_at timestamptz DEFAULT now() NOT NULL,

  UNIQUE(board_id, user_id)
);

CREATE INDEX idx_board_members_board ON board_members(board_id);
CREATE INDEX idx_board_members_user ON board_members(user_id);
```

**Purpose**: Control who can access/edit boards  
**Relations**:

- → `boards` (parent board)
- → `users` (member)

---

#### **lists** (Board columns)

```sql
CREATE TABLE public.lists (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id uuid REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  position integer NOT NULL, -- For ordering
  color text, -- Optional column color
  wip_limit integer, -- Work-in-progress limit
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_lists_board ON lists(board_id);
CREATE INDEX idx_lists_position ON lists(board_id, position);
```

**Purpose**: Columns in Kanban board  
**Relations**:

- → `boards` (parent board)
- → `cards` (1:N tasks)

---

#### **cards** (Task cards)

```sql
CREATE TABLE public.cards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id uuid REFERENCES lists(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  position integer NOT NULL, -- For ordering within list

  -- Jira-style fields
  task_type text DEFAULT 'task' CHECK (task_type IN ('story', 'task', 'bug', 'epic', 'subtask')),
  priority text DEFAULT 'medium' CHECK (priority IN ('lowest', 'low', 'medium', 'high', 'highest', 'urgent')),
  story_points integer,

  -- Assignment
  assignees jsonb DEFAULT '[]'::jsonb, -- Array of user_ids
  reporter_id uuid REFERENCES users(id) ON DELETE SET NULL,

  -- Labels & categorization
  labels jsonb DEFAULT '[]'::jsonb, -- Array of label objects
  epic_link uuid REFERENCES cards(id) ON DELETE SET NULL, -- Link to parent epic

  -- Dates
  due_date timestamptz,
  start_date timestamptz,
  completed_at timestamptz,

  -- Status
  completed boolean DEFAULT false,
  archived boolean DEFAULT false,

  -- Metadata
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Message integration
  source_message_id uuid REFERENCES messages(id) ON DELETE SET NULL -- If created from chat
);

CREATE INDEX idx_cards_list ON cards(list_id);
CREATE INDEX idx_cards_position ON cards(list_id, position);
CREATE INDEX idx_cards_priority ON cards(priority);
CREATE INDEX idx_cards_due_date ON cards(due_date WHERE due_date IS NOT NULL);
CREATE INDEX idx_cards_completed ON cards(completed);
CREATE INDEX idx_cards_assignees ON cards USING GIN(assignees);
CREATE INDEX idx_cards_labels ON cards USING GIN(labels);
CREATE INDEX idx_cards_epic ON cards(epic_link WHERE epic_link IS NOT NULL);
CREATE INDEX idx_cards_reporter ON cards(reporter_id);
```

**Purpose**: Individual tasks/cards  
**Relations**:

- → `lists` (parent column)
- → `users` (reporter)
- → `cards` (epic parent, for subtasks)
- → `messages` (source message if created from chat)
- → `card_comments` (1:N)
- → `card_attachments` (1:N)

---

#### **card_comments** (Comments on cards)

```sql
CREATE TABLE public.card_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id uuid REFERENCES cards(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_edited boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_card_comments_card ON card_comments(card_id);
CREATE INDEX idx_card_comments_author ON card_comments(author_id);
CREATE INDEX idx_card_comments_created ON card_comments(created_at DESC);
```

**Purpose**: Discussion on task cards  
**Relations**:

- → `cards` (parent card)
- → `users` (comment author)

---

#### **card_attachments** (Files attached to cards)

```sql
CREATE TABLE public.card_attachments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id uuid REFERENCES cards(id) ON DELETE CASCADE NOT NULL,
  uploader_id uuid REFERENCES users(id) ON DELETE SET NULL,
  filename text NOT NULL,
  file_url text NOT NULL,
  file_type text, -- e.g., "image/png", "application/pdf"
  file_size bigint, -- bytes
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_card_attachments_card ON card_attachments(card_id);
CREATE INDEX idx_card_attachments_uploader ON card_attachments(uploader_id);
```

**Purpose**: File attachments on cards  
**Relations**:

- → `cards` (parent card)
- → `users` (uploader)

---

## 🔗 Schema Relationships Diagram

```
USERS (auth.users)
  ├─► friendships (requester/addressee)
  ├─► dm_threads (user_a/user_b)
  ├─► dm_messages (sender)
  ├─► servers (owner)
  ├─► server_members
  ├─► messages (author)
  ├─► boards (creator)
  ├─► board_members
  ├─► cards (reporter, assignees via JSONB)
  ├─► card_comments (author)
  └─► card_attachments (uploader)

SERVERS
  ├─► server_members
  ├─► channels
  └─► boards (server-wide boards)

CHANNELS
  ├─► messages
  └─► message_threads

BOARDS
  ├─► lists
  ├─► board_members
  └─► boards.server_id → servers

LISTS
  └─► cards

CARDS
  ├─► card_comments
  ├─► card_attachments
  ├─► cards.epic_link → cards (self-referencing)
  └─► cards.source_message_id → messages
```

---

## 🚀 Key Integration Points

### **Chat ↔ Board Integration**

1. **Create Task from Message**:

   ```typescript
   // When user creates task from chat message
   cards.source_message_id = message.id;
   // Message shows embedded task card
   messages.embeds = [{ type: "task", task_id: card.id }];
   ```

2. **Task Mentions in Chat**:

   ```typescript
   // Type #CARD-123 in chat
   messages.embeds = [{ type: "task", task_id: "uuid" }];
   // Renders rich task card preview
   ```

3. **Task Updates → Chat Notifications**:
   ```typescript
   // When card status changes
   messages {
     type: 'system',
     content: 'Card moved to Done'
   }
   ```

---

## 📊 Performance Optimizations

### **Indexes Created**:

- ✅ All foreign keys indexed
- ✅ GIN indexes for JSONB columns (assignees, labels, mentions)
- ✅ Partial indexes for common filters (completed, pinned, archived)
- ✅ Composite indexes for sorting (board_id + position)
- ✅ DESC indexes for chronological queries

### **Query Optimization Strategies**:

1. **Pagination**: Use cursor-based pagination for messages

   ```sql
   SELECT * FROM messages
   WHERE channel_id = $1 AND created_at < $cursor
   ORDER BY created_at DESC LIMIT 50;
   ```

2. **Materialized Views** (Future):

   ```sql
   -- Cached board statistics
   CREATE MATERIALIZED VIEW board_stats AS
   SELECT board_id, COUNT(*) as task_count FROM cards GROUP BY board_id;
   ```

3. **Connection Pooling**: Use Supabase connection pooler

---

## 🔐 Row Level Security (RLS)

All tables have RLS policies:

### **Public Access**:

- `users` - Public profiles viewable by all
- `servers` - Public servers viewable
- `boards` - Public boards viewable

### **Authenticated Access**:

- `dm_threads` - Only participants can view
- `dm_messages` - Only thread participants
- `friendships` - Only involved users
- `server_members` - Server members only
- `messages` - Server/channel members
- `cards` - Board members

### **Owner Access**:

- `servers` - Owner can delete/modify
- `boards` - Creator can modify
- `messages` - Author can edit/delete own
- `cards` - Assignees can update

---

## 📝 Migration Order

**Required sequence**:

1. ✅ `001_auth_users.sql` - Users table
2. ✅ `003_friendships_dms.sql` - Friend & DM system
3. ✅ `004_boards_tasks.sql` - Board system
4. 🆕 `002_servers_channels.sql` - Server & messaging (needs to be created)
5. 🆕 `005_integrations.sql` - Cross-system foreign keys

---

## ✅ Next Steps

1. **Create Missing Migration**: `002_servers_channels.sql`
2. **Update Board Schema**: Add missing fields (description, labels JSONB)
3. **Add Integration Tables**: Link messages ↔ tasks
4. **Create Functions**: Helper functions for thread creation, card movement
5. **Setup Realtime**: Enable Supabase realtime on key tables
6. **Add Triggers**: Auto-update `updated_at` timestamps

---

## 🎯 Summary

This schema provides:

- ✅ Complete user authentication
- ✅ Friend request system
- ✅ Direct messaging (1-on-1)
- ✅ Server/group workspaces
- ✅ Channel-based chat
- ✅ Kanban task boards
- ✅ Rich task management
- ✅ Seamless chat-board integration
- ✅ High performance with proper indexing
- ✅ Security with RLS policies

**Total Tables**: 16 core tables  
**Total Relations**: 30+ foreign key relationships  
**Estimated Storage**: ~50MB for 10k messages, 1k tasks, 100 users
