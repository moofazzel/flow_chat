# Task Details Modal - Testing Checklist

## ✅ FIXES APPLIED

### Fixed: Assignee Storage
- **Issue**: TaskDetailsModal was storing usernames instead of user IDs in assignees array
- **Fix**: Updated `handleAddMember` to store `memberId` (UUID) instead of `memberName`
- **Location**: `app/components/TaskDetailsModal.tsx` line 670
- **Changes**:
  - Now checks `currentAssignees.includes(memberId)` instead of username
  - Stores user IDs in the assignees array
  - Display logic updated to find members by ID and show usernames

### Database Schema Compliance
- ✅ `assignees` field now correctly stores: `["uuid1", "uuid2"]`
- ✅ Compatible with database JSONB field structure
- ✅ Proper resolution of user IDs to display names in UI

## Current Status
The system should now properly:
1. Store user IDs (UUIDs) in the assignees array
2. Display usernames by looking up user IDs in board_members
3. Allow toggling assignees on/off
4. Send proper activity notifications with user names

## Testing Steps

### 1. Assign Member to Task
- [ ] Open a task from the board (one with UUID id from Supabase)
- [ ] Click "Members" button in the sidebar
- [ ] Select a board member to assign
- [ ] **Expected**: User ID should be stored in database
- [ ] **Check**: Verify in Supabase that `assignees` contains UUID, not username
- [ ] **Expected**: Task card should show assignee avatar/name

### 2. Add Label to Task  
- [ ] Open a task details modal
- [ ] Click "Labels" button
- [ ] Select/create a label
- [ ] **Expected**: Label ID should be stored
- [ ] **Check**: Verify in Supabase that `labels` array contains label IDs
- [ ] **Expected**: Task card should display colored labels

### 3. Set Due Date
- [ ] Open task details modal
- [ ] Click "Due Date" button
- [ ] Select a date from calendar
- [ ] **Expected**: Date should be stored in ISO format
- [ ] **Check**: Verify in Supabase that `due_date` field is set
- [ ] **Expected**: Task card should show due date badge

### 4. Mark Task Complete
- [ ] Open task details modal
- [ ] Click "Mark as Complete" button
- [ ] **Expected**: Task status should change to "Done" column
- [ ] **Expected**: Completion animation should play
- [ ] **Expected**: Activity message should appear in chat

### 5. Add Checklist/Subtask
- [ ] Open task details modal
- [ ] Scroll to "Checklist" section
- [ ] Click "+ Add an item"
- [ ] Enter subtask title and save
- [ ] **Expected**: Subtask should appear in list
- [ ] **Expected**: Progress bar should update
- [ ] Toggle subtask completion
- [ ] **Expected**: Progress bar should update accordingly

### 6. Add Comment
- [ ] Open task details modal
- [ ] Scroll to "Activity" section
- [ ] Type a comment and submit
- [ ] **Expected**: Comment should appear with user avatar/name
- [ ] **Expected**: Timestamp should be displayed

### 7. Add Attachment
- [ ] Open task details modal
- [ ] Click "Attachment" button
- [ ] Upload an image file
- [ ] **Expected**: File should upload to Supabase storage
- [ ] **Expected**: Attachment should appear in task
- [ ] Click on attachment to view
- [ ] Delete attachment
- [ ] **Expected**: File should be removed from storage

## Database Verification Queries

```sql
-- Check assignees array structure
SELECT id, title, assignees 
FROM cards 
WHERE assignees IS NOT NULL AND assignees != '[]'::jsonb;

-- Check labels array
SELECT id, title, labels
FROM cards
WHERE labels IS NOT NULL AND labels != '[]'::jsonb;

-- Check due dates
SELECT id, title, due_date
FROM cards
WHERE due_date IS NOT NULL;

-- Check subtasks
SELECT c.id, c.title, cs.title as subtask_title, cs.completed
FROM cards c
JOIN card_subtasks cs ON c.id = cs.card_id
ORDER BY c.id, cs.position;

-- Check comments
SELECT c.id, c.title, cc.content, cc.created_at, u.username
FROM cards c
JOIN card_comments cc ON c.id = cc.card_id
JOIN users u ON cc.author_id = u.id
ORDER BY c.id, cc.created_at;
```

## Expected Data Format

### Assignees (Should be UUIDs)
```json
["550e8400-e29b-41d4-a716-446655440000", "6ba7b810-9dad-11d1-80b4-00c04fd430c8"]
```

### Labels (Should be label IDs)
```json
["label-abc123", "label-def456"]
```

### Due Date (Should be ISO timestamp)
```
2025-12-31T23:59:59.000Z
```

## Known Issues to Fix

1. **handleAddMember** in TaskDetailsModal.tsx:
   - Currently stores `memberName` (string username)
   - Should store `memberId` (UUID)
   
2. **Task display in chat**:
   - Needs to resolve user IDs to usernames for display
   - Should fetch user data from board_members or server_members

3. **Label display**:
   - Needs to resolve label IDs to actual label objects
   - Should fetch from board_labels table
