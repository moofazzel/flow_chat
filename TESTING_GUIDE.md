# Task Details Modal - Complete Testing Guide

## ✅ FIXES COMPLETED

### 1. Assignee Management (FIXED)
**Problem**: TaskDetailsModal was storing usernames instead of user IDs  
**Solution**: Updated to store UUIDs in assignees array  
**Files Modified**:
- `app/components/TaskDetailsModal.tsx` - `handleAddMember` function (line 670)
- `app/components/TaskDetailsModal.tsx` - Assignees display section (line 943)

**What Changed**:
```typescript
// Before: stored usernames
assignees: ["John Doe", "Jane Smith"]

// After: stores user IDs (UUIDs)
assignees: ["550e8400-e29b-41d4-a716-446655440000", "6ba7b810-9dad-11d1-80b4-00c04fd430c8"]
```

### 2. Display Resolution (FIXED)
- Modal now looks up user IDs in `boardMembers` to display usernames
- Fallback to shortened UUID if member not found in board
- Activity logs still show user names for readability

---

## 🧪 TESTING INSTRUCTIONS

### Prerequisites
1. Make sure you're logged in to the app
2. Have a server selected
3. Have a board with at least one list created
4. Have at least one other user added to the board as a member

### Test 1: Assign Member to Task ✅

**Steps**:
1. Open a task from the board (click on any card)
2. In the right sidebar, click the **"Members"** button
3. You should see a list of board members
4. Click on a member's name to assign them
5. ✅ **Verify**: Member badge appears in the "Assignees" section
6. ✅ **Verify**: Toast notification appears: "Assigned to [Name]"
7. ✅ **Verify**: Activity message appears in the linked channel chat

**Database Verification**:
```sql
-- Run this in Supabase SQL Editor
SELECT id, title, assignees 
FROM cards 
WHERE id = '<YOUR_TASK_ID>';

-- Should show: { "assignees": ["uuid1", "uuid2"] }
```

**Expected Activity Message**:
```
👤 YourUsername assigned JohnDoe to Task Title
Board: BoardName
```

### Test 2: Remove Assignee ✅

**Steps**:
1. With the same task open, find the assignee badge in the "Assignees" section
2. Hover over the badge - an "X" button should appear
3. Click the "X" button
4. ✅ **Verify**: Badge disappears immediately
5. ✅ **Verify**: Toast notification: "Removed [Name]"
6. ✅ **Verify**: Activity message in chat

**Expected Activity Message**:
```
👤 YourUsername removed JohnDoe from Task Title
Board: BoardName
```

### Test 3: Add Label to Task ✅

**Steps**:
1. Open a task
2. Click the **"Labels"** button in the sidebar
3. Select an existing label OR create a new one
4. ✅ **Verify**: Colored label badge appears under task title
5. ✅ **Verify**: Toast notification appears
6. ✅ **Verify**: Activity message in chat

**Database Verification**:
```sql
SELECT id, title, labels 
FROM cards 
WHERE id = '<YOUR_TASK_ID>';

-- Should show: { "labels": ["label-id-1", "label-id-2"] }
```

**Expected Activity Message**:
```
🏷️ YourUsername added label "Bug" to Task Title
Board: BoardName
```

### Test 4: Set Due Date ✅

**Steps**:
1. Open a task
2. Click the **"Due Date"** button
3. Pick a date from the calendar popup
4. ✅ **Verify**: Due date badge appears (shows date like "Dec 31")
5. ✅ **Verify**: Badge color changes if date is in the past (red)
6. ✅ **Verify**: Activity message in chat

**Expected Activity Message**:
```
📅 YourUsername set due date to Dec 31, 2025 for Task Title
Board: BoardName
```

**To Remove Date**:
1. Click "Due Date" button again
2. Click "Remove Date" at bottom of calendar
3. ✅ **Verify**: Badge disappears

### Test 5: Add Subtask/Checklist Item ✅

