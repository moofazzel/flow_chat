/**
 * 🗄️ STORAGE UTILITY
 * 
 * Smart localStorage management with database-ready architecture.
 * 
 * ARCHITECTURE:
 * ✅ localStorage (Current):
 *    - Tasks (full persistence)
 *    - Boards/Columns (full persistence)
 *    - User preferences
 *    - Session state
 *    - Draft messages
 *    - Recent messages (cache only - last 50 per channel)
 * 
  columns: BoardColumn[];
  labels?: Label[]; // 🆕 Labels for this board
}

export interface Message {
  id: string;
  content: string;
  author: string;
  timestamp: string;
  avatar: string;
  reactions?: Reaction[];
  mentions?: string[];
  taskMentions?: string[];
  isOwn?: boolean;
  replyTo?: {
    id: string;
    author: string;
    content: string;
  };
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  sidebarCollapsed: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
}

export interface SessionState {
  currentView: 'chat' | 'board' | 'dm';
  selectedChannel: string;
  activeBoard: string;
  pageScrollLeft: number;
  boardScrollPositions: Record<string, number>;
  selectedDM: {
    userId: string;
    userName: string;
    userAvatar: string;
    userStatus: 'online' | 'idle' | 'dnd' | 'offline';
  } | null;
}

// ============================================
// 🔑 STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  // ✅ Full persistence (localStorage)
  TASKS: 'Flow Chat_tasks',
  BOARDS: 'Flow Chat_boards',
  PREFERENCES: 'Flow Chat_preferences',
  SESSION: 'Flow Chat_session',
  DRAFT_MESSAGES: 'Flow Chat_drafts',
  
  // ⚠️ Cache only (localStorage) - Will migrate to database
  MESSAGES_PREFIX: 'Flow Chat_messages_', // + channelId
  
  // 📊 Version control
  STORAGE_VERSION: 'Flow Chat_storage_version',
} as const;

const CURRENT_STORAGE_VERSION = '1.0.0';
const MAX_MESSAGES_PER_CHANNEL = 50; // Cache limit

// ============================================
// 🛠️ UTILITY FUNCTIONS
// ============================================

/**
 * Safe JSON parse with error handling
 */
function safeParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error("❌ Failed to parse JSON:", error);
    return fallback;
  }
}

/**
 * Safe localStorage setItem with error handling
 */
function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`❌ Failed to save to localStorage (${key}):`, error);
    // Check if quota exceeded
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn(
        "⚠️ localStorage quota exceeded! Consider clearing old data."
      );
    }
    return false;
  }
}

/**
 * Initialize storage version
 */
export function initializeStorage(): void {
  const version = localStorage.getItem(STORAGE_KEYS.STORAGE_VERSION);

  if (version !== CURRENT_STORAGE_VERSION) {
    console.log(
      `🔄 Storage version mismatch. Current: ${version}, Expected: ${CURRENT_STORAGE_VERSION}`
    );
    // TODO: Add migration logic here if schema changes
    localStorage.setItem(STORAGE_KEYS.STORAGE_VERSION, CURRENT_STORAGE_VERSION);
  }
}

// ============================================
// 📋 TASK STORAGE (Full Persistence)
// ============================================

/**
 * ✅ FULL PERSISTENCE - Save all tasks
 */
export function saveTasks(tasks: Task[]): boolean {
  console.log(`💾 Saving ${tasks.length} tasks to localStorage...`);
  return safeSetItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
}

/**
 * ✅ FULL PERSISTENCE - Load all tasks
 */
export function loadTasks(): Task[] | null {
  const json = localStorage.getItem(STORAGE_KEYS.TASKS);
  if (!json) return null;

  const tasks = safeParse<Task[]>(json, []);
  console.log(`📂 Loaded ${tasks.length} tasks from localStorage`);
  return tasks;
}

/**
 * Save a single task (updates existing or adds new)
 */
export function saveTask(task: Task): boolean {
  const tasks = loadTasks() || [];
  const index = tasks.findIndex((t) => t.id === task.id);

  if (index >= 0) {
    tasks[index] = task;
  } else {
    tasks.push(task);
  }

  return saveTasks(tasks);
}

/**
 * Delete a task by ID
 */
