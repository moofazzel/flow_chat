# ✅ Flow Chat - Testing Checklist

**Date**: 2025-11-23
**Purpose**: Track your testing progress

---

## 📋 Pre-Testing Setup

- [ ] Dev server is running (`npm run dev`)
- [ ] Browser is open to `localhost:3000`
- [ ] Browser console is open (F12)
- [ ] Supabase dashboard is open in another tab
- [ ] Two test user accounts created (or ready to create)

---

## 🧪 Test 1: Friend Request System (15 minutes)

### User Setup

- [ ] User A: Email: ********\_******** Password: ********\_********
- [ ] User B: Email: ********\_******** Password: ********\_********

### Part A: Send Friend Request

**As User A**:

- [ ] Login successful
- [ ] Navigate to Direct Messages OR Friends section
- [ ] Click "Add Friend" button
- [ ] Search modal opens
- [ ] Type User B's username/email in search
- [ ] Search results appear within 500ms
- [ ] User B appears in results
- [ ] Click "Add Friend" button next to User B
- [ ] Toast shows: "Friend request sent to [User B]!"
- [ ] Navigate to Friends → Pending
- [ ] User B appears under "Outgoing" requests
- [ ] No errors in console ✅

**Database Check**:

- [ ] Open Supabase Dashboard
- [ ] Navigate to Table Editor → friendships
- [ ] New row exists with:
  - `requester_id` = User A's ID
  - `addressee_id` = User B's ID
  - `status` = 'pending'

### Part B: Accept Friend Request

**As User B** (new browser window/incognito):

- [ ] Login successful
- [ ] Navigate to Friends → Pending
- [ ] User A appears under "Incoming" requests
- [ ] User A's avatar and name are correct
- [ ] Click "Accept" button
- [ ] Toast shows: "Friend request accepted!"
- [ ] User A disappears from Pending
- [ ] Navigate to Friends → All
- [ ] User A now appears in friends list
- [ ] No errors in console ✅

**Database Check**:

- [ ] Refresh friendships table in Supabase
- [ ] Same row now has `status` = 'accepted'

### Part C: Verify Both Sides

**As User A** (refresh browser):

- [ ] Navigate to Friends → All
- [ ] User B appears in friends list
- [ ] Click on User B
- [ ] "Message" button is visible
- [ ] No errors in console ✅

### Result:

- [ ] ✅ PASS: Friend request system works completely
- [ ] ❌ FAIL: **********************\_**********************

---

## 🧪 Test 2: Direct Message Chat (20 minutes)

### Part A: Start DM Conversation

**As User A**:

- [ ] Navigate to Friends → All
- [ ] Click on User B's name/card
- [ ] Click "Message" button (chat icon)
- [ ] DM conversation opens
- [ ] User B appears in "Direct Messages" sidebar
- [ ] Chat area shows interface (not error)
- [ ] No errors in console ✅

**Database Check**:

- [ ] Open Supabase Dashboard
- [ ] Table Editor → dm_threads
- [ ] New thread exists with User A and User B IDs
- [ ] Copy thread ID: ******************\_******************

### Part B: Send First Message

**As User A**:

- [ ] Type message: "Hello User B! Testing DMs."
- [ ] Press Enter or click Send
- [ ] Message appears in chat area immediately
- [ ] Message shows your avatar
- [ ] Message shows timestamp
- [ ] No errors in console ✅

**Database Check**:

- [ ] Table Editor → dm_messages
- [ ] Filter by thread_id (from above)
- [ ] New message exists with:
  - `content` = "Hello User B! Testing DMs."
  - `sender_id` = User A's ID
  - `thread_id` = (matches thread from above)

###Part C: Receive and Reply
**As User B** (refresh browser):

- [ ] Check "Direct Messages" in sidebar
- [ ] User A appears in DM list
- [ ] Click on User A's DM
- [ ] See "Hello User B! Testing DMs." message
- [ ] Message shows User A's avatar
- [ ] Message shows correct timestamp
- [ ] Type reply: "Hi User A! Got your message!"
- [ ] Press Enter or click Send
- [ ] Reply appears in chat
- [ ] No errors in console ✅

**As User A** (refresh browser):

- [ ] Open DM with User B
- [ ] See both messages in order:
  1. "Hello User B! Testing DMs."
  2. "Hi User A! Got your message!"
- [ ] No errors in console ✅

### Part D: Test Persistence

- [ ] Close browser completely
- [ ] Reopen browser
- [ ] Login as User A
- [ ] Navigate to Direct Messages
- [ ] User B still appears in DM list
- [ ] Click on User B
- [ ] Both messages still visible
- [ ] Messages persisted correctly ✅

