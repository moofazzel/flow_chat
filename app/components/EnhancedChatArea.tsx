import { copyToClipboard } from "@/utils/clipboard";
import {
  AlertCircle,
  AtSign,
  Bell,
  Bold,
  Calendar,
  Check,
  CheckCheck,
  ClipboardList,
  Code,
  Edit2,
  Eye,
  FileText,
  Gift,
  Hash,
  Hash as HashTag,
  HelpCircle,
  Image as ImageIcon,
  Inbox,
  Italic,
  LinkIcon,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Phone,
  Pin,
  Reply,
  Search,
  Send,
  Smile,
  Sticker,
  Strikethrough,
  Users,
  Video,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Task } from "../page";
import { CreateTaskModal } from "./CreateTaskModal";
import { TeamMembersPanel } from "./TeamMembersPanel";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";

interface NewTaskData {
  title: string;
  description: string;
  status: "backlog" | "todo" | "in-progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  assignee?: string;
  labels: string[];
  sourceMessageId?: string;
}

interface ChatAreaProps {
  channelId: string;
  onTaskClick: (task: Task) => void;
  onCreateTask?: (taskData: NewTaskData) => Task;
  onSendMessage: (content: string, taskId?: string) => void;
  tasks: Task[];
  messages: Message[];
}

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

interface Thread {
  id: string;
  messageId: string;
  count: number;
  lastReply: string;
  participants: string[];
}

interface Attachment {
  id: string;
  name: string;
  size: string;
  type: "image" | "file" | "video";
  url?: string;
}

interface Message {
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
  reactions?: Reaction[];
  thread?: Thread;
  attachments?: Attachment[];
  isPinned?: boolean;
  isEdited?: boolean;
  mentions?: string[];
  links?: string[];
}

// Mock users for @mentions
const availableUsers = [
  { id: "u1", name: "Sarah Chen", avatar: "SC", status: "online" },
  { id: "u2", name: "Mike Johnson", avatar: "MJ", status: "idle" },
  { id: "u3", name: "Alex Kim", avatar: "AK", status: "dnd" },
  { id: "u4", name: "John Doe", avatar: "JD", status: "online" },
];

const quickEmojis = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🚀", "👀"];

const mockMessages: Message[] = [
  {
    id: "1",
    author: "Sarah Chen",
    avatar: "SC",
    timestamp: "10:30 AM",
    content:
      "Hey team! Just created a new task for the authentication bug we discussed yesterday. @Mike Johnson can you take a look?",
    isCurrentUser: false,
    mentions: ["Mike Johnson"],
    isPinned: true,
    reactions: [
      { emoji: "👍", count: 3, users: ["You", "Mike", "Alex"] },
      { emoji: "❤️", count: 2, users: ["Mike", "Alex"] },
    ],
    thread: {
      id: "t1",
      messageId: "1",
      count: 5,
      lastReply: "2 hours ago",
      participants: ["SC", "MJ", "AK"],
    },
    task: {
      id: "PROJ-123",
      title: "Fix authentication redirect issue",
      description: "Users are being redirected to the wrong page after login",
      status: "todo",
      boardId: "board-1",
      priority: "high",
      reporter: "Sarah Chen",
      labels: ["bug", "auth"],
      createdAt: "2025-11-21",
      comments: [],
    },
  },
  {
    id: "2",
    author: "You",
    avatar: "YO",
    timestamp: "10:35 AM",
    content: "I'll take a look at this. Should be a quick fix.",
    isCurrentUser: true,
    reactions: [{ emoji: "💪", count: 1, users: ["Sarah"] }],
    replyTo: {
      id: "1",
      author: "Sarah Chen",
      content:
        "Hey team! Just created a new task for the authentication bug we discussed yesterday.",
    },
  },
];

const availableTasks: Task[] = [
  {
    id: "PROJ-123",
    title: "Fix authentication redirect issue",
    description: "Users are being redirected to the wrong page after login",
    status: "in-progress",
    boardId: "board-1",
    priority: "high",
    assignee: "Mike Johnson",
    reporter: "Sarah Chen",
    labels: ["bug", "auth"],
    createdAt: "2025-11-21",
    comments: [],
  },
  {
    id: "PROJ-124",
    title: "Dashboard redesign mockups",
    description: "Create new mockups for the analytics dashboard",
    status: "review",
    boardId: "board-1",
    priority: "medium",
    assignee: "Alex Kim",
    reporter: "Alex Kim",
    labels: ["design", "frontend"],
    createdAt: "2025-11-21",
    comments: [],
  },
  {
    id: "PROJ-125",
    title: "Implement dark mode toggle",
    description: "Add a toggle switch for dark/light mode in settings",
    status: "todo",
    boardId: "board-1",
    priority: "medium",
    reporter: "Sarah Chen",
    labels: ["feature", "frontend"],
    createdAt: "2025-11-20",
    comments: [],
  },
];