export function deleteTask(taskId: string): boolean {
  const tasks = loadTasks() || [];
  const filtered = tasks.filter((t) => t.id !== taskId);
  return saveTasks(filtered);
}

// ============================================
// 🎯 BOARD STORAGE (Full Persistence)
// ============================================

/**
 * ✅ FULL PERSISTENCE - Save all boards
 */
export function saveBoards(boards: BoardData[]): boolean {
  console.log(`💾 Saving ${boards.length} boards to localStorage...`);
  return safeSetItem(STORAGE_KEYS.BOARDS, JSON.stringify(boards));
}

/**
 * ✅ FULL PERSISTENCE - Load all boards
 */
export function loadBoards(): BoardData[] | null {
  const json = localStorage.getItem(STORAGE_KEYS.BOARDS);
  if (!json) return null;

  const boards = safeParse<BoardData[]>(json, []);
  console.log(`📂 Loaded ${boards.length} boards from localStorage`);
  return boards;
}

// ============================================
// 💬 CHAT STORAGE (Limited Cache - Database-Ready)
// ============================================

/**
 * ⚠️ CACHE ONLY - Save recent messages (last 50)
 *
 * 🚀 TODO: Replace with database API when ready:
 *    - await supabase.from('messages').insert(message)
 *    - WebSocket for real-time updates
 *    - Infinite scroll pagination
 */
export function saveMessages(channelId: string, messages: Message[]): boolean {
  // Only cache the most recent messages
  const recentMessages = messages.slice(-MAX_MESSAGES_PER_CHANNEL);

  console.log(
    `💾 Caching ${recentMessages.length} recent messages for channel: ${channelId}`,
    `(${messages.length - recentMessages.length} older messages not cached)`
  );

  const key = STORAGE_KEYS.MESSAGES_PREFIX + channelId;
  return safeSetItem(key, JSON.stringify(recentMessages));
}

/**
 * ⚠️ CACHE ONLY - Load recent messages
 *
 * 🚀 TODO: Replace with database API when ready:
 *    - const { data } = await supabase.from('messages').select()
 *    - Load with pagination
 */
export function loadMessages(channelId: string): Message[] | null {
  const key = STORAGE_KEYS.MESSAGES_PREFIX + channelId;
  const json = localStorage.getItem(key);

  if (!json) {
    console.log(`📂 No cached messages for channel: ${channelId}`);
    return null;
  }

  const messages = safeParse<Message[]>(json, []);
  console.log(
    `📂 Loaded ${messages.length} cached messages for channel: ${channelId}`
  );
  console.log(
    `⚠️ Note: Only recent ${MAX_MESSAGES_PER_CHANNEL} messages are cached`
  );

  return messages;
}

/**
 * Clear all message cache (useful for testing)
 */
export function clearMessageCache(): void {
  const keys = Object.keys(localStorage);
  const messageKeys = keys.filter((key) =>
    key.startsWith(STORAGE_KEYS.MESSAGES_PREFIX)
  );

  messageKeys.forEach((key) => localStorage.removeItem(key));
  console.log(`🗑️ Cleared ${messageKeys.length} message caches`);
}

// ============================================
// 💭 DRAFT MESSAGES (Full Persistence)
// ============================================

export interface DraftMessages {
  [channelId: string]: string;
}

/**
 * Save draft message for a channel
 */
export function saveDraft(channelId: string, content: string): boolean {
  const drafts = loadDrafts();
  drafts[channelId] = content;

  return safeSetItem(STORAGE_KEYS.DRAFT_MESSAGES, JSON.stringify(drafts));
}

/**
 * Load all draft messages
 */
export function loadDrafts(): DraftMessages {
  const json = localStorage.getItem(STORAGE_KEYS.DRAFT_MESSAGES);
  return safeParse<DraftMessages>(json, {});
}

/**
 * Clear draft for a channel
 */
export function clearDraft(channelId: string): boolean {
  const drafts = loadDrafts();
  delete drafts[channelId];
  return safeSetItem(STORAGE_KEYS.DRAFT_MESSAGES, JSON.stringify(drafts));
}

// ============================================
// ⚙️ USER PREFERENCES (Full Persistence)
// ============================================

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "dark",
  sidebarCollapsed: false,
  notificationsEnabled: true,
  soundEnabled: true,
};