### Result:

- [ ] ✅ PASS: Direct messaging works completely
- [ ] ❌ FAIL: **********************\_**********************

---

## 🧪 Test 3: Additional Friend Request Features (10 minutes)

### Part A: Cancel Outgoing Request

**Setup**: Create User C account

- [ ] As User A: Send friend request to User C
- [ ] Navigate to Friends → Pending
- [ ] User C appears under "Outgoing"
- [ ] Click "Cancel" button
- [ ] Toast: "Friend request cancelled"
- [ ] User C disappears from pending
- [ ] Check Supabase: friendship row deleted ✅

### Part B: Decline Incoming Request

- [ ] As User C: Send friend request to User A
- [ ] As User A: Go to Friends → Pending
- [ ] User C appears under "Incoming"
- [ ] Click "Decline" button
- [ ] Toast: "Friend request declined"
- [ ] User C disappears from pending
- [ ] Check Supabase: friendship row deleted ✅

### Result:

- [ ] ✅ PASS: Request management works
- [ ] ❌ FAIL: **********************\_**********************

---

## 🧪 Test 4: Search Functionality (5 minutes)

### Part A: Search Tests

- [ ] Click "Add Friend"
- [ ] Type partial username (e.g., first 3 letters)
- [ ] Results appear within 500ms
- [ ] Continue typing (test debouncing)
- [ ] Results update automatically

### Part B: Different Search Fields

- [ ] Clear search
- [ ] Search by email (partial)
- [ ] User appears in results
- [ ] Clear search
- [ ] Search by full name (partial)
- [ ] User appears in results

### Part C: No Results

- [ ] Type gibberish: "zzxxyyww123"
- [ ] See "No users found" message
- [ ] No errors in console ✅

### Result:

- [ ] ✅ PASS: Search works for all fields
- [ ] ❌ FAIL: **********************\_**********************

---

## 🗄️ Database Verification (5 minutes)

### Required Tables Check

Open Supabase SQL Editor and run:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'friendships', 'dm_threads', 'dm_messages')
ORDER BY table_name;
```

- [ ] `dm_messages` table exists
- [ ] `dm_threads` table exists
- [ ] `friendships` table exists
- [ ] `users` table exists

### Data Verification

```sql
-- Check your test data
SELECT COUNT(*) FROM friendships; -- Should have at least 1
SELECT COUNT(*) FROM dm_threads;  -- Should have at least 1
SELECT COUNT(*) FROM dm_messages; -- Should have at least 2
```

- [ ] friendships count: **\_\_\_**
- [ ] dm_threads count: **\_\_\_**
- [ ] dm_messages count: **\_\_\_**

---

## 📊 Final Results

### Summary

Total tests run: **\_\_\_**  
Tests passed: **\_\_\_**  
Tests failed: **\_\_\_**

### Pass/Fail Rate

- [ ] 100% Pass (All tests passed) → EXCELLENT! Move to building new features
- [ ] 75-99% Pass (1-2 failures) → Good! Fix minor issues
- [ ] 50-74% Pass (3-4 failures) → Need debugging
- [ ] < 50% Pass (5+ failures) → Need help

### Issues Found

List any errors or failures:

1. ***

2. ***

3. ***

### Console Errors

Copy any console errors here:

```
[Paste console errors]
```

---

## ✅ Next Steps

### If All Tests Passed ✅

**Congratulations!** Your friend request and DM systems work perfectly!

**Next**: Start building server/group features

1. Read `FEATURE_IMPLEMENTATION_PLAN.md` Phase 3
2. Create `lib/groupService.ts`
3. Build server management UI
4. Add channel creation

**Estimated time**: 4-6 hours

---

### If Some Tests Failed ❌

**Don't worry!** Let's debug together.

**Next**: Share your results

1. Note which test(s) failed
2. Copy console errors
3. Check Supabase logs
4. Report back for debugging help

**Estimated fix time**: 30min - 2 hours

---

## 📝 Notes

Use this space for any observations, questions, or notes:

---

---

---

---

---

**Testing completed on**: ********\_\_\_******** (date/time)

**Tested by**: ************\_\_\_************

**Browser used**: ************\_\_\_************

**Overall result**: ⬜ Pass ⬜ Fail

---

## 🚀 Ready to Move Forward?

Once all tests pass, you're ready to build the remaining features!

**Total estimated time to completion**: 8-12 hours

**Features remaining**:

- Server/Group Management (4-6 hours)
- Channel Messaging (2-3 hours)
- Theme System (1-2 hours)
- Voice UI (1 hour)

**You're almost there!** 🎉
