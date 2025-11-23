# DM Reactions/Edit/Delete Debugging Guide

## Quick Test Steps:

### 1. Open Browser Console (F12)

Look for these logs when you try to add a reaction:

- `handleAddReaction called: {messageId: "...", emoji: "👍"}`
- `Reaction sent successfully`

If you see:

- `sendReaction function is not available!` → Hook function not exported properly
- `Failed to send reaction: ...` → Network/broadcast issue

### 2. Check Connection Status

In the chat header, you should see a green dot next to the status.
If not connected, reactions won't broadcast.

### 3. Test Reaction Flow:

**User A (Window 1):**

1. Open chat with User B
2. Hover over a message
3. Click smile icon
4. Click an emoji (e.g., 👍)
5. **Check console** - should see logs

**User B (Window 2):**

1. Keep console open
2. Watch for broadcast event
3. Reaction should appear automatically

### 4. Common Issues:

**If nothing happens when clicking reaction:**

- Check console for `handleAddReaction called` log
- If no log → onClick event not firing
- If log but error → Check error message

**If reaction doesn't sync to other user:**

- Check `isConnected` status in both windows
- Check Supabase Realtime is enabled for the channel
- Check browser console for broadcast errors

**If edit/delete doesn't work:**

- Check console for `handleEditStart called` or `handleDelete called`
- Look for function availability errors

### 5. Quick Fix Checklist:

□ Is the dev server running?
□ Are both users connected (green dot visible)?
□ Is the thread ID valid?
□ Any errors in browser console?
□ Any TypeScript errors in the IDE?

## Expected Console Output:

### When adding a reaction:

```
handleAddReaction called: {messageId: "abc-123", emoji: "👍"}
Reaction sent successfully
```

### When editing:

```
handleEditStart called: "abc-123"
handleEditSave called: {editingMessage: "abc-123", editContent: "edited text"}
Message edited successfully
```

### When deleting:

```
handleDelete called: "abc-123"
Message deleted successfully
```

## If Functions Not Available:

Check that `useDmChat` hook returns:

- `sendReaction`
- `editMessage`
- `deleteMessage`

These should be logged in component with:

```javascript
console.log({ sendReaction, editMessage, deleteMessage });
```
