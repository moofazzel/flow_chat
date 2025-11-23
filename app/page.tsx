"use client";

import { getCurrentUser, User } from "@/utils/auth";
import type { BoardData } from "@/utils/storage";
import { storage } from "@/utils/storage";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthPage } from "./components/AuthPage";
import { BoardsContainer } from "./components/BoardsContainer";
import { DirectMessageCenter } from "./components/DirectMessageCenter";
import { EnhancedChatArea, NewTaskData } from "./components/EnhancedChatArea";
import { FloatingChat } from "./components/FloatingChat";
import { KeyboardShortcuts } from "./components/KeyboardShortcuts";
import type { Label } from "./components/LabelBadge";
import { LabelManager } from "./components/LabelManager";
import { Sidebar } from "./components/Sidebar";
import { StorageBanner } from "./components/StorageBanner";
import { TaskDetailsModal } from "./components/TaskDetailsModal";
import { Toaster } from "./components/ui/toaster";

export type ViewType = "chat" | "board" | "dm";

export interface Channel {
  id: string;
  name: string;
  type: "text" | "voice";
  category: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string; // Changed to flexible string to support any column ID
  boardId: string; // NEW: Which board this task belongs to
  priority: "low" | "medium" | "high" | "urgent";
  assignee?: string; // Deprecated: kept for backward compatibility
  assignees?: string[]; // NEW: Multiple assignees support
  reporter: string;
  labels: string[];
  createdAt: string;
  comments: Comment[];
  dueDate?: string;
  subtasks?: SubTask[];
  attachments?: Attachment[];
  sourceMessageId?: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: "image" | "file" | "video";
  url?: string;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  avatar: string;
}

export interface ChatMessage {
  id: string;
  author: string;
  avatar: string;
  timestamp: string;
  content: string;
  task?: Task;
  replyTo?: {
    id: string;
    author: string;
    content: string;
  };
  isCurrentUser?: boolean;
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
  }[];
  thread?: {
    id: string;
    messageId: string;
    count: number;
    lastReply: string;
    participants: string[];
  };
  attachments?: Attachment[];
  isPinned?: boolean;
  isEdited?: boolean;
  mentions?: string[];
  links?: string[];
  channelId: string;
}

const STORAGE_KEYS = {
  currentView: "Flow Chat_currentView",
  selectedChannel: "Flow Chat_selectedChannel",
  sidebarCollapsed: "Flow Chat_sidebarCollapsed",
  messages: "Flow Chat_messages",
};

const isBrowser = typeof window !== "undefined";

const readJSON = <T,>(key: string, fallback: T): T => {
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const readString = (key: string, fallback: string) => {
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ?? fallback;
  } catch {
    return fallback;
  }
};

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    author: "Sarah Chen",
    avatar: "SC",
    timestamp: "10:30 AM",
    content:
      "Hey team! Just created a new task for the authentication bug we discussed yesterday. @Mike Johnson can you take a look?",
    isCurrentUser: false,
    mentions: ["Mike Johnson"],
    isPinned: true,
    reactions: [
      { emoji: "??", count: 3, users: ["You", "Mike", "Alex"] },
      { emoji: "??", count: 2, users: ["Mike", "Alex"] },
    ],
    thread: {
      id: "t1",
      messageId: "m1",
      count: 5,
      lastReply: "2 hours ago",
      participants: ["SC", "MJ", "AK"],
    },
    channelId: "general",
  },
  {
    id: "m2",
    author: "You",
    avatar: "YO",
    timestamp: "10:35 AM",
    content: "I'll take a look at this. Should be a quick fix.",
    isCurrentUser: true,
    reactions: [{ emoji: "??", count: 1, users: ["Sarah"] }],
    replyTo: {
      id: "m1",
      author: "Sarah Chen",
      content:
        "Hey team! Just created a new task for the authentication bug we discussed yesterday.",
    },
    channelId: "general",
  },
];