/**
 * Save user preferences
 */
export function savePreferences(
  preferences: Partial<UserPreferences>
): boolean {
  const current = loadPreferences();
  const updated = { ...current, ...preferences };

  console.log("💾 Saving user preferences:", updated);
  return safeSetItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
}

/**
 * Load user preferences
 */
export function loadPreferences(): UserPreferences {
  const json = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
  return safeParse<UserPreferences>(json, DEFAULT_PREFERENCES);
}

// ============================================
// 🎮 SESSION STATE (Full Persistence)
// ============================================

const DEFAULT_SESSION: SessionState = {
  currentView: "chat",
  selectedChannel: "general",
  activeBoard: "board-1",
  pageScrollLeft: 0,
  boardScrollPositions: {},
  selectedDM: null,
};

/**
 * Save session state
 */
export function saveSession(session: Partial<SessionState>): boolean {
  const current = loadSession();
  const updated = { ...current, ...session };

  return safeSetItem(STORAGE_KEYS.SESSION, JSON.stringify(updated));
}

/**
 * Load session state
 */
export function loadSession(): SessionState {
  const json = localStorage.getItem(STORAGE_KEYS.SESSION);
  return safeParse<SessionState>(json, DEFAULT_SESSION);
}

/**
 * Check if user has saved session (for welcome back message)
 */
export function hasStoredSession(): boolean {
  return localStorage.getItem(STORAGE_KEYS.SESSION) !== null;
}

// ============================================
// 🗑️ CLEAR ALL DATA
// ============================================

/**
 * Clear all app data (useful for logout/reset)
 */
export function clearAllData(): void {
  console.log("🗑️ Clearing all app data from localStorage...");

  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });

  clearMessageCache();

  console.log("✅ All data cleared!");
}

/**
 * Get storage usage stats
 */
export function getStorageStats() {
  const tasks = loadTasks() || [];
  const boards = loadBoards() || [];
  const session = loadSession();
  const preferences = loadPreferences();

  // Calculate approximate sizes
  const tasksSize = JSON.stringify(tasks).length;
  const boardsSize = JSON.stringify(boards).length;
  const sessionSize = JSON.stringify(session).length;
  const preferencesSize = JSON.stringify(preferences).length;

  // Count message caches
  const keys = Object.keys(localStorage);
  const messageCaches = keys.filter((key) =>
    key.startsWith(STORAGE_KEYS.MESSAGES_PREFIX)
  );

  return {
    tasks: {
      count: tasks.length,
      size: `${(tasksSize / 1024).toFixed(2)} KB`,
    },
    boards: {
      count: boards.length,
      size: `${(boardsSize / 1024).toFixed(2)} KB`,
    },
    messageCaches: {
      count: messageCaches.length,
      size: "Varies by channel",
    },
    session: {
      size: `${(sessionSize / 1024).toFixed(2)} KB`,
    },
    preferences: {
      size: `${(preferencesSize / 1024).toFixed(2)} KB`,
    },
    totalSize: `~${(
      (tasksSize + boardsSize + sessionSize + preferencesSize) /
      1024
    ).toFixed(2)} KB`,
  };
}

// ============================================
// 🚀 EXPORT DEFAULT STORAGE API
// ============================================

export const storage = {
  // Initialization
  initialize: initializeStorage,

  // Tasks (Full Persistence)
  tasks: {
    save: saveTasks,
    load: loadTasks,
    saveOne: saveTask,
    delete: deleteTask,
  },

  // Boards (Full Persistence)
  boards: {
    save: saveBoards,
    load: loadBoards,
  },

  // Messages (Cache Only - Database Ready)
  messages: {
    save: saveMessages,
    load: loadMessages,
    clearCache: clearMessageCache,
  },

  // Drafts (Full Persistence)
  drafts: {
    save: saveDraft,
    load: loadDrafts,
    clear: clearDraft,
  },

  // Preferences (Full Persistence)
  preferences: {
    save: savePreferences,
    load: loadPreferences,
  },

  // Session (Full Persistence)
  session: {
    save: saveSession,
    load: loadSession,
    hasStored: hasStoredSession,
  },

  // Utilities
  clearAll: clearAllData,
  getStats: getStorageStats,
};

export default storage;
