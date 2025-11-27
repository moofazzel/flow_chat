# What's Next - Development Roadmap

## 🎯 Current Status

**Completed:**

- ✅ Redux Toolkit Integration (100%)
- ✅ Board Phase 1 - Core Features (100%)
- ✅ Chat-Board Integration (90%)
- ✅ Task Management (100%)
- ✅ Task Mentions (100%)
- ✅ QuickTaskCreate Component (100%)

**Total Progress:** ~90% of planned features

---

## 🚀 **IMMEDIATE PRIORITIES (Next 2-4 hours)**

### **1. Debug Board Creation (30 min)**

**Priority:** HIGH - User reported issue
**Status:** Investigating

**Tasks:**

- [ ] Test Plus button in browser
- [ ] Check browser console for errors
- [ ] Verify Supabase connection
- [ ] Test board creation flow
- [ ] Fix any issues found

**Expected Outcome:** Board creation working perfectly

---

### **2. Implement Slash Commands (1 hour)**

**Priority:** HIGH - Completes chat integration
**Status:** Implementation guide ready

**Tasks:**

- [ ] Find message input component
- [ ] Add slash command parser
- [ ] Integrate with QuickTaskCreate
- [ ] Add command suggestions UI
- [ ] Test `/task`, `/bug`, `/story` commands

**Files to Modify:**

- Message input component (likely in `page.tsx` or separate component)
- `EnhancedChatArea.tsx` (if input is there)

**Expected Outcome:** Users can create tasks with `/task Fix bug`

**Guide:** See `.agent/SLASH_COMMANDS_GUIDE.md`

---

### **3. Complete Activity Feed (30 min)**

**Priority:** MEDIUM - Enhances team awareness
**Status:** 80% complete

**Tasks:**

- [ ] Add status change notifications
- [ ] Add assignment notifications
- [ ] Add completion notifications
- [ ] Test all notification types

**Files to Modify:**

- `EnhancedChatArea.tsx` or task update handlers
- `taskSlice.ts` (add action listeners)

**Expected Outcome:** Full activity feed working

---

### **4. Testing & Bug Fixes (1 hour)**

**Priority:** HIGH - Ensure quality
**Status:** Ongoing

**Tasks:**

- [ ] Test all board features
- [ ] Test all chat features
- [ ] Test task creation flows
- [ ] Test drag & drop
- [ ] Fix any bugs found
- [ ] Verify mobile responsiveness

**Expected Outcome:** All features working smoothly

---

## 📋 **SHORT TERM (This Week - 8-12 hours)**

### **Phase 2: Enhanced Task Features**

#### **1. Issue Type Icons on Cards (2 hours)**

**Priority:** HIGH - Visual clarity
**Status:** Data structure ready

**Tasks:**

- [ ] Add issue type icons to TaskCard component
- [ ] Add issue type selector to TaskDetailsModal
- [ ] Add issue type filter to board
- [ ] Update QuickTaskCreate to set issue type
- [ ] Test all issue types

**Files to Modify:**

- `TaskCard.tsx`
- `TaskDetailsModal.tsx`
- `TaskBoard.tsx`

**Expected Outcome:** Cards show 📖 Story, ✓ Task, 🐛 Bug, 🎯 Epic icons

---

#### **2. Story Points Picker (1.5 hours)**

**Priority:** MEDIUM - Agile estimation
**Status:** Data structure ready

**Tasks:**

- [ ] Create story points picker component
- [ ] Add to TaskDetailsModal
- [ ] Display on task cards
- [ ] Show column totals
- [ ] Test Fibonacci sequence (1, 2, 3, 5, 8, 13, 21)

**Files to Create:**

- `StoryPointsPicker.tsx`

**Files to Modify:**

- `TaskCard.tsx`
- `TaskDetailsModal.tsx`
- `TaskBoard.tsx` (column totals)

**Expected Outcome:** Tasks have story points, columns show totals

---

#### **3. Due Date Picker (2 hours)**

**Priority:** HIGH - Deadline tracking
**Status:** Data structure ready

**Tasks:**

- [ ] Add date picker to TaskDetailsModal
- [ ] Display due date badge on cards
- [ ] Highlight overdue tasks
- [ ] Add due date filter
- [ ] Test date formatting

**Files to Modify:**