// This app blends Discord-style chat with Trello-like task boards.
const DEFAULT_TASKS: Task[] = [
  {
    id: "PROJ-123",
    title: "Fix authentication redirect issue",
    description: "Users are being redirected to the wrong page after login",
    status: "column-1-2", // Mapped to "In Progress"
    boardId: "board-1",
    priority: "high",
    assignee: "Mike Johnson",
    reporter: "Sarah Chen",
    labels: ["bug", "auth"],
    createdAt: "2025-11-21",
    dueDate: "2025-11-23",
    comments: [
      {
        id: "1",
        author: "Mike Johnson",
        content: "I'll take a look at this",
        timestamp: "10:35 AM",
        avatar: "MJ",
      },
    ],
    subtasks: [
      { id: "s1", title: "Identify redirect issue", completed: true },
      { id: "s2", title: "Fix redirect logic", completed: true },
      { id: "s3", title: "Write tests", completed: false },
    ],
    attachments: [
      { id: "a1", name: "screenshot.png", size: "1.2 MB", type: "image" },
    ],
  },
  {
    id: "PROJ-124",
    title: "Dashboard redesign mockups",
    description: "Create new mockups for the analytics dashboard",
    status: "column-1-3", // Mapped to "Done"
    boardId: "board-1",
    priority: "medium",
    assignee: "Alex Kim",
    reporter: "Alex Kim",
    labels: ["design", "frontend"],
    createdAt: "2025-11-21",
    dueDate: "2025-11-25",
    comments: [],
    subtasks: [
      { id: "s1", title: "Wireframes", completed: true },
      { id: "s2", title: "High-fidelity mockups", completed: true },
      { id: "s3", title: "Review with team", completed: false },
    ],
    attachments: [
      { id: "a1", name: "dashboard-v2.fig", size: "4.5 MB", type: "file" },
      { id: "a2", name: "design-system.pdf", size: "2.1 MB", type: "file" },
    ],
  },
  {
    id: "PROJ-125",
    title: "Implement dark mode toggle",
    description: "Add a toggle switch for dark/light mode in settings",
    status: "column-1-1", // Mapped to "To Do"
    boardId: "board-1",
    priority: "medium",
    reporter: "Sarah Chen",
    labels: ["feature", "frontend"],
    createdAt: "2025-11-20",
    dueDate: "2025-11-28",
    comments: [],
  },
  {
    id: "PROJ-126",
    title: "API rate limiting",
    description: "Implement rate limiting on all public API endpoints",
    status: "column-1-1", // Mapped to "To Do"
    boardId: "board-1",
    priority: "high",
    reporter: "Mike Johnson",
    labels: ["backend", "security"],
    createdAt: "2025-11-20",
    dueDate: "2025-11-22",
    comments: [],
    subtasks: [
      {
        id: "s1",
        title: "Research rate limiting libraries",
        completed: false,
      },
      { id: "s2", title: "Implement middleware", completed: false },
      { id: "s3", title: "Add monitoring", completed: false },
    ],
  },
  {
    id: "PROJ-127",
    title: "User onboarding flow",
    description: "Design and implement new user onboarding experience",
    status: "column-1-1", // Mapped to "To Do"
    boardId: "board-1",
    priority: "low",
    reporter: "Alex Kim",
    labels: ["feature", "design"],
    createdAt: "2025-11-19",
    comments: [],
  },
  {
    id: "PROJ-128",
    title: "Database query optimization",
    description: "Optimize slow queries in the analytics module",
    status: "column-1-2", // Mapped to "In Progress"
    boardId: "board-1",
    priority: "urgent",
    assignee: "Sarah Chen",
    reporter: "Mike Johnson",
    labels: ["backend", "performance"],
    createdAt: "2025-11-21",
    dueDate: "2025-11-21", // Today - overdue!
    comments: [],
    subtasks: [
      { id: "s1", title: "Profile slow queries", completed: true },
      { id: "s2", title: "Add indexes", completed: true },
      { id: "s3", title: "Test performance", completed: false },
      { id: "s4", title: "Deploy to staging", completed: false },
    ],
  },
  {
    id: "PROJ-129",
    title: "Update documentation",
    description: "Update API documentation with new endpoints",
    status: "column-1-3", // Mapped to "Done"
    boardId: "board-1",
    priority: "low",
    assignee: "Mike Johnson",
    reporter: "Sarah Chen",
    labels: ["docs"],
    createdAt: "2025-11-18",
    comments: [],
  },
];

const loadInitialView = (): ViewType =>
  (readString(STORAGE_KEYS.currentView, "chat") as ViewType) || "chat";

const loadInitialChannel = () =>
  readString(STORAGE_KEYS.selectedChannel, "general");

const loadInitialSidebar = () =>
  readString(STORAGE_KEYS.sidebarCollapsed, "false") === "true";

const loadInitialBoards = () => {
  if (!isBrowser) return [];
  try {
    return storage.boards.load() || [];
  } catch {
    return [];
  }
};

