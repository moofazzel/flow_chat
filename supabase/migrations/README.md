# 🗄️ Flow Chat Database Migrations

This directory contains the organized database schema for Flow Chat, split into logical migrations for better maintainability and deployment.

## 📁 Migration Files

### **001_auth_users.sql**
**Core Authentication & User Management**
- User profile table linked to `auth.users`
- Automatic profile creation on signup
- User status tracking (online/idle/dnd/offline)
- RLS policies for user data security

### **002_workspaces_channels.sql** 
**Team Communication Infrastructure**
- Public/private/voice channels
- Channel messages with attachments and reactions
- Message editing, replies, and threading
- Full-text search capabilities

### **003_friendships_dms.sql**
**Friend System & Direct Messaging**
- Friend requests (pending/accepted/blocked)
- DM thread creation and management
- Private messaging between friends
- Automatic thread creation helper function

### **004_boards_tasks.sql**
**Kanban Board & Task Management**
- Kanban boards with custom columns
- Task cards with priorities, labels, assignments
- Drag & drop positioning system
- Due dates, descriptions, and subtasks

### **005_functions_triggers.sql**
**Database Functions & Automation**
- Updated timestamp triggers
- Helper functions for complex operations
- Search functions and performance views
- Data integrity and validation

## 🚀 Deployment Instructions

### **Option 1: Supabase Dashboard**
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Run each migration file **in order** (001 → 005)
4. Verify each migration completes successfully

### **Option 2: Supabase CLI**
```bash
# Initialize Supabase (if not done)
supabase init

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Run migrations
supabase db reset  # This will run all migrations
```

### **Option 3: Manual psql**
```bash
# Connect to your database
psql "postgresql://postgres:PASSWORD@HOST:PORT/postgres"

# Run each file in order
\i supabase/migrations/001_auth_users.sql
\i supabase/migrations/002_workspaces_channels.sql
\i supabase/migrations/003_friendships_dms.sql
\i supabase/migrations/004_boards_tasks.sql
\i supabase/migrations/005_functions_triggers.sql
```

## 📊 Database Schema Overview

```
Flow Chat Database Schema
├── 👤 Users & Auth
│   └── users (profiles linked to auth.users)
├── 💬 Communication  
│   ├── channels (team chat)
│   └── messages (channel messages)
├── 👥 Relationships
│   ├── friendships (friend requests/status)
│   ├── dm_threads (conversation threads)
│   └── dm_messages (private messages)
└── 📋 Project Management
    ├── boards (kanban boards)
    ├── lists (board columns)
    └── cards (tasks/items)
```

## 🔧 Key Features

### **Security**
- ✅ Row Level Security (RLS) on all tables
- ✅ User-based access control
- ✅ Secure functions with SECURITY DEFINER

### **Performance**
- ✅ Strategic indexes on frequently queried columns
- ✅ Optimized queries for real-time features
- ✅ Efficient foreign key relationships

### **Scalability**
- ✅ UUID primary keys for distributed systems
- ✅ JSONB for flexible metadata storage
- ✅ Proper table constraints and validations

## 🛠️ Helper Functions

### **Friend System**
- `are_users_friends(user_id_1, user_id_2)` - Check friendship status
- `get_friendship_status(user_id_1, user_id_2)` - Get relationship type
- `create_dm_thread(user_id_1, user_id_2)` - Create/get DM thread

### **Board Management**
- `get_next_card_position(list_id)` - Get next position for new card
- `get_next_list_position(board_id)` - Get next position for new list

### **Search**
- `search_users(query, current_user, limit)` - Search for users

## 🔄 Rollback Instructions

If you need to rollback any migration, use the DROP statements provided in each file's header comments.

**⚠️ WARNING**: Rollback will delete all data in the affected tables!

```sql
-- Example: Rollback friendship system
DROP FUNCTION IF EXISTS public.create_dm_thread(uuid, uuid);
DROP TABLE IF EXISTS public.dm_messages;
DROP TABLE IF EXISTS public.dm_threads;
DROP TABLE IF EXISTS public.friendships;
```

## 📈 Next Steps

1. **Deploy the migrations** to your Supabase project
2. **Update your application** to use the new database functions
3. **Test the friend request flow** end-to-end
4. **Consider adding**:
   - Real-time subscriptions
   - Notification system
   - Advanced search indexes
   - Analytics tables

## 📞 Need Help?

- Check the Supabase docs: https://supabase.com/docs
- Review the SQL error logs in your Supabase dashboard
- Verify your RLS policies are working correctly
- Test functions in the SQL editor before using in your app

---

**Built for Flow Chat** - Discord-style communication with Kanban project management 🚀