// Slash commands for project management
const slashCommands = [
  {
    command: "/task",
    description: "Create a new task",
    icon: <CheckCheck size={14} />,
  },
  {
    command: "/assign",
    description: "Assign task to user",
    icon: <AtSign size={14} />,
  },
  {
    command: "/status",
    description: "Update task status",
    icon: <AlertCircle size={14} />,
  },
  {
    command: "/priority",
    description: "Set task priority",
    icon: <Zap size={14} />,
  },
  {
    command: "/due",
    description: "Set due date",
    icon: <Calendar size={14} />,
  },
  {
    command: "/label",
    description: "Add labels to task",
    icon: <HashTag size={14} />,
  },
  {
    command: "/comment",
    description: "Add comment to task",
    icon: <MessageSquare size={14} />,
  },
  {
    command: "/giphy",
    description: "Search for a GIF",
    icon: <Gift size={14} />,
  },
];

export function EnhancedChatArea({
  channelId,
  onTaskClick,
  onCreateTask,
  onSendMessage,
  tasks,
  messages: messagesFromProps,
}: ChatAreaProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>(messagesFromProps);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [showTaskMentions, setShowTaskMentions] = useState(false);
  const [showUserMentions, setShowUserMentions] = useState(false);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [commandSearchQuery, setCommandSearchQuery] = useState("");
  const [showMoreMenu, setShowMoreMenu] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const [showFormatting, setShowFormatting] = useState(false);
  const [channelMuted, setChannelMuted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showTeamMembers, setShowTeamMembers] = useState(false);
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [taskPrefilledData, setTaskPrefilledData] = useState<{
    title?: string;
    description?: string;
    priority?: "low" | "medium" | "high" | "urgent";
    assignee?: string;
    sourceMessage?: {
      id: string;
      author: string;
      content: string;
      timestamp: string;
    };
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    message: Message;
  } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Removed scrollAreaRef as ScrollArea doesn't accept refs

  // Sync messages from props to local state
  useEffect(() => {
    setMessages(messagesFromProps);
  }, [messagesFromProps]);

  // Handle typing indicator
  useEffect(() => {
    if (message.length > 0) {
      // Simulate other users typing
      const timeout = setTimeout(() => {
        if (Math.random() > 0.7) {
          setIsTyping(["Sarah Chen"]);
          setTimeout(() => setIsTyping([]), 3000);
        }
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [message]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    const lastWord = value.split(/\s/).pop() || "";

    // Check for slash commands
    if (value.startsWith("/")) {
      setShowSlashCommands(true);
      setCommandSearchQuery(value.substring(1).toLowerCase());
      setShowTaskMentions(false);
      setShowUserMentions(false);
    }
    // Check for task mentions with #
    else if (lastWord.startsWith("#") && lastWord.length > 1) {
      setShowTaskMentions(true);
      setTaskSearchQuery(lastWord.substring(1).toLowerCase());
      setShowUserMentions(false);
      setShowSlashCommands(false);
    }
    // Check for user mentions with @
    else if (lastWord.startsWith("@") && lastWord.length > 1) {
      setShowUserMentions(true);
      setUserSearchQuery(lastWord.substring(1).toLowerCase());
      setShowTaskMentions(false);
      setShowSlashCommands(false);
    } else {
      setShowTaskMentions(false);
      setShowUserMentions(false);
      setShowSlashCommands(false);
    }
  };

  const handleTaskMention = (task: Task) => {
    const words = message.split(/\s/);
    words.pop();
    words.push(`#${task.id}`);
    setMessage(words.join(" ") + " ");
    setShowTaskMentions(false);
    inputRef.current?.focus();
  };

  const handleUserMention = (user: (typeof availableUsers)[0]) => {
    const words = message.split(/\s/);
    words.pop();
    words.push(`@${user.name}`);
    setMessage(words.join(" ") + " ");
    setShowUserMentions(false);
    inputRef.current?.focus();
  };

  const handleSlashCommand = (command: string) => {
    setMessage(command + " ");
    setShowSlashCommands(false);
    inputRef.current?.focus();
  };

  const filteredTasks = showTaskMentions
    ? tasks.filter(
        (task) =>
          task.id.toLowerCase().includes(taskSearchQuery) ||
          task.title.toLowerCase().includes(taskSearchQuery)
      )
    : [];

  const filteredUsers = showUserMentions
    ? availableUsers.filter((user) =>
        user.name.toLowerCase().includes(userSearchQuery)
      )
    : [];

  const filteredCommands = showSlashCommands
    ? slashCommands.filter(
        (cmd) =>
          cmd.command.toLowerCase().includes(commandSearchQuery) ||
          cmd.description.toLowerCase().includes(commandSearchQuery)
      )
    : [];

  const handleReply = (msg: Message) => {
    setReplyingTo(msg);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg.id === messageId) {
          const reactions = msg.reactions || [];
          const existingReaction = reactions.find((r) => r.emoji === emoji);

          if (existingReaction) {
            if (existingReaction.users.includes("You")) {
              return {
                ...msg,
                reactions: reactions
                  .map((r) =>
                    r.emoji === emoji
                      ? {
                          ...r,
                          count: r.count - 1,
                          users: r.users.filter((u) => u !== "You"),
                        }
                      : r
                  )
                  .filter((r) => r.count > 0),
              };
            } else {
              return {
                ...msg,
                reactions: reactions.map((r) =>
                  r.emoji === emoji
                    ? {
                        ...r,
                        count: r.count + 1,
                        users: [...r.users, "You"],
                      }
                    : r
                ),
              };
            }
          } else {
            return {
              ...msg,
              reactions: [...reactions, { emoji, count: 1, users: ["You"] }],
            };
          }
        }
        return msg;
      })
    );
  };

  const handleStartEdit = (msg: Message) => {
    if (msg.isCurrentUser) {
      setEditingMessage(msg.id);
      setMessage(msg.content);
      inputRef.current?.focus();
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setMessage("");
  };

  const handleSaveEdit = (messageId: string) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId
          ? { ...msg, content: message, isEdited: true }
          : msg
      )
    );
    setEditingMessage(null);
    setMessage("");
  };

  const handleDeleteMessage = (messageId: string) => {
    if (confirm("Are you sure you want to delete this message?")) {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== messageId)
      );
      setShowMoreMenu(null);
    }
  };

  const handlePinMessage = (msg: Message) => {
    setMessages((prevMessages) =>
      prevMessages.map((m) =>
        m.id === msg.id ? { ...m, isPinned: !m.isPinned } : m
      )
    );
    setShowMoreMenu(null);
  };

  const handleCopyMessage = (msg: Message) => {
    copyToClipboard(msg.content);
    alert("Message copied!");
  };

  const handleCreateThread = (msg: Message) => {
    alert(`Thread created for message: "${msg.content.substring(0, 30)}..."`);
    setShowMoreMenu(null);
  };

  const handleMarkUnread = (msg: Message) => {
    setUnreadCount((prev) => prev + 1);
    setShowMoreMenu(null);
  };

  const handleCreateTaskFromMessage = (msg: Message) => {
    // Detect priority from keywords
    const content = msg.content.toLowerCase();
    let detectedPriority: "low" | "medium" | "high" | "urgent" = "medium";

    if (
      content.includes("urgent") ||
      content.includes("asap") ||
      content.includes("critical")
    ) {
      detectedPriority = "urgent";
    } else if (
      content.includes("important") ||
      content.includes("high priority")
    ) {
      detectedPriority = "high";
    } else if (
      content.includes("low priority") ||
      content.includes("when you can")
    ) {
      detectedPriority = "low";
    }

    // Extract title from message (first sentence or first 50 chars)
    const firstSentence = msg.content.split(/[.!?]/)[0];
    const title =
      firstSentence.length > 50
        ? firstSentence.substring(0, 50) + "..."
        : firstSentence;

    // Extract mentioned users for auto-assignment
    const mentionedUser =
      msg.mentions && msg.mentions.length > 0 ? msg.mentions[0] : undefined;

    setTaskPrefilledData({
      title: title,
      description: msg.content,
      priority: detectedPriority,
      assignee: mentionedUser,
      sourceMessage: {
        id: msg.id,
        author: msg.author,
        content: msg.content,
        timestamp: msg.timestamp,
      },
    });

    setCreateTaskModalOpen(true);
    setShowMoreMenu(null);
  };

  const applyFormatting = (format: "bold" | "italic" | "strike" | "code") => {
    const textarea = inputRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = message.substring(start, end);

    let formattedText = "";
    switch (format) {
      case "bold":
        formattedText = `**${selectedText}**`;
        break;
      case "italic":
        formattedText = `*${selectedText}*`;
        break;
      case "strike":
        formattedText = `~~${selectedText}~~`;
        break;
      case "code":
        formattedText = `\`${selectedText}\``;
        break;
    }

    const newMessage =
      message.substring(0, start) + formattedText + message.substring(end);
    setMessage(newMessage);
    textarea.focus();
  };

  const pinnedMessages = messages.filter((msg) => msg.isPinned);

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Channel header */}
      <div className="h-10 px-3 flex items-center gap-3 border-b border-[#1e1f22] shadow-sm bg-[#313338]">
        <div className="flex items-center gap-2">
          <Hash size={18} className="text-gray-400" />
          <span className="text-white text-sm">{channelId}</span>
        </div>
        <div className="h-5 w-px bg-[#3f4147]" />
        <span className="text-gray-400 text-xs">
          Team collaboration and task updates
        </span>
        <div className="ml-auto flex items-center gap-1">
          {/* Thread button */}
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-200 p-1.5 h-auto"
            title="Threads"
          >
            <MessageSquare size={16} />
          </Button>

          {/* Notification toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-200 p-1.5 h-auto"
            onClick={() => setChannelMuted(!channelMuted)}
            title={channelMuted ? "Unmute Channel" : "Mute Channel"}
          >
            {channelMuted ? <VolumeX size={16} /> : <Bell size={16} />}
          </Button>

          {/* Pinned messages */}
          <Button
            variant="ghost"
            size="sm"
            className={`text-gray-400 hover:text-gray-200 p-1.5 h-auto relative ${
              pinnedMessages.length > 0 ? "text-yellow-500" : ""
            }`}
            onClick={() => setShowPinnedMessages(!showPinnedMessages)}
            title="Pinned Messages"
          >
            <Pin size={16} />
            {pinnedMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {pinnedMessages.length}
              </span>
            )}
          </Button>

          {/* Members */}
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-200 p-1.5 h-auto"
            onClick={() => setShowTeamMembers(true)}
            title="Team Members"
          >
            <Users size={16} />
          </Button>

          {/* Search */}
          <div className="relative">
            <Input
              placeholder="Search"
              className="w-28 h-7 bg-[#1e1f22] border-none text-xs pr-7"
            />
            <Search
              size={14}
              className="absolute right-2 top-1.5 text-gray-400 pointer-events-none"
            />
          </div>

          {/* Video call */}
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-200 p-1.5 h-auto"
          >
            <Video size={16} />
          </Button>

          {/* Voice call */}
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-200 p-1.5 h-auto"
          >
            <Phone size={16} />
          </Button>

          {/* Inbox */}
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-200 p-1.5 h-auto relative"
          >
            <Inbox size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>

          {/* Help */}
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-200 p-1.5 h-auto"
          >
            <HelpCircle size={16} />
          </Button>
        </div>
      </div>

      {/* Pinned messages panel */}
      {showPinnedMessages && pinnedMessages.length > 0 && (
        <div className="bg-[#2b2d31] border-b border-[#1e1f22] p-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Pin size={14} className="text-yellow-500" />
              <span className="text-white text-xs">Pinned Messages</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPinnedMessages(false)}
              className="p-1 h-auto"
            >
              <X size={14} className="text-gray-400" />
            </Button>
          </div>
          <ScrollArea className="max-h-32">
            {pinnedMessages.map((msg) => (
              <div
                key={msg.id}
                className="p-2 bg-[#35363c] rounded mb-1 text-xs"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px]">
                      {msg.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white">{msg.author}</span>
                  <span className="text-gray-400">{msg.timestamp}</span>
                </div>
                <div className="text-gray-300">{msg.content}</div>
              </div>
            ))}
          </ScrollArea>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-2">
          {messages.map((msg, index) => {
            const prevMsg = messages[index - 1];
            const isGrouped =
              prevMsg && prevMsg.author === msg.author && !msg.replyTo;

            return (
              <div
                key={msg.id}
                className={`flex gap-2 hover:bg-[#2e3035] -mx-3 px-3 ${
                  isGrouped ? "py-0" : "py-0.5"
                } group rounded ${
                  msg.isCurrentUser ? "flex-row-reverse" : ""
                } ${showMoreMenu === msg.id ? "relative z-50" : "relative"}`}
              >
                {/* Hover action buttons */}
                <div
                  className={`absolute -top-3 ${
                    msg.isCurrentUser ? "left-3" : "right-3"
                  } opacity-0 group-hover:opacity-100 transition-opacity bg-[#1e1f22] rounded-md border border-[#3f4147] shadow-lg flex items-center gap-0.5 p-0.5 z-10`}
                >
                  {/* Quick reactions */}
                  {quickEmojis.slice(0, 4).map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white hover:bg-[#35363c] p-1 h-auto"
                      onClick={() => handleAddReaction(msg.id, emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                  <div className="w-px h-4 bg-[#3f4147] mx-0.5" />

                  {/* Action buttons */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white hover:bg-[#35363c] p-1 h-auto"
                    onClick={() => handleReply(msg)}
                    title="Reply"
                  >
                    <Reply size={16} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white hover:bg-[#35363c] p-1 h-auto"
                    onClick={() => handleCreateThread(msg)}
                    title="Create Thread"
                  >
                    <MessageSquare size={16} />
                  </Button>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white hover:bg-[#35363c] p-1 h-auto"
                        title="Add Reaction"
                      >
                        <Smile size={16} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2 bg-[#1e1f22] border-[#3f4147]">
                      <div className="grid grid-cols-8 gap-1">
                        {quickEmojis.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              handleAddReaction(msg.id, emoji);
                            }}
                            className="text-lg hover:bg-[#35363c] p-1 rounded"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white hover:bg-[#35363c] p-1 h-auto"
                      onClick={() =>
                        setShowMoreMenu(showMoreMenu === msg.id ? null : msg.id)
                      }
                      title="More"
                    >
                      <MoreHorizontal size={16} />
                    </Button>

                    {showMoreMenu === msg.id && (
                      <>
                        {/* Backdrop to close menu when clicking outside */}
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setShowMoreMenu(null)}
                        />

                        {/* Dropdown menu */}
                        <div className="absolute top-full mt-1 right-0 bg-[#1e1f22] border border-[#3f4147] rounded-lg shadow-xl min-w-[180px] overflow-hidden z-40">
                          <button
                            onClick={() => handleMarkUnread(msg)}
                            className="w-full px-3 py-1.5 text-left text-gray-300 hover:bg-[#35363c] hover:text-white flex items-center gap-2 text-xs"
                          >
                            <Eye size={14} />
                            Mark as Unread
                          </button>
                          <button
                            onClick={() => handlePinMessage(msg)}
                            className="w-full px-3 py-1.5 text-left text-gray-300 hover:bg-[#35363c] hover:text-white flex items-center gap-2 text-xs"
                          >
                            <Pin size={14} />
                            {msg.isPinned ? "Unpin" : "Pin"} Message
                          </button>
                          <button
                            onClick={() => handleCopyMessage(msg)}
                            className="w-full px-3 py-1.5 text-left text-gray-300 hover:bg-[#35363c] hover:text-white flex items-center gap-2 text-xs"
                          >
                            <LinkIcon size={14} />
                            Copy Message Link
                          </button>
                          <button
                            onClick={() => handleCopyMessage(msg)}
                            className="w-full px-3 py-1.5 text-left text-gray-300 hover:bg-[#35363c] hover:text-white flex items-center gap-2 text-xs"
                          >
                            <FileText size={14} />
                            Copy Text
                          </button>
                          <Separator className="bg-[#3f4147]" />
                          <button
                            onClick={() => handleCreateTaskFromMessage(msg)}
                            className="w-full px-3 py-1.5 text-left text-green-400 hover:bg-green-900/20 hover:text-green-300 flex items-center gap-2 text-xs"
                          >
                            <ClipboardList size={14} />
                            Create Task from Message
                          </button>
                          {msg.isCurrentUser && (
                            <>
                              <Separator className="bg-[#3f4147]" />
                              <button
                                onClick={() => handleStartEdit(msg)}
                                className="w-full px-3 py-1.5 text-left text-gray-300 hover:bg-[#35363c] hover:text-white flex items-center gap-2 text-xs"
                              >
                                <Edit2 size={14} />
                                Edit Message
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="w-full px-3 py-1.5 text-left text-red-400 hover:bg-red-900/20 hover:text-red-300 flex items-center gap-2 text-xs"
                              >
                                <X size={14} />
                                Delete Message
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Avatar - only show if not grouped or if has reply */}
                {!isGrouped || msg.replyTo ? (
                  <Avatar className="h-8 w-8 mt-0.5 flex-shrink-0">
                    <AvatarFallback
                      className={msg.isCurrentUser ? "bg-[#5865f2]" : ""}
                    >
                      {msg.avatar}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-8 flex-shrink-0 flex items-center justify-center">
                    <span className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {msg.timestamp.split(" ")[0]}
                    </span>
                  </div>
                )}

                <div
                  className={`flex-1 min-w-0 ${
                    msg.isCurrentUser ? "flex flex-col items-end" : ""
                  }`}
                >
                  {/* Author and timestamp - only show if not grouped */}
                  {(!isGrouped || msg.replyTo) && (
                    <div
                      className={`flex items-baseline gap-2 ${
                        msg.isCurrentUser ? "flex-row-reverse" : ""
                      }`}
                    >
                      <span
                        className={`text-sm ${
                          msg.isCurrentUser ? "text-[#5865f2]" : "text-white"
                        }`}
                      >
                        {msg.author}
                      </span>
                      <span className="text-gray-400 text-[11px]">
                        {msg.timestamp}
                      </span>
                      {msg.isPinned && (
                        <Pin size={10} className="text-yellow-500" />
                      )}
                    </div>
                  )}

                  {/* Reply indicator */}
                  {msg.replyTo && (
                    <div
                      className={`mt-0.5 mb-0.5 p-1.5 bg-[#2b2d31] rounded border-l-2 border-gray-500 cursor-pointer hover:border-gray-400 transition-colors ${
                        msg.isCurrentUser ? "ml-auto max-w-md" : "max-w-md"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Reply size={10} className="text-gray-400" />
                        <span className="text-gray-400 text-[10px]">
                          {msg.replyTo.author}
                        </span>
                      </div>
                      <div className="text-gray-400 text-[11px] truncate">
                        {msg.replyTo.content}
                      </div>
                    </div>
                  )}

                  {/* Message content */}
                  <div
                    className={`text-gray-300 text-[13px] ${
                      !isGrouped || msg.replyTo ? "mt-0.5" : ""
                    } ${
                      msg.isCurrentUser
                        ? "bg-[#5865f2] px-2.5 py-1.5 rounded-lg max-w-md"
                        : ""
                    }`}
                  >
                    {msg.content}
                    {msg.isEdited && (
                      <span className="text-[10px] text-gray-400 ml-1">
                        (edited)
                      </span>
                    )}
                  </div>

                  {/* Task card */}
                  {msg.task && (
                    <button
                      onClick={() => onTaskClick(msg.task!)}
                      className={`mt-1.5 p-2 bg-[#2b2d31] rounded-md border-l-4 border-blue-500 hover:bg-[#35363c] transition-colors text-left w-full max-w-md ${
                        msg.isCurrentUser ? "ml-auto" : ""
                      }`}
                    >
                      <div className="flex items-start gap-1.5 mb-1">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {msg.task.id}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${
                            msg.task.priority === "urgent"
                              ? "border-red-500 text-red-500"
                              : msg.task.priority === "high"
                              ? "border-orange-500 text-orange-500"
                              : msg.task.priority === "medium"
                              ? "border-yellow-500 text-yellow-500"
                              : "border-gray-500 text-gray-500"
                          }`}
                        >
                          {msg.task.priority}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {msg.task.status}
                        </Badge>
                      </div>
                      <div className="text-white text-sm mb-0.5">
                        {msg.task.title}
                      </div>
                      <div className="text-gray-400 text-xs line-clamp-2">
                        {msg.task.description}
                      </div>
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {msg.task.labels.map((label) => (
                          <Badge
                            key={label}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  )}

                  {/* Thread info */}
                  {msg.thread && (
                    <button className="mt-1 flex items-center gap-1.5 text-[11px] text-[#5865f2] hover:text-[#4752c4] transition-colors">
                      <div className="flex -space-x-2">
                        {msg.thread.participants.map((avatar, i) => (
                          <Avatar
                            key={i}
                            className="h-4 w-4 border border-[#313338]"
                          >
                            <AvatarFallback className="text-[8px]">
                              {avatar}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span>{msg.thread.count} replies</span>
                      <span className="text-gray-400">
                        Last reply {msg.thread.lastReply}
                      </span>
                      <MessageSquare size={12} />
                    </button>
                  )}

                  {/* Reactions */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div
                      className={`flex gap-1 mt-1 flex-wrap ${
                        msg.isCurrentUser ? "justify-end" : ""
                      }`}
                    >
                      {msg.reactions.map((reaction, index) => (
                        <button
                          key={index}
                          onClick={() =>
                            handleAddReaction(msg.id, reaction.emoji)
                          }
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-colors ${
                            reaction.users.includes("You")
                              ? "bg-[#5865f2]/20 border-[#5865f2] hover:bg-[#5865f2]/30"
                              : "bg-[#2b2d31] border-[#3f4147] hover:bg-[#35363c]"
                          }`}
                          title={reaction.users.join(", ")}
                        >
                          <span className="text-xs">{reaction.emoji}</span>
                          <span
                            className={`text-[10px] ${
                              reaction.users.includes("You")
                                ? "text-[#5865f2]"
                                : "text-gray-400"
                            }`}
                          >
                            {reaction.count}
                          </span>
                        </button>
                      ))}
                      <button
                        className="flex items-center justify-center w-6 h-6 rounded border border-[#3f4147] hover:bg-[#35363c] transition-colors"
                        onClick={() => handleAddReaction(msg.id, "👍")}
                        title="Add reaction"
                      >
                        <Smile size={12} className="text-gray-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Typing indicator */}
        {isTyping.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400">
            <div className="flex gap-1">
              <span
                className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span>
              {isTyping.join(", ")} {isTyping.length === 1 ? "is" : "are"}{" "}
              typing...
            </span>
          </div>
        )}
      </ScrollArea>

      {/* Message input */}
      <div className="px-3 py-2 bg-[#313338] border-t border-[#1e1f22]">
        {/* Reply preview */}
        {replyingTo && (
          <div className="mb-2 p-1.5 bg-[#2b2d31] rounded-t-md border-l-2 border-[#5865f2] flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Reply size={10} className="text-gray-400" />
                <span className="text-gray-400 text-[10px]">
                  Replying to {replyingTo.author}
                </span>
              </div>
              <div className="text-gray-300 text-xs truncate">
                {replyingTo.content}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white p-1 h-auto flex-shrink-0"
              onClick={cancelReply}
            >
              <X size={14} />
            </Button>
          </div>
        )}

        {/* Editing indicator */}
        {editingMessage && (
          <div className="mb-2 p-1.5 bg-[#2b2d31] rounded-t-md border-l-2 border-yellow-500 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit2 size={12} className="text-yellow-500" />
              <span className="text-gray-300 text-xs">Editing message</span>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-green-400 hover:text-green-300 p-1 h-auto"
                onClick={() => handleSaveEdit(editingMessage)}
              >
                <Check size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white p-1 h-auto"
                onClick={handleCancelEdit}
              >
                <X size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* Slash commands suggestions */}
        {showSlashCommands && filteredCommands.length > 0 && (
          <div className="mb-2 bg-[#2b2d31] rounded-md border border-[#3f4147] max-h-48 overflow-y-auto">
            {filteredCommands.map((cmd) => (
              <button
                key={cmd.command}
                onClick={() => handleSlashCommand(cmd.command)}
                className="w-full p-2 hover:bg-[#35363c] transition-colors text-left border-b border-[#3f4147] last:border-b-0 flex items-center gap-2"
              >
                <div className="text-gray-400">{cmd.icon}</div>
                <div className="flex-1">
                  <div className="text-white text-xs">{cmd.command}</div>
                  <div className="text-gray-400 text-[10px]">
                    {cmd.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Task mention suggestions */}
        {showTaskMentions && filteredTasks.length > 0 && (
          <div className="mb-2 bg-[#2b2d31] rounded-md border border-[#3f4147] max-h-40 overflow-y-auto">
            {filteredTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => handleTaskMention(task)}
                className="w-full p-2 hover:bg-[#35363c] transition-colors text-left border-b border-[#3f4147] last:border-b-0"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {task.id}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${
                      task.priority === "urgent"
                        ? "border-red-500 text-red-500"
                        : task.priority === "high"
                        ? "border-orange-500 text-orange-500"
                        : task.priority === "medium"
                        ? "border-yellow-500 text-yellow-500"
                        : "border-gray-500 text-gray-500"
                    }`}
                  >
                    {task.priority}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {task.status}
                  </Badge>
                </div>
                <div className="text-white text-xs">{task.title}</div>
              </button>
            ))}
          </div>
        )}

        {/* User mention suggestions */}
        {showUserMentions && filteredUsers.length > 0 && (
          <div className="mb-2 bg-[#2b2d31] rounded-md border border-[#3f4147] max-h-40 overflow-y-auto">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserMention(user)}
                className="w-full p-2 hover:bg-[#35363c] transition-colors text-left border-b border-[#3f4147] last:border-b-0 flex items-center gap-2"
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {user.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-white text-xs">{user.name}</div>
                </div>
                <div
                  className={`w-2 h-2 rounded-full ${
                    user.status === "online"
                      ? "bg-green-500"
                      : user.status === "idle"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                />
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div
          className={`bg-[#383a40] ${
            replyingTo || editingMessage ? "rounded-b-md" : "rounded-md"
          } relative`}
        >
          <Textarea
            ref={inputRef}
            placeholder={`Message #${channelId} (@ user, # task, / command)`}
            value={message}
            onChange={handleMessageChange}
            className="border-none bg-transparent text-gray-200 placeholder:text-gray-500 text-sm resize-none min-h-[32px] max-h-32 py-2"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                // Extract task ID from message if mentioned
                const taskMatch = message.match(/#(PROJ-\d+|CHAT-\d+)/);
                const taskId = taskMatch ? taskMatch[1] : undefined;

                // Send message
                onSendMessage(message, taskId);
                setMessage("");
                setReplyingTo(null);
              }
            }}
          />

          {/* Input toolbar */}
          <div className="flex items-center justify-between px-2 pb-1.5 gap-2">
            <div className="flex items-center gap-1">
              {/* File attachment */}
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-200 p-1 h-auto"
              >
                <Paperclip size={16} />
              </Button>

              {/* Formatting */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-gray-200 p-1 h-auto"
                  >
                    <Bold size={16} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1 bg-[#1e1f22] border-[#3f4147]">
                  <div className="grid grid-cols-4 gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2"
                      onClick={() => applyFormatting("bold")}
                      title="Bold"
                    >
                      <Bold size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2"
                      onClick={() => applyFormatting("italic")}
                      title="Italic"
                    >
                      <Italic size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2"
                      onClick={() => applyFormatting("strike")}
                      title="Strikethrough"
                    >
                      <Strikethrough size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2"
                      onClick={() => applyFormatting("code")}
                      title="Code"
                    >
                      <Code size={14} />
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* GIF picker */}
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-200 p-1 h-auto"
              >
                <Gift size={16} />
              </Button>

              {/* Image upload */}
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-200 p-1 h-auto"
              >
                <ImageIcon size={16} />
              </Button>

              {/* Sticker */}
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-200 p-1 h-auto"
              >
                <Sticker size={16} />
              </Button>
            </div>

            {/* Right side buttons */}
            <div className="flex items-center gap-1">
              {/* Emoji picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-gray-200 p-1 h-auto"
                  >
                    <Smile size={16} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2 bg-[#1e1f22] border-[#3f4147]">
                  <div className="grid grid-cols-8 gap-1">
                    {quickEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setMessage((prev) => prev + emoji)}
                        className="text-lg hover:bg-[#35363c] p-1 rounded"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Send button */}
              <Button
                variant="ghost"
                size="sm"
                className="text-[#5865f2] hover:text-[#4752c4] p-1 h-auto"
                disabled={!message.trim()}
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick tips */}
        <div className="mt-1 text-[10px] text-gray-500 flex items-center gap-2">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>•</span>
          <span>@ mention users</span>
          <span>•</span>
          <span># link tasks</span>
          <span>•</span>
          <span>/ commands</span>
        </div>
      </div>

      {/* Team Members Panel */}
      {/* Team Members Panel */}
      <TeamMembersPanel
        isOpen={showTeamMembers}
        onClose={() => setShowTeamMembers(false)}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={createTaskModalOpen}
        onClose={() => {
          setCreateTaskModalOpen(false);
          setTaskPrefilledData(null);
        }}
        onCreateTask={(taskData) => {
          if (onCreateTask) {
            const newTask = onCreateTask(taskData);

            // Post a message about the new task
            const newMessage: Message = {
              id: `msg-${Date.now()}`,
              author: "You",
              avatar: "YO",
              timestamp: new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              content: `✅ Created task: ${taskData.title}`,
              isCurrentUser: true,
              task: newTask,
            };

            setMessages((prev) => [...prev, newMessage]);
            setCreateTaskModalOpen(false);
            setTaskPrefilledData(null);
          }
        }}
        prefilledData={taskPrefilledData || undefined}
      />
    </div>
  );
}
