# 📋 Flow Chat - Quick Reference Guide

---

## 🗄️ DATABASE TABLES (16 Total)

### USER SYSTEM

| Table           | Purpose          | Key Fields                         |
| --------------- | ---------------- | ---------------------------------- |
| **users**       | User profiles    | id, username, email, status        |
| **friendships** | Friend requests  | requester_id, addressee_id, status |
| **dm_threads**  | DM conversations | user_a, user_b                     |
| **dm_messages** | Direct messages  | thread_id, sender_id, content      |

### SERVER SYSTEM

| Table               | Purpose             | Key Fields                     |
| ------------------- | ------------------- | ------------------------------ |
| **servers**         | Group workspaces    | id, name, owner_id             |
| **server_members**  | Membership          | server_id, user_id, role       |
| **channels**        | Text/voice channels | server_id, name, type          |
| **messages**        | Channel messages    | channel_id, author_id, content |
| **reactions**       | Message reactions   | message_id, user_id, emoji     |
| **message_threads** | Thread metadata     | parent_message_id, reply_count |

### BOARD SYSTEM

| Table                | Purpose          | Key Fields                          |
| -------------------- | ---------------- | ----------------------------------- |
| **boards**           | Kanban boards    | id, title, created_by               |
| **board_members**    | Board access     | board_id, user_id, role             |
| **lists**            | Board columns    | board_id, title, position           |
| **cards**            | Task cards       | list_id, title, priority, assignees |
| **card_comments**    | Task discussions | card_id, author_id, content         |
| **card_attachments** | Task files       | card_id, file_url                   |

---

## 🔗 KEY RELATIONSHIPS

```
users (1) ←→ (N) friendships
users (1) ←→ (N) dm_threads ←→ (N) dm_messages
users (1) ←→ (N) servers ←→ (N) channels ←→ (N) messages
users (1) ←→ (N) boards ←→ (N) lists ←→ (N) cards

INTEGRATION:
messages.embeds → cards (task mentions in chat)
cards.source_message_id → messages (tasks from chat)
boards.server_id → servers (server-wide boards)
```

---

## 🚀 COMMON QUERIES

### Get Friend Requests

```sql
-- Incoming requests
SELECT u.* FROM users u
JOIN friendships f ON f.requester_id = u.id
WHERE f.addressee_id = $user_id AND f.status = 'pending';

-- Outgoing requests
SELECT u.* FROM users u
JOIN friendships f ON f.addressee_id = u.id
WHERE f.requester_id = $user_id AND f.status = 'pending';
```

### Get DM Messages

```sql
SELECT
  m.*,
  u.username,
  u.avatar_url
FROM dm_messages m
JOIN users u ON u.id = m.sender_id
WHERE m.thread_id = $thread_id
ORDER BY m.created_at DESC
LIMIT 50;
```

### Get Channel Messages

```sql
SELECT
  m.*,
  u.username,
  u.avatar_url,
  COUNT(r.id) as reaction_count
FROM messages m
JOIN users u ON u.id = m.author_id
LEFT JOIN reactions r ON r.message_id = m.id
WHERE m.channel_id = $channel_id
GROUP BY m.id, u.id
ORDER BY m.created_at DESC
LIMIT 50;
```

### Get Board with Cards

```sql
SELECT
  b.id as board_id,
  b.title as board_title,
  l.id as list_id,
  l.title as list_title,
  json_agg(
    json_build_object(
      'id', c.id,
      'title', c.title,
      'priority', c.priority,
      'assignees', c.assignees,
      'position', c.position
    ) ORDER BY c.position
  ) as cards
FROM boards b
JOIN lists l ON l.board_id = b.id
LEFT JOIN cards c ON c.list_id = l.id AND c.archived = false
WHERE b.id = $board_id
GROUP BY b.id, l.id
ORDER BY l.position;
```

---

## 📊 PERFORMANCE TIPS

### Use Indexes

```sql
-- Chronological queries (most common)
WHERE channel_id = $1 ORDER BY created_at DESC;
-- ✅ Uses: idx_messages_channel_created

-- Search by user
WHERE author_id = $1;
-- ✅ Uses: idx_messages_author

-- JSONB searches
WHERE assignees @> '["user-id"]'::jsonb;
-- ✅ Uses: idx_cards_assignees (GIN index)
```

