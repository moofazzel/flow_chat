# 🎯 Server & Channel Features - Implementation Plan

## Current Status

- ✅ Servers display and can be created
- ✅ Server switching works
- ⚠️ Channels may not be showing (checking...)
- ❌ Invite People - Not implemented
- ❌ Server Settings - Not implemented
- ❌ Edit Server Profile - Not implemented
- ❌ Create Category - Not implemented

---

## Priority 1: Fix Channels Display 🔴

### Issue

Channels not showing in UI even though code exists

### Debugging Steps

1. Check console logs for:

   - "📡 Loading channels for server: ..."
   - "📋 Channels loaded: ..."
   - "✅ Set channels - Text: X Voice: Y"

2. Possible causes:
   - No channels created for server yet
   - RLS policy blocking channel access
   - Channel query failing

### Fix Actions

- [ ] Check if server has channels created
- [ ] Verify RLS policies on `channels` table
- [ ] Create default channels when creating server

---

## Priority 2: Implement Invite People Modal 👥

### Requirements

- Modal to invite users to server
- Enter email or username
- Send invitation
- Generate invite link
- Set invite expiration
- Set max uses

### Implementation

1. Create invite link generation function
2. Add `server_invites` table (if not exists)
3. Implement InvitePeopleModal UI
4. Connect to database

---

## Priority 3: Server Settings Modal ⚙️

### Features Needed

- **Overview Tab**

  - Server name
  - Server description
  - Server icon
  - Delete server

- **Roles Tab**

  - Manage roles
  - Create new roles
  - Set permissions

- **Members Tab**

  - View all members
  - Manage member roles
  - Kick/ban members

- **Moderation Tab**
  - Verification level
  - Content filter
  - Audit log

### Implementation

1. Create tabbed modal UI
2. Add role management
3. Add member management
4. Connect to database

---

## Priority 4: Edit Server Profile Modal ✏️

### Features

- Update server name
- Update server description
- Upload server icon
- Change server banner
- Set server vanity URL

### Implementation

1. Create profile edit form
2. Add image upload
3. Connect to updateServer function

---

## Priority 5: Create Category Feature 📁

### Features

- Create channel categories
- Organize channels into categories
- Drag & drop channels between categories
- Category permissions

### Implementation

1. Add category field to channels
2. Update channel display to group by category
3. Add category creation modal
4. Update channel creation to include category

---

## Priority 6: Default Channels on Server Creation 🏗️

### Features

When creating a server, automatically create:

- #general (text channel)
- #announcements (announcement channel)
- General (voice channel)

### Implementation

```typescript
async function createServerWithDefaults(serverData) {
  // 1. Create server
  const server = await createServer(...);

  // 2. Create default channels
  await createChannel(server.id, "general", "text");
  await createChannel(server.id, "announcements", "announcement");
  await createChannel(server.id, "General", "voice");

  return server;
}
```

---

## Implementation Order

### Phase 1: Critical Fixes (Today)

1. ✅ Fix channels not showing
2. ✅ Add default channels on server creation
3. ✅ Test channel display

### Phase 2: User Management (Next)

4. Implement Invite People modal
5. Add member management
6. Add role system

### Phase 3: Server Management (After)

7. Implement Server Settings
8. Implement Edit Server Profile
9. Add category system

---

## Database Schema Additions Needed

### server_invites table

```sql
CREATE TABLE public.server_invites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id uuid REFERENCES public.servers(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  inviter_id uuid REFERENCES public.users(id),
  max_uses integer DEFAULT NULL,
  uses integer DEFAULT 0,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);
```

### roles table (if needed)

```sql
CREATE TABLE public.server_roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id uuid REFERENCES public.servers(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text,
  permissions jsonb DEFAULT '{}'::jsonb,
  position integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);
```

---

## Next Steps

**Check browser console** and tell me what you see for:

- Server loading
- Channel loading
- Any errors

Then we'll fix channels first, then implement the missing features in order!