- `TaskCard.tsx`
- `TaskDetailsModal.tsx`
- Add date picker library if needed

**Expected Outcome:** Tasks have due dates, overdue tasks highlighted

---

#### **4. Checklist Editor (3 hours)**

**Priority:** MEDIUM - Sub-task management
**Status:** Not started

**Tasks:**

- [ ] Create checklist component
- [ ] Add to TaskDetailsModal
- [ ] Show progress bar on cards
- [ ] Add checklist templates
- [ ] Test add/remove/check items

**Files to Create:**

- `ChecklistEditor.tsx`

**Files to Modify:**

- `TaskCard.tsx` (progress bar)
- `TaskDetailsModal.tsx`
- `taskSlice.ts` (add checklist field)

**Expected Outcome:** Tasks have checklists with progress

---

#### **5. File Attachments (3 hours)**

**Priority:** MEDIUM - Document sharing
**Status:** Not started

**Tasks:**

- [ ] Add file upload component
- [ ] Integrate with Supabase Storage
- [ ] Show attachments in task modal
- [ ] Add image preview
- [ ] Add download functionality
- [ ] Test file types

**Files to Create:**

- `FileUpload.tsx`
- `AttachmentList.tsx`

**Files to Modify:**

- `TaskDetailsModal.tsx`
- `taskSlice.ts` (add attachments field)

**Expected Outcome:** Tasks can have file attachments

---

## 🎨 **MEDIUM TERM (Next Week - 12-15 hours)**

### **Phase 3: Advanced Board Features**

#### **1. Swimlanes (4 hours)**

**Priority:** MEDIUM - Better organization
**Status:** Not started

**Tasks:**

- [ ] Add swimlane grouping options
- [ ] Group by assignee
- [ ] Group by priority
- [ ] Group by epic
- [ ] Add swimlane toggle
- [ ] Test all grouping modes

**Files to Modify:**

- `TaskBoard.tsx`
- Add swimlane configuration

**Expected Outcome:** Board can group tasks by assignee/priority/epic

---

#### **2. Quick Filters (3 hours)**

**Priority:** MEDIUM - Better visibility
**Status:** Not started

**Tasks:**

- [ ] Add filter toolbar
- [ ] Filter by issue type
- [ ] Filter by assignee
- [ ] Filter by label
- [ ] Filter by priority
- [ ] Save filter presets
- [ ] Test all filters

**Files to Create:**

- `BoardFilters.tsx`

**Files to Modify:**

- `TaskBoard.tsx`

**Expected Outcome:** Users can filter tasks quickly

---

#### **3. WIP Limits (2 hours)**

**Priority:** LOW - Workflow control
**Status:** Not started

**Tasks:**

- [ ] Add WIP limit setting per column
- [ ] Show visual warning when limit reached
- [ ] Block drag when limit exceeded
- [ ] Add WIP limit configuration
- [ ] Test limits

**Files to Modify:**

- `TaskBoard.tsx`
- `BoardSettingsMenu.tsx`

**Expected Outcome:** Columns have WIP limits

---

#### **4. Card Aging (2 hours)**

**Priority:** LOW - Visual feedback
**Status:** Not started

**Tasks:**

- [ ] Calculate card age
- [ ] Add fading effect for old cards
- [ ] Make aging configurable
- [ ] Test aging thresholds

**Files to Modify:**

- `TaskCard.tsx`
- `BoardSettingsMenu.tsx`

**Expected Outcome:** Old cards fade visually

---

#### **5. Board Search (2 hours)**

**Priority:** MEDIUM - Find tasks quickly
**Status:** Not started

**Tasks:**

- [ ] Add search bar to board
- [ ] Search across all cards
- [ ] Highlight matches
- [ ] Filter results
- [ ] Test search

**Files to Create:**

- `BoardSearch.tsx`

**Files to Modify:**

- `TaskBoard.tsx`

**Expected Outcome:** Users can search tasks on board

---

## 🔮 **LONG TERM (Future - 20+ hours)**

### **Phase 4: Advanced Features**

#### **1. Subtasks (4 hours)**

- [ ] Add subtask creation
- [ ] Show subtask progress
- [ ] Nest subtasks in parent
- [ ] Test subtask workflows

#### **2. Epic Linking (3 hours)**

