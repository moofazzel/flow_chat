"use client";

import { useBoard } from "@/hooks/useBoard";
import { useServerInvites } from "@/hooks/useServerInvites";
import { createCard } from "@/lib/cardService";
import { getServerChannels } from "@/lib/serverService";
import { sendTaskActivity } from "@/lib/taskActivityService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/slices/authSlice";
import {
  setCurrentServerId,
  setSelectedChannelId,
} from "@/store/slices/serverSlice";
import {
  setCurrentView,
  setFloatingChatOpen,
  setSidebarCollapsed,
  ViewType,
} from "@/store/slices/uiSlice";
import { getCurrentUser } from "@/utils/auth";
import type { BoardData } from "@/utils/storage";
import { storage } from "@/utils/storage";
import { createClient } from "@/utils/supabase/client";
import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AuthPage } from "./components/AuthPage";
import {
  BoardsContainer,
  type BoardOperations,
} from "./components/BoardsContainer";
import { DirectMessageCenter } from "./components/DirectMessageCenter";
import { EnhancedChatArea, NewTaskData } from "./components/EnhancedChatArea";
import { FloatingChat } from "./components/FloatingChat";
import { KeyboardShortcuts } from "./components/KeyboardShortcuts";
import type { Label } from "./components/LabelBadge";
import { LabelManager } from "./components/LabelManager";
import { ServerInviteNotification } from "./components/ServerInviteNotification";
import { Sidebar } from "./components/Sidebar";
import { TaskDetailsModal } from "./components/TaskDetailsModal";
import { Toaster } from "./components/ui/toaster";
import { VoiceChannelView } from "./components/VoiceChannelView";

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
  statusName?: string; // NEW: Human readable status name (list title)
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
  issueType?: "story" | "task" | "bug" | "epic" | "subtask";
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
  file_url?: string; // For compatibility
  filename?: string; // For compatibility
  file_size?: number; // For compatibility
  file_type?: string; // For compatibility
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

const loadInitialBoards = () => {
  if (!isBrowser) return [];
  try {
    return storage.boards.load() || [];
  } catch {
    return [];
  }
};

const loadInitialMessages = () =>
  readJSON<ChatMessage[]>(STORAGE_KEYS.messages, []);

