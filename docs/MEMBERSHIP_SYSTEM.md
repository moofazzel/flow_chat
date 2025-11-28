# Membership System Architecture

This document describes how membership is handled across the workspace, including chat, voice channels, and boards.

## Overview

The membership system follows the **Single Responsibility Principle** with dedicated services for each concern:

| Service | Responsibility |
|---------|---------------|
| `membershipService.ts` | Core membership operations (server & board) |
| `inviteService.ts` | Invite creation, validation, and acceptance |
| `serverService.ts` | Server CRUD operations |
| `boardService.ts` | Board/List/Card CRUD operations |

## Tables

### `server_members`
Primary membership table - determines access to server, channels, chat, and voice.

```sql
- id: UUID (PK)
- server_id: UUID (FK -> servers)
- user_id: UUID (FK -> auth.users)
- role: 'owner' | 'admin' | 'member'
- joined_at: TIMESTAMPTZ
```

### `board_members`
Board-specific membership for private boards.

```sql
- id: UUID (PK)
- board_id: UUID (FK -> boards)
- user_id: UUID (FK -> auth.users)
- role: 'admin' | 'member' | 'observer'
- added_at: TIMESTAMPTZ
```

### `server_invites`
Shareable invite links with expiration and usage limits.

```sql
- id: UUID (PK)
- server_id: UUID (FK -> servers)
- code: VARCHAR(20) (UNIQUE)
- created_by: UUID (FK -> auth.users)
- expires_at: TIMESTAMPTZ (nullable)
- max_uses: INTEGER (nullable)
- uses: INTEGER (default 0)
- created_at: TIMESTAMPTZ
```

## Access Control

### Channel & Chat Access
- Determined by `server_members` table
- RLS policies check `server_members.user_id = auth.uid()`

### Voice Channel Access
- Same as chat - determined by `server_members`

### Board Access (3 visibility levels)

| Visibility | Access Rule |
|------------|-------------|
| `public` | Any authenticated user |
| `server` | Server members only (via `server_members`) |
| `private` | Board creator + `board_members` only |

## Invite Flow

### 1. Friend Direct Invite
```
User clicks "Invite" on friend
  -> inviteFriendToServer(serverId, friendId)
  -> Adds entry to server_members
  -> Friend has immediate access
```

### 2. Invite Link
```
User generates invite link
  -> createServerInvite(serverId, options)
  -> Creates entry in server_invites with unique code
  -> User shares link: /invite/{code}

Recipient clicks link
  -> validateInvite(code) - checks expiration & uses
  -> acceptInvite(code)
  -> Adds entry to server_members
  -> Increments uses count
```

## Auto-Sync Triggers

### When server board is created
```sql
TRIGGER: trigger_auto_add_server_members_to_board
  -> Adds all server members to board_members
```

### When user joins server
```sql
TRIGGER: trigger_auto_add_member_to_server_boards
  -> Adds new member to all server-visibility boards
```

## Service API

### membershipService.ts

```typescript
// Server membership
getServerMembers(serverId): ServerMember[]
getServerMember(serverId, userId): ServerMember | null
isServerMember(serverId, userId): boolean
addServerMember(serverId, userId, role?): ServerMember
updateServerMemberRole(serverId, userId, newRole): ServerMember
removeServerMember(serverId, userId): void

// Board membership
getBoardMembers(boardId): BoardMember[]
getBoardMember(boardId, userId): BoardMember | null
isBoardMember(boardId, userId): boolean
addBoardMember(boardId, userId, role?): BoardMember
updateBoardMemberRole(boardId, userId, newRole): BoardMember
removeBoardMember(boardId, userId): void

// Cross-membership
getMembershipStatus(serverId, boardId, userId): MembershipStatus
getChannelMembers(channelId): ServerMember[]
syncServerMembersToBoard(serverId, boardId): void

// Subscriptions
subscribeToServerMembers(serverId, callback): unsubscribe
subscribeToBoardMembers(boardId, callback): unsubscribe
```

### inviteService.ts

```typescript
// Invite links
createServerInvite(serverId, options?): ServerInvite
getServerInvites(serverId): ServerInvite[]
getInviteByCode(code): ServerInvite | null
validateInvite(code): { valid, reason?, invite? }
acceptInvite(code): InviteResult
deleteInvite(inviteId): void
getInviteUrl(code): string

// Direct invites
inviteFriendToServer(serverId, friendId): InviteResult

// Maintenance
cleanupExpiredInvites(): number
```

## RLS Policies

### Boards (018_fix_board_membership_rls.sql)
- SELECT: Based on visibility type
- INSERT: Authenticated + created_by = auth.uid()
- UPDATE: Creator or board admin
- DELETE: Creator only

### Lists/Cards
- Inherit access from parent board
- INSERT/UPDATE: Board members (not observers)
- DELETE: Board creator or admin only

### Server Invites (019_server_invites.sql)
- SELECT: Any authenticated (for validation)
- INSERT: Server members only
- UPDATE/DELETE: Creator or server admin/owner

## Migration Files

| File | Purpose |
|------|---------|
| `018_fix_board_membership_rls.sql` | Fix board RLS to use proper membership checks |
| `019_server_invites.sql` | Create server_invites table |

## Components

| Component | Purpose |
|-----------|---------|
| `InvitePeopleModal.tsx` | Single invite UI (Friends, Link, Email tabs) |
| `TeamMembersPanel.tsx` | Display server members (no invite functionality) |
| `app/invite/[code]/page.tsx` | Handle incoming invite links |

## Important Notes

1. **Server membership is the primary access control** - Being a server member grants access to:
   - All text channels
   - All voice channels
   - All server-visibility boards

2. **Board members table is secondary** - Only used for:
   - Private boards (visibility = 'private')
   - Tracking specific board-level roles

3. **Triggers auto-sync** - When users join servers or boards are created, triggers automatically manage board_members

4. **Email invites not implemented** - The Email tab in InvitePeopleModal shows a placeholder message