### Pagination

```sql
-- Cursor-based (recommended)
SELECT * FROM messages
WHERE channel_id = $1 AND created_at < $cursor
ORDER BY created_at DESC
LIMIT 50;

-- Offset-based (slower for large datasets)
SELECT * FROM messages
WHERE channel_id = $1
ORDER BY created_at DESC
LIMIT 50 OFFSET 100; -- ❌ Avoid for large offsets
```

### Batch Inserts

```typescript
// ❌ Bad: Multiple inserts
for (const card of cards) {
  await supabase.from("cards").insert(card);
}

// ✅ Good: Single batch insert
await supabase.from("cards").insert(cards);
```

---

## 🔐 SECURITY CHECKLIST

### RLS Policies

- ✅ All tables have RLS enabled
- ✅ SELECT policies for viewing
- ✅ INSERT policies for creating
- ✅ UPDATE policies for editing
- ✅ DELETE policies for removing

### Common Patterns

```sql
-- Only view own data
USING (auth.uid() = user_id)

-- Server members only
USING (
  EXISTS (
    SELECT 1 FROM server_members
    WHERE server_id = table.server_id
    AND user_id = auth.uid()
  )
)

-- Authors can edit
USING (auth.uid() = author_id)
```

---

## 🛠️ TYPESCRIPT TYPES

### Service Functions Pattern

```typescript
// friendService.ts
export async function sendFriendRequest(
  userId: string,
  targetId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase.from("friendships").insert({
    requester_id: userId,
    addressee_id: targetId,
    status: "pending",
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// channelService.ts
export async function sendMessage(
  channelId: string,
  userId: string,
  content: string
): Promise<{ success: boolean; message?: Message }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      channel_id: channelId,
      author_id: userId,
      content,
    })
    .select()
    .single();

  if (error) return { success: false };
  return { success: true, message: data };
}
```

---

## ⚡ REALTIME SUBSCRIPTIONS

### Subscribe to Channel Messages

```typescript
const channel = supabase
  .channel("channel-messages")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: `channel_id=eq.${channelId}`,
    },
    (payload) => {
      console.log("New message:", payload.new);
      // Update UI
    }
  )
  .subscribe();
```

### Subscribe to Friend Requests

```typescript
const channel = supabase
  .channel("friend-requests")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "friendships",
      filter: `addressee_id=eq.${userId}`,
    },
    (payload) => {
      console.log("Friend request update:", payload);
      // Refresh friend requests
    }
  )
  .subscribe();
```

### Subscribe to Card Updates

```typescript
const channel = supabase
  .channel("board-updates")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "cards",
      filter: `list_id=in.(${listIds.join(",")})`,
    },
    (payload) => {
      console.log("Card update:", payload);
      // Update board UI
    }
  )
  .subscribe();
```

---

## 📁 FILE STRUCTURE

```
lib/
  ├── friendService.ts      # Friend requests
  ├── dmService.ts          # Direct messaging
  ├── serverService.ts      # Server management
  ├── channelService.ts     # Channel operations
  ├── messageService.ts     # Send/edit messages
  ├── boardService.ts       # Board CRUD
  ├── cardService.ts        # Task operations
  └── userService.ts        # User search

supabase/migrations/
  ├── 001_auth_users.sql
  ├── 002_servers_channels.sql   ← NEW!
  ├── 003_friendships_dms.sql
  ├── 004_boards_tasks.sql
  └── 005_functions_triggers.sql
```

---

## ✅ NEXT STEPS

### 1. Run Migration

```bash
cd supabase
supabase migration up

# Or manually in Supabase dashboard
```

### 2. Create Service Files

```bash
# Create missing services
touch lib/serverService.ts
touch lib/channelService.ts
touch lib/messageService.ts
```

### 3. Test Existing Features

- Friend requests
- Direct messages
- Board operations

### 4. Build New Features

- Server creation
- Channel messaging
- Task-message integration

---

**Quick Links**:

- 📖 Full Schema: `DATABASE_SCHEMA_COMPLETE.md`
- 🧪 Testing: `TESTING_GUIDE.md`
- 📋 Plan: `FEATURE_IMPLEMENTATION_PLAN.md`
- 📊 Summary: `SCHEMA_IMPLEMENTATION_SUMMARY.md`