export default function Home() {
  const dispatch = useAppDispatch();
  const { user, isLoading: authLoading } = useAppSelector(
    (state) => state.auth
  );
  const { currentView, sidebarCollapsed, floatingChatOpen } = useAppSelector(
    (state) => state.ui
  );
  const { currentServerId, selectedChannelId } = useAppSelector(
    (state) => state.server
  );
  const authChecked = !authLoading;

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [currentChannel, setCurrentChannel] = useState<{
    id: string;
    name: string;
    type: "text" | "voice";
  } | null>(null);

  const [, setSelectedDM] = useState<{
    userId: string;
    userName: string;
    userAvatar: string;
    userStatus: "online" | "idle" | "dnd" | "offline";
  } | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const currentUser = await getCurrentUser();
      dispatch(setUser(currentUser));
    };
    initAuth();
  }, [dispatch]);

  const handleAuthSuccess = async () => {
    const authedUser = await getCurrentUser();
    dispatch(setUser(authedUser));
    if (!authedUser) {
      toast.error("Unable to load session after login. Please try again.");
    }
  };

  // Enable real-time server invitation notifications
  const {
    newInvites,
    inviteCount,
    isConnected: invitesConnected,
    clearInvites,
    removeInvite,
  } = useServerInvites(user?.id || null);

  // Get board-related operations for Supabase integration (comments, subtasks, etc.)
  // Note: Card updates go through boardOperations from BoardsContainer to ensure UI sync
  const {
    // Boards data (for deriving tasks with database IDs)
    boards: supabaseBoards,
    // Comments
    // Subtasks
    // Attachments
    uploadCardAttachment,
    deleteCardAttachment,
    // Members
    getBoardMembers,
    addBoardMember,
    // Labels
    getBoardLabels,
    // User
    getCurrentUser: getBoardCurrentUser,
    // Search/Server Members
    searchUsers,
    getServerMembers,
  } = useBoard(undefined, currentServerId);

  // Board operations from BoardsContainer (for card updates to sync with board UI)
  const [boardOperations, setBoardOperations] =
    useState<BoardOperations | null>(null);

  // State for Supabase board data
  const [currentBoardMembers, setCurrentBoardMembers] = useState<
    Awaited<ReturnType<typeof getBoardMembers>>
  >([]);
  const [currentBoardLabels, setCurrentBoardLabels] = useState<
    Awaited<ReturnType<typeof getBoardLabels>>
  >([]);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
    avatar_url: string | null;
  } | null>(null);

  // Fetch current user for Supabase operations
  useEffect(() => {
    if (user) {
      getBoardCurrentUser().then((u) => setCurrentUser(u));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch board members and labels when selectedTask changes
  useEffect(() => {
    const fetchBoardData = async () => {
      if (selectedTask?.boardId) {
        const [members, labels] = await Promise.all([
          getBoardMembers(selectedTask.boardId),
          getBoardLabels(selectedTask.boardId),
        ]);
        setCurrentBoardMembers(members);
        setCurrentBoardLabels(labels);
      }
    };
    fetchBoardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTask?.boardId]);

  // Derive tasks from Supabase boards (memoized for performance)
  const tasks = useMemo(() => {
    return supabaseBoards.flatMap((board) => {
      console.log("🚀 ~ board:", board);
      return (board.lists || []).flatMap((list) =>
        (list.cards || []).map((card) => ({
          id: card.id, // Database UUID
          title: card.title,
          description: card.description || "",
          status: list.id,
          statusName: list.title, // Add status name
          boardId: board.id,
          priority: card.priority || "medium",
          assignee: card.assignees?.[0],
          assignees: card.assignees || [],
          reporter: "",
          labels: card.labels || [],
          dueDate: card.due_date || undefined,
          createdAt: new Date().toISOString(),
          comments: [],
        }))
      );
    });
  }, [supabaseBoards]);

  console.log("🚀 ~ Supabase tasks:", tasks);

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

  // First-time user setup (using ref to prevent re-renders)
  const setupCompleteRef = useRef(false);
  const initialDataCreated = useRef(false);

  useEffect(() => {
    if (!user || setupCompleteRef.current) return;

    const hasCompletedSetup = localStorage.getItem("Flow Chat_initialSetup");

    if (!hasCompletedSetup) {
      console.log("First-time user detected - setting up workspace...");

      // Mark as complete immediately to prevent re-runs
      setupCompleteRef.current = true;
      localStorage.setItem("Flow Chat_initialSetup", "true");

      // 1. Set default view to board (boards work without channels)
      dispatch(setCurrentView("board"));

      // 2. Create default server and channel for chat features
      const defaultServerId = "server-my-workspace";
      const defaultChannelId = "channel-general";

      dispatch(setCurrentServerId(defaultServerId));
      dispatch(setSelectedChannelId(defaultChannelId));

      // 3. Create welcome board if no boards exist
      if (boards.length === 0 && !initialDataCreated.current) {
        initialDataCreated.current = true;

        const welcomeBoard: BoardData = {
          id: "board-welcome",
          name: "My First Board",
          description: "Welcome to Flow Chat! Start organizing your work here.",
          color: "bg-blue-500",
          columns: [
            { id: "todo", title: "To Do", color: "bg-gray-300" },
            { id: "in-progress", title: "In Progress", color: "bg-yellow-300" },
            { id: "done", title: "Done", color: "bg-green-300" },
          ],
          labels: [
            { id: "welcome", name: "Welcome", color: "bg-blue-500" },
            { id: "tutorial", name: "Tutorial", color: "bg-purple-500" },
          ],
        };

        // Use queueMicrotask to defer state updates
        queueMicrotask(() => {
          setBoards([welcomeBoard]);
          console.log("Created welcome board");
        });

        // Sample tasks removed - using Supabase boards only
        console.log("Sample boards created - tasks will come from Supabase");

        // 5. Show welcome message
        setTimeout(() => {
          toast.success("Welcome to Flow Chat! 🎉", {
            description:
              "Your workspace is ready. Explore the sample board and tasks to get started!",
            duration: 6000,
          });
        }, 1000);

        console.log("First-time setup complete");
      }
    }
  }, [user, dispatch, boards.length]);

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
    localStorage.setItem(STORAGE_KEYS.selectedChannel, selectedChannelId);
  }, [selectedChannelId, user]);

  // Fetch current channel data to determine type
  useEffect(() => {
    let cancelled = false;

    if (!currentServerId || !selectedChannelId) {
      // Defer clearing the current channel to avoid synchronous setState inside the effect
      queueMicrotask(() => {
        if (!cancelled) setCurrentChannel(null);
      });
      return;
    }

    const fetchChannelData = async () => {
      try {
        const channels = await getServerChannels(currentServerId);
        if (cancelled) return;
        const channel = channels.find((c) => c.id === selectedChannelId);
        if (channel) {
          setCurrentChannel({
            id: channel.id,
            name: channel.name,
            type: channel.type as "text" | "voice",
          });
        } else {
          // Ensure cleared if channel isn't found (deferred)
          queueMicrotask(() => {
            if (!cancelled) setCurrentChannel(null);
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch channels", error);
          queueMicrotask(() => {
            if (!cancelled) setCurrentChannel(null);
          });
        }
      }
    };

    fetchChannelData();

    return () => {
      cancelled = true;
    };
  }, [currentServerId, selectedChannelId]);

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    if (!user) return;
    localStorage.setItem(
      STORAGE_KEYS.sidebarCollapsed,
      String(sidebarCollapsed)
    );
  }, [sidebarCollapsed, user]);

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
      channelId: selectedChannelId,
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
    dispatch(setCurrentView("dm"));
  };

  const handleCreateTask = async (taskData: NewTaskData) => {
    // Find the first board or use a default
    const targetBoard = supabaseBoards[0];
    if (!targetBoard) {
      toast.error("No board available. Please create a board first.");
      return;
    }

    // Find the appropriate list based on status
    const targetList =
      targetBoard.lists?.find(
        (list) => list.title.toLowerCase() === taskData.status.toLowerCase()
      ) || targetBoard.lists?.[0];

    if (!targetList) {
      toast.error("No list available in the board.");
      return;
    }

    try {
      // Create card in Supabase using createCard
      const result = await createCard(targetList.id, {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        assignees: taskData.assignee ? [taskData.assignee] : [],
        sourceMessageId: taskData.sourceMessageId,
      });

      if (result.success && result.card) {
        // Map priority from CardData to Task priority format
        const priority =
          result.card.priority === "lowest"
            ? "low"
            : result.card.priority === "highest"
            ? "urgent"
            : (result.card.priority as "low" | "medium" | "high" | "urgent");

        // Convert to Task format for return
        const newTask: Task = {
          id: result.card.id,
          title: result.card.title,
          description: result.card.description || "",
          status: targetList.id,
          boardId: targetBoard.id,
          priority,
          assignee: result.card.assignees?.[0],
          assignees: result.card.assignees || [],
          reporter: "You",
          labels: result.card.labels?.map((l) => l.id) || [],
          createdAt: new Date().toISOString(),
          comments: [],
          sourceMessageId: taskData.sourceMessageId,
        };

        toast.success("Task created!", {
          description: `${taskData.title}`,
          duration: 3000,
        });

        console.log("Task created:", newTask);
        return newTask;
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    }
  };

  // Handle task status updates (for drag & drop)
  const handleTaskStatusChange = async (
    taskId: string,
    newStatus: Task["status"],
    oldStatus: Task["status"]
  ) => {
    // Task updates are handled by Supabase via boardOperations
    // This function mainly handles notifications

    // Find the task to get details for the notification
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      // Get column names for activity
      const board = boards.find((b) => b.id === task.boardId);
      const oldColumnName =
        board?.columns?.find((c) => c.id === oldStatus)?.title || oldStatus;
      const newColumnName =
        board?.columns?.find((c) => c.id === newStatus)?.title || newStatus;

      // Generate smart notification message
      let emoji = "";
      let message = "";

      if (
        newStatus === "done" ||
        newColumnName.toLowerCase().includes("done")
      ) {
        emoji = "🎉";
        message = `${task.assignee || "Someone"} completed #${taskId}`;

        // Send task completed activity to channel
        if (selectedChannelId && currentUser) {
          await sendTaskActivity("task_completed", {
            taskId,
            taskTitle: task.title,
            actorName: currentUser.username,
            actorId: currentUser.id,
            channelId: selectedChannelId,
            boardName: board?.name,
          });
        }
      } else if (newStatus === "in-progress" && oldStatus === "todo") {
        emoji = "🚀";
        message = `${task.assignee || "Someone"} started working on #${taskId}`;

        // Send status change activity
        if (selectedChannelId && currentUser) {
          await sendTaskActivity("task_status_changed", {
            taskId,
            taskTitle: task.title,
            actorName: currentUser.username,
            actorId: currentUser.id,
            channelId: selectedChannelId,
            boardName: board?.name,
            oldValue: oldColumnName,
            newValue: newColumnName,
          });
        }
      } else if (newStatus === "review") {
        emoji = "👀";
        message = `#${taskId} moved to Review`;

        // Send status change activity
        if (selectedChannelId && currentUser) {
          await sendTaskActivity("task_status_changed", {
            taskId,
            taskTitle: task.title,
            actorName: currentUser.username,
            actorId: currentUser.id,
            channelId: selectedChannelId,
            boardName: board?.name,
            oldValue: oldColumnName,
            newValue: newColumnName,
          });
        }
      } else {
        emoji = "📋";
        message = `#${taskId} moved from ${oldColumnName} to ${newColumnName}`;

        // Send status change activity
        if (selectedChannelId && currentUser) {
          await sendTaskActivity("task_status_changed", {
            taskId,
            taskTitle: task.title,
            actorName: currentUser.username,
            actorId: currentUser.id,
            channelId: selectedChannelId,
            boardName: board?.name,
            oldValue: oldColumnName,
            newValue: newColumnName,
          });
        }
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
    // Task updates are handled by Supabase via boardOperations
    // This function mainly handles notifications

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
  const handleAddTask = async (taskData: {
    title: string;
    description: string;
    columnId: string;
    boardId: string;
    priority?: "low" | "medium" | "high" | "urgent";
    assignee?: string;
    labels?: string[];
  }) => {
    try {
      // Create card in Supabase
      const result = await createCard(taskData.columnId, {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority || "medium",
        assignees: taskData.assignee ? [taskData.assignee] : [],
      });

      if (result.success && result.card) {
        // Map priority from CardData to Task priority format
        const priority =
          result.card.priority === "lowest"
            ? "low"
            : result.card.priority === "highest"
            ? "urgent"
            : (result.card.priority as "low" | "medium" | "high" | "urgent");

        const newTask: Task = {
          id: result.card.id,
          title: result.card.title,
          description: result.card.description || "",
          status: taskData.columnId,
          boardId: taskData.boardId,
          priority,
          assignee: result.card.assignees?.[0],
          assignees: result.card.assignees || [],
          reporter: "You",
          labels: result.card.labels?.map((l) => l.id) || [],
          createdAt: new Date().toISOString(),
          comments: [],
        };

        toast.success(`Task created: ${taskData.title}`, {
          duration: 3000,
        });

        return newTask;
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    }
  };

  // Handle bulk task updates (for column deletion, etc.)
  // Note: With Supabase, tasks are automatically synced via useBoard hook
  const handleTasksUpdate = (updatedTasks: Task[]) => {
    // Tasks are now read-only from Supabase
    // Any updates should go through boardOperations or card service
    console.log("Task updates handled by Supabase", updatedTasks.length);
  };

  // Handle individual task updates from modal
  const handleUpdateTask = (updatedTask: Task) => {
    // Tasks are automatically synced from Supabase via useBoard hook
    // Just update the selectedTask to reflect changes in the modal
    setSelectedTask((prev) =>
      prev?.id === updatedTask.id ? updatedTask : prev
    );
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    if (boardOperations?.deleteCard) {
      await boardOperations.deleteCard(taskId);
    }
    setSelectedTask(null); // Close modal if deleted task was selected
  };

  // Handle task duplication
  const handleDuplicateTask = async (task: Task) => {
    try {
      // Create a duplicate card in Supabase
      const result = await createCard(task.status, {
        title: `${task.title} (Copy)`,
        description: task.description,
        priority: task.priority,
        assignees: task.assignees || [],
      });

      if (result.success) {
        toast.success("Task duplicated successfully");
      } else {
        throw new Error(result.error || "Failed to duplicate task");
      }
    } catch (error) {
      console.error("Error duplicating task:", error);
      toast.error("Failed to duplicate task");
    }
  };

  // Handle task archiving
  const handleArchiveTask = async (taskId: string) => {
    // Use deleteCard from boardOperations or card service
    if (boardOperations?.deleteCard) {
      await boardOperations.deleteCard(taskId);
      toast.success("Task archived");
    } else {
      toast.error("Unable to archive task");
    }
  };

  // Handle channel selection - opens floating chat if in board view
  const handleChannelSelect = useCallback(
    async (channelId: string) => {
      dispatch(setSelectedChannelId(channelId));

      // Fetch channel name from database
      let channelName = channelId; // Default to ID
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("channels")
          .select("name")
          .eq("id", channelId)
          .single();

        if (data?.name) {
          channelName = data.name;
        }
      } catch (error) {
        console.error("Error fetching channel name:", error);
      }

      // If we're in board view, open the floating chat
      if (currentView === "board") {
        dispatch(setFloatingChatOpen(true));
        toast.success(`Opened #${channelName} in floating chat`, {
          duration: 2000,
        });
      } else {
        // If we're not in board view, switch to chat view
        dispatch(setCurrentView("chat"));
      }
    },
    [dispatch, currentView]
  );

  // Memoized callback for view changes
  const handleViewChange = useCallback(
    (view: ViewType) => {
      dispatch(setCurrentView(view));
    },
    [dispatch]
  );

  // Memoized callback for server changes
  const handleServerChange = useCallback(
    (serverId: string | null) => {
      dispatch(setCurrentServerId(serverId));
    },
    [dispatch]
  );

  // Memoized callback for sidebar toggle
  const handleToggleSidebar = useCallback(() => {
    dispatch(setSidebarCollapsed(!sidebarCollapsed));
  }, [dispatch, sidebarCollapsed]);

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
        onViewChange={handleViewChange}
        selectedChannel={selectedChannelId}
        onChannelSelect={handleChannelSelect}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        onSelectDM={handleSelectDM}
        onServerChange={handleServerChange}
      />

      <div className="flex-1 flex overflow-hidden">
        {currentView === "chat" ? (
          currentChannel?.type === "voice" ? (
            <VoiceChannelView
              channelName={currentChannel.name}
              participants={[]}
            />
          ) : (
            <EnhancedChatArea
              channelId={selectedChannelId}
              onTaskClick={setSelectedTask}
              onCreateTask={handleCreateTask}
              onSendMessage={handleSendMessage}
              tasks={tasks}
            />
          )
        ) : currentView === "dm" ? (
          <DirectMessageCenter />
        ) : (
          <BoardsContainer
            currentServerId={currentServerId}
            tasks={tasks}
            onTaskClick={setSelectedTask}
            onToggleChat={() =>
              dispatch(setFloatingChatOpen(!floatingChatOpen))
            }
            isChatOpen={floatingChatOpen}
            onTaskStatusChange={handleTaskStatusChange}
            onTaskAssignment={handleTaskAssignment}
            onAddTask={handleAddTask}
            onTasksUpdate={handleTasksUpdate}
            onDeleteTask={handleDeleteTask}
            onDuplicateTask={handleDuplicateTask}
            onArchiveTask={handleArchiveTask}
            onBoardOperationsReady={setBoardOperations}
          />
        )}
      </div>

      <AnimatePresence mode="wait">
        {currentView === "board" && floatingChatOpen && (
          <FloatingChat
            channelId={selectedChannelId}
            onTaskClick={setSelectedTask}
            onClose={() => dispatch(setFloatingChatOpen(false))}
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
          // Activity tracking props
          channelId={selectedChannelId}
          boardName={boards.find((b) => b.id === selectedTask.boardId)?.name}
          boardLabels={
            currentBoardLabels.length > 0
              ? currentBoardLabels.map((l) => ({
                  id: l.id,
                  name: l.name,
                  color: l.color,
                  textColor: l.text_color,
                  boardId: l.board_id,
                }))
              : boards.find((b) => b.id === selectedTask.boardId)?.labels || []
          }
          onManageLabels={() => setShowLabelManagerForTask(true)}
          // Supabase integration props
          boardMembers={currentBoardMembers}
          currentUser={currentUser}
          onUploadAttachment={uploadCardAttachment}
          onDeleteAttachment={deleteCardAttachment}
          // Server/workspace member props
          serverId={currentServerId}
          onSearchUsers={searchUsers}
          onGetServerMembers={getServerMembers}
          onAddBoardMember={addBoardMember}
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
              // Tasks are automatically synced from Supabase
              // Label removal will be reflected when cards are re-fetched
              toast.success(`Label deleted`);
            }
          }}
          open={showLabelManagerForTask}
          onOpenChange={setShowLabelManagerForTask}
        />
      )}

      {/* Server Invite Notifications */}
      <div className="fixed top-2.5 right-4 z-50">
        <ServerInviteNotification
          invites={newInvites}
          inviteCount={inviteCount}
          isConnected={invitesConnected}
          onClearInvite={removeInvite}
          onClearAll={clearInvites}
        />
      </div>

      <KeyboardShortcuts />
      <Toaster />
    </div>
  );
}