**Steps**:
1. Open a task
2. Scroll down to the **"Checklist"** section
3. Click **"+ Add an item"** (or if no items exist, the button shows at the top)
4. Type a subtask title (e.g., "Review pull request")
5. Press Enter or click outside to save
6. ✅ **Verify**: Subtask appears in the list with a checkbox
7. ✅ **Verify**: Progress bar shows "0/1" (0%)
8. Click the checkbox to complete the subtask
9. ✅ **Verify**: Progress bar updates to "1/1" (100%)
10. ✅ **Verify**: Activity messages for both add and complete

**Database Verification**:
```sql
SELECT cs.id, cs.title, cs.completed, cs.position
FROM card_subtasks cs
WHERE cs.card_id = '<YOUR_TASK_ID>'
ORDER BY cs.position;
```

**Expected Activity Messages**:
```
☑️ YourUsername added checklist item "Review pull request" to Task Title
✅ YourUsername completed checklist item "Review pull request" in Task Title
```

### Test 6: Add Comment ✅

**Steps**:
1. Open a task
2. Scroll down to the **"Activity"** section
3. Type a comment in the text box (e.g., "This looks good!")
4. Press Enter or click the send button
5. ✅ **Verify**: Comment appears immediately with your avatar
6. ✅ **Verify**: Timestamp shows "Just now"
7. Wait a few seconds and refresh - timestamp should update

**Database Verification**:
```sql
SELECT cc.id, cc.content, cc.created_at, u.username
FROM card_comments cc
JOIN users u ON cc.author_id = u.id
WHERE cc.card_id = '<YOUR_TASK_ID>'
ORDER BY cc.created_at DESC;
```

### Test 7: Upload Attachment (Image) ✅

**Steps**:
1. Open a task
2. Click the **"Attachment"** button in sidebar
3. Select an image file (JPG, PNG, etc.) under 5MB
4. Wait for upload to complete
5. ✅ **Verify**: Image thumbnail appears in "Attachments" section
6. ✅ **Verify**: Can click image to view full size
7. ✅ **Verify**: File size shown (e.g., "245 KB")
8. ✅ **Verify**: Activity message in chat

**Expected Activity Message**:
```
📎 YourUsername attached screenshot.png to Task Title
Board: BoardName
```

**To Delete**:
1. Hover over attachment thumbnail
2. Click the trash icon
3. ✅ **Verify**: Attachment disappears
4. ✅ **Verify**: File removed from Supabase storage

### Test 8: Mark Task Complete ✅

**Steps**:
1. Open a task
2. Click the **"Mark as Complete"** button (green button at top right)
3. ✅ **Verify**: Celebration animation plays (check mark spinning)
4. ✅ **Verify**: Success toast: "🎉 Task completed!"
5. ✅ **Verify**: Task moves to "Done" column on the board
6. ✅ **Verify**: Activity message in chat
7. ✅ **Verify**: Task card shows green "Complete" badge

**Expected Activity Message**:
```
✅ YourUsername completed task Task Title
Board: BoardName
```

### Test 9: Change Task Priority ✅

**Steps**:
1. Open a task
2. Click the priority badge at the top (shows current priority like "Medium")
3. Select a different priority from the dropdown
4. ✅ **Verify**: Badge color changes immediately
5. ✅ **Verify**: Activity message in chat

**Priority Colors**:
- **Low**: Gray
- **Medium**: Yellow
- **High**: Orange  
- **Urgent**: Red

**Expected Activity Message**:
```
🎯 YourUsername changed priority from Medium to High for Task Title
Board: BoardName
```

### Test 10: Edit Task Title ✅

**Steps**:
1. Open a task
2. Click on the task title at the top
3. Edit the title text
4. Press Enter or click outside to save
5. ✅ **Verify**: Title updates everywhere (modal, board card, chat)
6. ✅ **Verify**: Activity message in chat