- [ ] Create epic management
- [ ] Link tasks to epics
- [ ] Show epic progress
- [ ] Filter by epic

#### **3. Time Tracking (4 hours)**

- [ ] Add time estimate field
- [ ] Add time logging
- [ ] Show time spent
- [ ] Time tracking reports

#### **4. Analytics Dashboard (8 hours)**

- [ ] Velocity charts
- [ ] Burndown charts
- [ ] Task distribution
- [ ] Team performance
- [ ] Export reports

#### **5. Advanced Integrations (8+ hours)**

- [ ] GitHub integration
- [ ] Slack notifications
- [ ] Email notifications
- [ ] Webhook support
- [ ] API endpoints

---

## 📊 **RECOMMENDED PRIORITY ORDER**

### **Week 1 (This Week)**

1. ✅ Debug board creation (30 min)
2. ✅ Implement slash commands (1 hour)
3. ✅ Complete activity feed (30 min)
4. ✅ Testing & bug fixes (1 hour)
5. ⏳ Issue type icons (2 hours)
6. ⏳ Due date picker (2 hours)
7. ⏳ Story points (1.5 hours)

**Total:** ~8.5 hours

### **Week 2 (Next Week)**

1. ⏳ Checklist editor (3 hours)
2. ⏳ File attachments (3 hours)
3. ⏳ Swimlanes (4 hours)
4. ⏳ Quick filters (3 hours)

**Total:** ~13 hours

### **Week 3 (Future)**

1. ⏳ WIP limits (2 hours)
2. ⏳ Card aging (2 hours)
3. ⏳ Board search (2 hours)
4. ⏳ Subtasks (4 hours)
5. ⏳ Epic linking (3 hours)

**Total:** ~13 hours

---

## 🎯 **IMMEDIATE NEXT STEPS (Right Now)**

### **Option A: Fix Board Creation First**

**If board creation is broken:**

1. Test the Plus button
2. Check browser console
3. Debug and fix
4. Verify working

**Time:** 30 minutes

### **Option B: Implement Slash Commands**

**If board creation works:**

1. Find message input component
2. Add slash command parser
3. Integrate with QuickTaskCreate
4. Test commands

**Time:** 1 hour

### **Option C: Add Issue Type Icons**

**Visual enhancement:**

1. Add icons to TaskCard
2. Add selector to modal
3. Test all types

**Time:** 2 hours

---

## 💡 **RECOMMENDATIONS**

### **For Maximum Impact:**

1. **Fix board creation** (if broken)
2. **Implement slash commands** (completes chat integration)
3. **Add issue type icons** (visual clarity)
4. **Add due dates** (deadline tracking)
5. **Add checklists** (sub-task management)

### **For Quick Wins:**

1. **Complete activity feed** (30 min)
2. **Add story points** (1.5 hours)
3. **Add issue type icons** (2 hours)

### **For User Value:**

1. **Slash commands** (faster task creation)
2. **Due dates** (deadline awareness)
3. **Checklists** (better task breakdown)
4. **File attachments** (document sharing)

---

## 📝 **SUMMARY**

**Current Status:**

- ✅ 90% of core features complete
- ✅ Chat-board integration working
- ✅ All Phase 1 features done

**Immediate Next:**

1. Debug board creation (if needed)
2. Implement slash commands
3. Complete activity feed
4. Test everything

**This Week:**

- Issue type icons
- Due dates
- Story points
- Testing

**Next Week:**

- Checklists
- Attachments
- Swimlanes
- Filters

**Future:**

- Advanced features
- Analytics
- Integrations

---

## 🚀 **READY TO START?**

**Choose your path:**

**Path 1: Complete Chat Integration**
→ Slash commands (1 hour)
→ Activity feed (30 min)
→ Testing (1 hour)

**Path 2: Enhance Board Features**
→ Issue type icons (2 hours)
→ Due dates (2 hours)
→ Story points (1.5 hours)

**Path 3: Fix & Polish**
→ Debug board creation (30 min)
→ Bug fixes (1 hour)
→ UX improvements (1 hour)

**What would you like to tackle first?**

---

**Last Updated:** 2025-11-27 09:38 AM  
**Status:** Ready for next phase  
**Estimated Time to 100%:** ~35 hours total