const loadInitialTasks = () => {
  if (!isBrowser) return DEFAULT_TASKS;
  try {
    const saved = storage.tasks.load();
    return saved && saved.length > 0 ? saved : DEFAULT_TASKS;
  } catch {
    return DEFAULT_TASKS;
  }
};

const loadInitialMessages = () =>
  readJSON<ChatMessage[]>(STORAGE_KEYS.messages, DEFAULT_MESSAGES);

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [currentView, setCurrentView] = useState<ViewType>(loadInitialView);
  const [selectedChannel, setSelectedChannel] =
    useState<string>(loadInitialChannel);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(loadInitialSidebar);

  const [floatingChatOpen, setFloatingChatOpen] = useState(false);
  const [, setSelectedDM] = useState<{
    userId: string;
    userName: string;
    userAvatar: string;
    userStatus: "online" | "idle" | "dnd" | "offline";
  } | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setAuthChecked(true);
    };
    initAuth();
  }, []);

  const handleAuthSuccess = async () => {
    const authedUser = await getCurrentUser();
    setUser(authedUser);
    setAuthChecked(true);
    if (!authedUser) {
      toast.error("Unable to load session after login. Please try again.");
    }
  };

  // Boards and labels state (initialize from storage to avoid setState in mount effect)
  const [boards, setBoards] = useState<BoardData[]>(loadInitialBoards);
  const [showLabelManagerForTask, setShowLabelManagerForTask] = useState(false);

  // Auto-save boards whenever they change
  useEffect(() => {
    if (!user || boards.length === 0) return;
    storage.boards.save(boards);
    console.log(`Auto-saved ${boards.length} boards`);
  }, [boards, user]);

  // Initialize storage after authentication
  useEffect(() => {
    if (!user) return;
    storage.initialize();
    const stats = storage.getStats();
    console.log("Storage Stats:", stats);
  }, [user]);

  // Show welcome back message if returning to saved state
  useEffect(() => {
    if (!user) return;
    const hasReturnedState =
      localStorage.getItem(STORAGE_KEYS.currentView) ||
      localStorage.getItem("Flow Chat_activeBoard") ||
      localStorage.getItem("Flow Chat_pageScrollLeft") ||
      localStorage.getItem("Flow Chat_boardScrollLeft") ||
      storage.session.hasStored();

    if (hasReturnedState) {
      setTimeout(() => {
        toast("Welcome Back!", {
          description: "Restored your last session",
          duration: 2500,
        });
      }, 500);
    }
  }, [user]);

  // Save view state to localStorage whenever it changes
  useEffect(() => {
    if (!user) return;
    localStorage.setItem(STORAGE_KEYS.currentView, currentView);
  }, [currentView, user]);

  // Save channel state to localStorage whenever it changes
  useEffect(() => {
    if (!user) return;
    localStorage.setItem(STORAGE_KEYS.selectedChannel, selectedChannel);
  }, [selectedChannel, user]);

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    if (!user) return;
    localStorage.setItem(
      STORAGE_KEYS.sidebarCollapsed,
      String(sidebarCollapsed)
    );
  }, [sidebarCollapsed, user]);

  const [tasks, setTasks] = useState<Task[]>(loadInitialTasks);

  // Auto-save tasks whenever they change
  useEffect(() => {
    if (!user || tasks.length === 0) return;
    storage.tasks.save(tasks);
    console.log(`Auto-saved ${tasks.length} tasks`);
  }, [tasks, user]);

  // Chat messages state
  const [messages, setMessages] = useState<ChatMessage[]>(loadInitialMessages);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (!user) return;
    localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
  }, [messages, user]);

  // Handle sending a message
  const handleSendMessage = (content: string, taskId?: string) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    // Find task if mentioned
    let taskData: Task | undefined;
    if (taskId) {
      taskData = tasks.find((t) => t.id === taskId);
    }

    // Extract mentions from content
    const mentions =
      content.match(/@[\w\s]+/g)?.map((m) => m.substring(1).trim()) || [];

    const newMessage: ChatMessage = {
      id: `m${Date.now()}`,
      author: "You",
      avatar: "YO",
      timestamp,
      content,
      task: taskData,
      isCurrentUser: true,
      channelId: selectedChannel,
      mentions,
    };

    setMessages((prev) => [...prev, newMessage]);

    // Show success toast
    toast.success("Message sent!");
  };

  const handleSelectDM = (
    dmId: string,
    userName: string,
    userAvatar: string,
    userStatus: "online" | "idle" | "dnd" | "offline"
  ) => {
    setSelectedDM({ userId: dmId, userName, userAvatar, userStatus });
    setCurrentView("dm");
  };

  const handleCreateTask = (taskData: NewTaskData) => {
    // Generate new task ID
    const newTaskId = `CHAT-${Math.floor(Math.random() * 1000)}`;

    const newTask: Task = {
      id: newTaskId,
      title: taskData.title,
      description: taskData.description,
      status: taskData.status,
      boardId: "board1", // NEW: Add boardId
      priority: taskData.priority,
      assignee: taskData.assignee,
      reporter: "You",
      labels: taskData.labels,
      createdAt: new Date().toISOString().split("T")[0],
      comments: [],
      sourceMessageId: taskData.sourceMessageId,
    };

    // Add task to global state
    setTasks((prevTasks) => [...prevTasks, newTask]);

    // Show success notification
    toast.success("Task created!", {
      description: `#${newTaskId}: ${taskData.title}`,
      duration: 3000,
    });

    console.log("Task created:", newTask);

    // Return the new task so chat can post about it
    return newTask;
  };

  // Handle task status updates (for drag & drop)
  const handleTaskStatusChange = (
    taskId: string,
    newStatus: Task["status"],
    oldStatus: Task["status"]
  ) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );

    // Find the task to get details for the notification
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      // Generate smart notification message
      let emoji = "";
      let message = "";

      if (newStatus === "done") {
        emoji = "🎉";
        message = `${task.assignee || "Someone"} completed #${taskId}`;
      } else if (newStatus === "in-progress" && oldStatus === "todo") {
        emoji = "🚀";
        message = `${task.assignee || "Someone"} started working on #${taskId}`;
      } else if (newStatus === "review") {
        emoji = "👀";
        message = `#${taskId} moved to Review`;
      } else {
        emoji = "📋";
        message = `#${taskId} moved from ${oldStatus} to ${newStatus}`;
      }

      // Show toast notification
      toast(emoji + " " + message, {
        description: task.title,
        duration: 4000,
      });
    }
  };

  // Handle task assignment updates
  const handleTaskAssignment = (
    taskId: string,
    newAssignee: string | undefined,
    oldAssignee: string | undefined
  ) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, assignee: newAssignee } : task
      )
    );

    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      return {
        taskId,
        taskTitle: task.title,
        newAssignee,
        oldAssignee,
      };
    }
  };

  // Handle adding a new task from board
  const handleAddTask = (taskData: {
    title: string;
    description: string;
    columnId: string;
    boardId: string;
    priority?: "low" | "medium" | "high" | "urgent";
    assignee?: string;
    labels?: string[];
  }) => {
    // Generate sequential task ID
    const existingTaskNumbers = tasks
      .map((t) => {
        const match = t.id.match(/^(?:PROJ|TASK|CHAT)-(\\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => n > 0);

    const nextNumber =
      existingTaskNumbers.length > 0
        ? Math.max(...existingTaskNumbers) + 1
        : 130; // Start from 130 to continue from PROJ-129

    const newTaskId = `TASK-${nextNumber}`;

    const newTask: Task = {
      id: newTaskId,
      title: taskData.title,
      description: taskData.description,
      status: taskData.columnId, // Column ID is the status
      boardId: taskData.boardId,
      priority: taskData.priority || "medium",
      assignee: taskData.assignee,
      reporter: "You",
      labels: taskData.labels || [],
      createdAt: new Date().toISOString().split("T")[0],
      comments: [],
    };

    setTasks((prevTasks) => [...prevTasks, newTask]);

    toast.success(`Task created: ${taskData.title}`, {
      description: `ID: ${newTaskId}`,
      duration: 3000,
    });

    return newTask;
  };

  // Handle bulk task updates (for column deletion, etc.)
  const handleTasksUpdate = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
  };

  // Handle individual task updates from modal
  const handleUpdateTask = (updatedTask: Task) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  };

  // Handle task deletion
  const handleDeleteTask = (taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    toast.success("Task deleted successfully");
  };

  // Handle task duplication
  const handleDuplicateTask = (task: Task) => {
    const duplicatedTask: Task = {
      ...task,
      id: `TASK-${Date.now()}`,
      title: `${task.title} (Copy)`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setTasks((prevTasks) => [...prevTasks, duplicatedTask]);
    toast.success("Task duplicated successfully");
  };

  // Handle task archiving
  const handleArchiveTask = (taskId: string) => {
    // For now, just remove the task (you can add archived state later)
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    toast.success("Task archived");
  };

  // Handle channel selection - opens floating chat if in board view
  const handleChannelSelect = (channelId: string) => {
    setSelectedChannel(channelId);

    // If we're in board view, open the floating chat
    if (currentView === "board") {
      setFloatingChatOpen(true);
      toast.success(`Opened #${channelId} in floating chat`, {
        duration: 2000,
      });
    } else {
      // If we're not in board view, switch to chat view
      setCurrentView("chat");
    }
  };

  if (!authChecked) {
    return null;
  }

  if (!user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="flex h-screen bg-[#313338]">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        selectedChannel={selectedChannel}
        onChannelSelect={handleChannelSelect}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onSelectDM={handleSelectDM}
      />

      <div className="flex-1 flex overflow-hidden">
        {currentView === "chat" ? (
          <EnhancedChatArea
            channelId={selectedChannel}
            onTaskClick={setSelectedTask}
            onCreateTask={handleCreateTask}
            onSendMessage={handleSendMessage}
            tasks={tasks}
          />
        ) : currentView === "dm" ? (
          <DirectMessageCenter />
        ) : (
          <BoardsContainer
            tasks={tasks}
            onTaskClick={setSelectedTask}
            onToggleChat={() => setFloatingChatOpen(!floatingChatOpen)}
            isChatOpen={floatingChatOpen}
            onTaskStatusChange={handleTaskStatusChange}
            onTaskAssignment={handleTaskAssignment}
            onAddTask={handleAddTask}
            onTasksUpdate={handleTasksUpdate}
            onDeleteTask={handleDeleteTask}
            onDuplicateTask={handleDuplicateTask}
            onArchiveTask={handleArchiveTask}
          />
        )}
      </div>

      <AnimatePresence mode="wait">
        {currentView === "board" && floatingChatOpen && (
          <FloatingChat
            channelId={selectedChannel}
            onTaskClick={setSelectedTask}
            onClose={() => setFloatingChatOpen(false)}
          />
        )}
      </AnimatePresence>

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onDuplicateTask={handleDuplicateTask}
          onArchiveTask={handleArchiveTask}
          boardLabels={
            boards.find((b) => b.id === selectedTask.boardId)?.labels || []
          }
          onManageLabels={() => setShowLabelManagerForTask(true)}
        />
      )}

      {/* Label Manager for Task Details */}
      {showLabelManagerForTask && selectedTask && (
        <LabelManager
          labels={
            boards.find((b) => b.id === selectedTask.boardId)?.labels || []
          }
          onAddLabel={(name, color) => {
            const taskBoard = boards.find((b) => b.id === selectedTask.boardId);
            if (taskBoard) {
              const newLabel: Label = {
                id: `label-${Date.now()}`,
                name,
                color,
                textColor: "text-white",
                boardId: taskBoard.id,
              };
              setBoards((prevBoards) =>
                prevBoards.map((b) =>
                  b.id === taskBoard.id
                    ? { ...b, labels: [...(b.labels || []), newLabel] }
                    : b
                )
              );
              toast.success(`Label "${name}" created`);
            }
          }}
          onEditLabel={(labelId, name, color) => {
            const taskBoard = boards.find((b) => b.id === selectedTask.boardId);
            if (taskBoard) {
              setBoards((prevBoards) =>
                prevBoards.map((b) =>
                  b.id === taskBoard.id
                    ? {
                        ...b,
                        labels: (b.labels || []).map((l) =>
                          l.id === labelId ? { ...l, name, color } : l
                        ),
                      }
                    : b
                )
              );
              toast.success(`Label updated`);
            }
          }}
          onDeleteLabel={(labelId) => {
            const taskBoard = boards.find((b) => b.id === selectedTask.boardId);
            if (taskBoard) {
              setBoards((prevBoards) =>
                prevBoards.map((b) =>
                  b.id === taskBoard.id
                    ? {
                        ...b,
                        labels: (b.labels || []).filter(
                          (l) => l.id !== labelId
                        ),
                      }
                    : b
                )
              );
              // Also remove the label from tasks
              setTasks((prevTasks) =>
                prevTasks.map((t) =>
                  t.boardId === taskBoard.id
                    ? { ...t, labels: t.labels.filter((l) => l !== labelId) }
                    : t
                )
              );
              toast.success(`Label deleted`);
            }
          }}
          open={showLabelManagerForTask}
          onOpenChange={setShowLabelManagerForTask}
        />
      )}

      <StorageBanner />
      <KeyboardShortcuts />
      <Toaster />
    </div>
  );
}