**Expected Activity Message**:
```
✏️ YourUsername renamed task from "Old Title" to "New Title"
Board: BoardName
```

### Test 11: Edit Task Description ✅

**Steps**:
1. Open a task
2. Click on the description area or "Edit description" button
3. Type a description (supports Markdown!)
4. Click "Save" button
5. ✅ **Verify**: Description appears formatted
6. ✅ **Verify**: Activity message in chat (if description changed)

**Markdown Support**:
- **Bold**: `**text**`
- *Italic*: `*text*`
- Lists: `- item` or `1. item`
- Links: `[text](url)`
- Code: `` `code` ``

### Test 12: Delete Task ✅

**Steps**:
1. Open a task
2. Click the 3-dot menu at top right
3. Scroll to bottom and click "Delete" (red button)
4. Confirm deletion in the dialog
5. ✅ **Verify**: Modal closes
6. ✅ **Verify**: Task disappears from board
7. ✅ **Verify**: Success toast appears

---

## 🐛 TROUBLESHOOTING

### Issue: "Member not found" or UUID shows instead of name

**Cause**: User is assigned but not a board member  
**Fix**: 
1. Go to Board Settings → Members
2. Add the user to the board first
3. Then assign them to tasks

### Issue: Labels not showing

**Cause**: Labels might be board-specific  
**Fix**:
1. Check if board has labels defined
2. Go to Board Settings → Labels to create labels
3. Then assign them to tasks

### Issue: Changes not appearing in chat

**Cause**: Channel not linked to board  
**Check**:
- Verify `channelId` prop is passed to TaskDetailsModal
- Verify you're viewing the correct channel
- Check browser console for errors

### Issue: Attachments not uploading

**Possible Causes**:
1. File size > 5MB
2. Supabase storage bucket not configured
3. Missing permissions in RLS policies

**Debug Steps**:
```sql
-- Check storage policies
SELECT * FROM storage.policies 
WHERE bucket_id = 'card-attachments';
```

---

## 📊 EXPECTED DATABASE STATE

After completing all tests, your database should have:

```sql
-- Sample card with all features
{
  "id": "04fc29d5-c269-47a1-b180-23683d97ea71",
  "title": "Updated Task Title",
  "description": "This is a detailed description",
  "priority": "high",
  "assignees": ["550e8400-e29b-41d4-a716-446655440000"],
  "labels": ["label-bug", "label-urgent"],
  "due_date": "2025-12-31T23:59:59Z",
  "completed": false
}
```

**Related Records**:
- 2-3 comments in `card_comments`
- 2-3 subtasks in `card_subtasks`  
- 1-2 attachments in `card_attachments` + storage bucket
- 10+ activity messages in `messages` table (one for each action)

---

## ✨ SUCCESS CRITERIA

All features working if:

- ✅ Can assign/unassign members by clicking
- ✅ Assignee names display correctly (not UUIDs)
- ✅ All actions generate activity messages in chat
- ✅ Task cards in chat show updated info (assignees count, labels count, etc.)
- ✅ Changes persist after refreshing page
- ✅ Database contains proper UUIDs/IDs (not plain text names)
- ✅ No console errors during operations
- ✅ Toast notifications appear for each action

---

## 📝 NOTES

1. **Real-time Updates**: Changes should appear immediately due to Supabase real-time subscriptions

2. **Activity Tracking**: Every action logs to the linked channel (if `channelId` is provided)

3. **Permissions**: Make sure users are:
   - Added to the server
   - Added as board members (for board operations)
   - Have proper RLS permissions in Supabase

4. **Performance**: With many subtasks/comments, scrolling might slow down. This is expected for demo data.

5. **Data Consistency**: The system now properly stores:
   - User IDs (UUIDs) for assignees
   - Label IDs for labels
   - ISO timestamps for dates
   - All according to database schema

---

**Last Updated**: November 28, 2025
**Version**: 1.0
**Status**: ✅ Ready for testing
