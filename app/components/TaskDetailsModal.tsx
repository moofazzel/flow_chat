"use client";

import type {
  BoardMember,
  CardAttachment,
  CardComment,
} from "@/hooks/useBoard";
import {
  formatDateForDisplay,
  getPriorityDisplayName,
  sendTaskActivity,
  TaskActivityType,
} from "@/lib/taskActivityService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addCommentThunk,
  addSubtaskThunk,
  deleteCommentThunk,
  deleteSubtaskThunk,
  fetchTaskDetails,
  toggleSubtaskThunk,
  updateTaskThunk,
} from "@/store/slices/taskSlice";
import { copyToClipboard } from "@/utils/clipboard";
import {
  Archive,
  Calendar,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Edit2,
  File,
  Image as ImageIcon,
  Link as LinkIcon,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  Save,
  Tag,
  Trash2,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Task, Comment as TaskComment } from "../page";
import { Label, LabelBadge } from "./LabelBadge";
import { QuickPriorityPicker } from "./QuickPriorityPicker";
import { RichTextEditor } from "./RichTextEditor";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { Checkbox } from "./ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
  onUpdateTask?: (updatedTask: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onDuplicateTask?: (task: Task) => void;
  onArchiveTask?: (taskId: string) => void;
  boardLabels?: Label[];
  onManageLabels?: () => void;
  // Activity tracking props
  channelId?: string;
  boardName?: string;
  // New props for Supabase integration
  boardMembers?: BoardMember[];
  currentUser?: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
  // Server/workspace members for adding to board
  serverId?: string | null;
  onSearchUsers?: (
    query: string
  ) => Promise<{ id: string; username: string; avatar_url: string | null }[]>;
  onGetServerMembers?: (
    serverId: string
  ) => Promise<{ id: string; username: string; avatar_url: string | null }[]>;
  onAddBoardMember?: (
    boardId: string,
    userId: string,
    role?: "admin" | "member" | "observer"
  ) => Promise<BoardMember | null>;
  // Card operations
  onUploadAttachment?: (
    cardId: string,
    file: File
  ) => Promise<CardAttachment | null>;
  onDeleteAttachment?: (
    attachmentId: string,
    fileUrl: string
  ) => Promise<boolean>;
}

export function TaskDetailsModal({
  task,
  onClose,
  onUpdateTask,
  onDeleteTask,
  boardLabels,
  onManageLabels,
  channelId,
  boardName,
  boardMembers = [],
  currentUser,
  serverId,
  onSearchUsers,
  onGetServerMembers,
  onAddBoardMember,
  onUploadAttachment,
  onDeleteAttachment,
}: TaskDetailsModalProps) {
  const dispatch = useAppDispatch();
  const { selectedTask: taskFromStore } = useAppSelector((state) => state.task);

  // Use task from store if available (it should be populated by fetchTaskDetails)
  // Fallback to prop task for initial render or if store is empty
  const currentTask = taskFromStore?.id === task.id ? taskFromStore : task;

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(
    currentTask.description
  );
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(currentTask.title);
  const [newComment, setNewComment] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [showLabelsModal, setShowLabelsModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCompleteAnimation, setShowCompleteAnimation] = useState(false);

  // State for server members and user search
  const [serverMembers, setServerMembers] = useState<
    { id: string; username: string; avatar_url: string | null }[]
  >([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; username: string; avatar_url: string | null }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);

  // Sync local editing state when task changes
  useEffect(() => {
    setEditedTitle(currentTask.title);
    setEditedDescription(currentTask.description);
  }, [currentTask]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Load real data on mount via Redux
  useEffect(() => {
    if (task.id) {
      dispatch(fetchTaskDetails(task.id));
    }
    // Load server members if serverId is provided
    if (serverId && onGetServerMembers) {
      onGetServerMembers(serverId).then(setServerMembers);
    }
  }, [task.id, serverId, dispatch, onGetServerMembers]);

  // Search users with debounce
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (memberSearchQuery.trim() && onSearchUsers) {
        setIsSearching(true);
        const results = await onSearchUsers(memberSearchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [memberSearchQuery, onSearchUsers]);

  // Use real board members, fall back to server members, or show message
  const availableMembers =
    boardMembers.length > 0
      ? boardMembers.map((m) => ({
          id: m.user_id,
          name: m.user?.username || "Unknown",
          avatar: m.user?.username?.slice(0, 2).toUpperCase() || "??",
          avatarUrl: m.user?.avatar_url,
          color: "bg-[#5865f2]",
          isBoardMember: true,
        }))
      : serverMembers.length > 0
      ? serverMembers.map((m) => ({
          id: m.id,
          name: m.username || "Unknown",
          avatar: m.username?.slice(0, 2).toUpperCase() || "??",
          avatarUrl: m.avatar_url,
          color: "bg-[#5865f2]",
          isBoardMember: false,
        }))
      : [];

  // Helper to add user to board and then assign to card
  const handleAddMemberToBoard = async (userId: string, username: string) => {
    if (onAddBoardMember && currentTask.boardId) {
      const newMember = await onAddBoardMember(
        currentTask.boardId,
        userId,
        "member"
      );
      if (newMember) {
        // Also assign to the current card
        handleAddMember(userId, username);
      }
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Helper to send activity to channel
  const logActivity = async (
    type: TaskActivityType,
    extraData?: {
      oldValue?: string;
      newValue?: string;
      memberName?: string;
      labelName?: string;
      subtaskTitle?: string;
      attachmentName?: string;
    }
  ) => {
    if (!channelId || !currentUser) return;

    await sendTaskActivity(type, {
      taskId: currentTask.id,
      taskTitle: currentTask.title,
      actorName: currentUser.username,
      actorId: currentUser.id,
      channelId,
      boardName,
      ...extraData,
    });
  };

  const handleUpdateTask = async (updates: Partial<Task>) => {
    // Dispatch update to Redux
    dispatch(updateTaskThunk({ taskId: currentTask.id, updates }));

    // Also call prop if needed (for parent updates not yet fully on Redux)
    onUpdateTask?.({ ...currentTask, ...updates });
  };

  const handleSaveTitle = async () => {
    if (editedTitle.trim() && editedTitle.trim() !== currentTask.title) {
      const oldTitle = currentTask.title;
      await handleUpdateTask({ title: editedTitle.trim() });
      await logActivity("task_title_changed", {
        oldValue: oldTitle,
        newValue: editedTitle.trim(),
      });
      setIsEditingTitle(false);
    } else {
      setIsEditingTitle(false);
    }
  };

  const handleSaveDescription = async () => {
    const changed = editedDescription.trim() !== currentTask.description;
    await handleUpdateTask({ description: editedDescription.trim() });
    if (changed) {
      await logActivity("task_description_changed");
    }
    setIsEditingDescription(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    dispatch(
      addCommentThunk({ taskId: currentTask.id, content: newComment.trim() })
    );
    setNewComment("");
    toast.success("Comment added");
  };

  const handleDeleteComment = async (commentId: string) => {
    dispatch(deleteCommentThunk(commentId));
    toast.success("Comment deleted");
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;

    const subtaskTitle = newSubtask.trim();
    dispatch(addSubtaskThunk({ taskId: currentTask.id, title: subtaskTitle }));
    await logActivity("subtask_added", { subtaskTitle });
    setNewSubtask("");
    setIsAddingSubtask(false);
    toast.success("Subtask added");
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    const subtask = currentTask.subtasks?.find((st) => st.id === subtaskId);
    if (!subtask) return;

    const newCompleted = !subtask.completed;

    dispatch(toggleSubtaskThunk({ subtaskId, completed: newCompleted }));

    // Log activity
    await logActivity(
      newCompleted ? "subtask_completed" : "subtask_uncompleted",
      {
        subtaskTitle: subtask.title,
      }
    );
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    const subtask = currentTask.subtasks?.find((st) => st.id === subtaskId);
    dispatch(deleteSubtaskThunk(subtaskId));
    if (subtask) {
      await logActivity("subtask_deleted", { subtaskTitle: subtask.title });
    }
    toast.success("Subtask deleted");
  };

  const handleAddLabel = async (labelId: string) => {
    if (!currentTask.labels.includes(labelId)) {
      const label = boardLabels?.find((l) => l.id === labelId);
      await handleUpdateTask({ labels: [...currentTask.labels, labelId] });
      if (label) {
        await logActivity("task_label_added", { labelName: label.name });
      }
    }
    setShowLabelsModal(false);
  };

  const handleRemoveLabel = async (labelId: string) => {
    const label = boardLabels?.find((l) => l.id === labelId);
    await handleUpdateTask({
      labels: currentTask.labels.filter((l) => l !== labelId),
    });
    if (label) {
      await logActivity("task_label_removed", { labelName: label.name });
    }
  };

  const handleSetDueDate = async (date: Date | undefined) => {
    const oldDueDate = currentTask.dueDate;

    if (date) {
      const formattedDate = date.toISOString().split("T")[0];
      await handleUpdateTask({ dueDate: formattedDate });

      if (oldDueDate) {
        await logActivity("task_due_date_changed", {
          oldValue: formatDateForDisplay(oldDueDate),
          newValue: formatDateForDisplay(formattedDate),
        });
      } else {
        await logActivity("task_due_date_set", {
          newValue: formatDateForDisplay(formattedDate),
        });
      }
    } else {
      await handleUpdateTask({ dueDate: undefined });
      if (oldDueDate) {
        await logActivity("task_due_date_removed");
      }
    }
    setShowDatePicker(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      // For now, we don't have an attachment thunk that handles file upload directly
      // because it requires Supabase storage logic which is complex to move entirely to Redux
      // without extra setup.
      // We will keep using the prop if available, or just log a warning.
      // Ideally, we should move upload logic to a service and call it from a thunk.

      if (onUploadAttachment) {
        const attachment = await onUploadAttachment(currentTask.id, file);
        if (attachment) {
          // We should manually add it to the Redux store or re-fetch details
          // Since we don't have an addAttachment action in Redux yet (only thunk for fetch),
          // we can just re-fetch the task details to get the new attachment
          dispatch(fetchTaskDetails(currentTask.id));
          await logActivity("attachment_added", { attachmentName: file.name });
        }
      } else {
        toast.error("Attachment upload not configured");
      }
    }

    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (onUploadAttachment) {
        const attachment = await onUploadAttachment(currentTask.id, file);
        if (attachment) {
          dispatch(fetchTaskDetails(currentTask.id));
          await logActivity("attachment_added", { attachmentName: file.name });
        }
      } else {
        toast.error("Attachment upload not configured");
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteAttachment = async (
    attachmentId: string,
    fileUrl?: string
  ) => {
    // Find the attachment in Supabase data or use provided URL
    const attachment = currentTask.attachments?.find(
      (att) => att.id === attachmentId
    );
    const urlToDelete = attachment?.file_url || fileUrl || "";
    const attachmentName = attachment?.filename || "attachment";

    if (onDeleteAttachment && urlToDelete) {
      const success = await onDeleteAttachment(attachmentId, urlToDelete);
      if (success) {
        // Re-fetch to update list
        dispatch(fetchTaskDetails(currentTask.id));
        await logActivity("attachment_deleted", { attachmentName });
      }
    } else {
      toast.error("Attachment deletion not configured");
    }
  };

  const handleMarkComplete = async () => {
    // Update status to done
    await handleUpdateTask({ status: "column-1-3" }); // Done column

    // Log activity
    await logActivity("task_completed");

    // Show celebration animation
    setShowCompleteAnimation(true);

    // Play success sound effect (visual feedback)
    toast.success("🎉 Task completed!", {
      description: "Great job!",
      duration: 3000,
    });

    // Hide animation after 2 seconds
    setTimeout(() => {
      setShowCompleteAnimation(false);
    }, 2000);
  };

  const handleCopyTask = () => {
    const taskData = JSON.stringify({
      title: currentTask.title,
      description: currentTask.description,
      priority: currentTask.priority,
      labels: currentTask.labels,
    });
    copyToClipboard(taskData);
    toast.success("Task copied to clipboard");
    setShowActionsMenu(false);
  };

  const handleArchiveTask = () => {
    toast.success("Task archived (feature coming soon)");
    setShowActionsMenu(false);
    onClose();
  };

  const handleDeleteTask = () => {
    onDeleteTask?.(currentTask.id);
    toast.success("Task deleted");
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(
      `${window.location.origin}/task/${currentTask.id}`
    );
    if (success) {
      toast.success("Link copied to clipboard");
    } else {
      toast.error("Failed to copy link");
    }
  };

  const handleAddMember = async (memberId: string, memberName: string) => {
    if (memberId && memberName) {
      // Initialize assignees array if it doesn't exist
      const currentAssignees = currentTask.assignees || [];

      // Toggle member - add if not present, remove if already assigned
      // Note: assignees array now stores user IDs (UUIDs) not usernames
      const isAlreadyAssigned = currentAssignees.includes(memberId);

      if (isAlreadyAssigned) {
        // Remove member
        const newAssignees = currentAssignees.filter((id) => id !== memberId);
        await handleUpdateTask({
          assignees: newAssignees,
          assignee: newAssignees[0] || undefined, // Keep backward compatibility
        });
        await logActivity("task_unassigned", { memberName });
        toast.success(`Removed ${memberName}`);
      } else {
        // Add member
        const newAssignees = [...currentAssignees, memberId];
        await handleUpdateTask({
          assignees: newAssignees,
          assignee: memberId, // Keep backward compatibility - now stores ID
        });
        await logActivity("task_assigned", { memberName });
        toast.success(`Assigned to ${memberName}`);
      }
    }
  };

  // Use Supabase subtasks if available, otherwise fall back to local
  const displaySubtasks = currentTask.subtasks || [];
  const completedSubtasks =
    displaySubtasks?.filter((st) => st.completed).length || 0;
  const totalSubtasks = displaySubtasks?.length || 0;
  const subtaskProgress =
    totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  // Use Supabase attachments if available
  const displayAttachments = currentTask.attachments || [];

  const isTaskComplete = currentTask.status === "column-1-3";

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Complete Animation Overlay */}
      <AnimatePresence>
        {showCompleteAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 0.6 }}
              className="bg-emerald-500 rounded-full p-8 shadow-2xl shadow-emerald-500/30"
            >
              <Check size={80} className="text-white" strokeWidth={3} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-[#1e1f22] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-[#2b2d31]">
          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between bg-[#2b2d31] border-b border-[#1e1f22]">
            <div className="flex items-center gap-3 flex-1">
              <QuickPriorityPicker
                currentPriority={currentTask.priority}
                onPriorityChange={async (priority) => {
                  const oldPriority = currentTask.priority;
                  await handleUpdateTask({ priority });
                  if (oldPriority !== priority) {
                    await logActivity("task_priority_changed", {
                      oldValue: getPriorityDisplayName(oldPriority),
                      newValue: getPriorityDisplayName(priority),
                    });
                  }
                }}
              />
              {currentTask.dueDate && (
                <Badge
                  variant="outline"
                  className={`text-xs gap-1.5 ${
                    new Date(currentTask.dueDate) < new Date()
                      ? "border-red-500/50 text-red-400 bg-red-500/10"
                      : "border-[#404249] text-gray-400 bg-[#1e1f22]"
                  }`}
                >
                  <Clock size={12} />
                  {new Date(currentTask.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Badge>
              )}
              {isTaskComplete && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 gap-1">
                  <Check size={12} />
                  Complete
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-[#404249] rounded-lg"
              >
                <LinkIcon size={16} />
              </Button>
              <Popover open={showActionsMenu} onOpenChange={setShowActionsMenu}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-[#404249] rounded-lg"
                  >
                    <MoreHorizontal size={16} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-48 p-1.5 bg-[#2b2d31] border-[#404249]"
                  align="end"
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm h-9 text-gray-300 hover:text-white hover:bg-[#404249] rounded-lg"
                    onClick={handleCopyTask}
                  >
                    <Copy size={14} className="mr-2" />
                    Copy Task
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm h-9 text-gray-300 hover:text-white hover:bg-[#404249] rounded-lg"
                    onClick={handleArchiveTask}
                  >
                    <Archive size={14} className="mr-2" />
                    Archive
                  </Button>
                  <div className="h-px bg-[#404249] my-1" />
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm h-9 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                    onClick={() => {
                      setShowActionsMenu(false);
                      setShowDeleteConfirm(true);
                    }}
                  >
                    <Trash2 size={14} className="mr-2" />
                    Delete
                  </Button>
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-[#404249] rounded-lg"
              >
                <X size={16} />
              </Button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Main Content */}
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {/* Title */}
                <div>
                  {isEditingTitle ? (
                    <div className="flex gap-2">
                      <Input
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="text-xl font-semibold bg-[#2b2d31] border-[#404249] text-white focus-visible:ring-[#5865f2]"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveTitle();
                          if (e.key === "Escape") setIsEditingTitle(false);
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveTitle}
                        className="bg-[#5865f2] hover:bg-[#4752c4] h-10"
                      >
                        <Save size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingTitle(false)}
                        className="text-gray-400 hover:text-white hover:bg-[#404249] h-10"
                      >
                        <XCircle size={16} />
                      </Button>
                    </div>
                  ) : (
                    <h2
                      className="text-white text-xl font-semibold cursor-pointer hover:text-[#5865f2] transition-colors group flex items-center gap-2"
                      onClick={() => setIsEditingTitle(true)}
                    >
                      {currentTask.title}
                      <Edit2
                        size={14}
                        className="opacity-0 group-hover:opacity-50"
                      />
                    </h2>
                  )}
                </div>

                {/* Labels */}
                {currentTask.labels && currentTask.labels.length > 0 && (
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2 block">
                      Labels
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {currentTask.labels.map((labelId) => {
                        const label = boardLabels?.find(
                          (l) => l.id === labelId
                        );
                        return label ? (
                          <LabelBadge
                            key={labelId}
                            label={label}
                            onRemove={() => handleRemoveLabel(labelId)}
                          />
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Assigned Members */}
                {currentTask.assignees && currentTask.assignees.length > 0 && (
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2 block">
                      Assignees
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {currentTask.assignees.map((assigneeId) => {
                        // Now assignees array contains user IDs, so find by ID
                        const member = availableMembers.find(
                          (m) => m.id === assigneeId
                        );
                        // Fallback: if member not found in board members, try to display the ID or show placeholder
                        const displayName =
                          member?.name || assigneeId.slice(0, 8) + "...";
                        const displayAvatar =
                          member?.avatar || getInitials(displayName);

                        return (
                          <div
                            key={assigneeId}
                            className="flex items-center gap-2 bg-[#2b2d31] rounded-full pl-1 pr-3 py-1 group hover:bg-[#404249] transition-colors"
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarFallback
                                className={`text-xs ${
                                  member?.color || "bg-gray-500"
                                } text-white`}
                              >
                                {displayAvatar}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-200">
                              {displayName}
                            </span>
                            <button
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() =>
                                handleAddMember(assigneeId, displayName)
                              }
                            >
                              <X
                                size={12}
                                className="text-gray-500 hover:text-red-400"
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2 block">
                    Description
                  </label>
                  {isEditingDescription ? (
                    <div>
                      <RichTextEditor
                        value={editedDescription}
                        onChange={setEditedDescription}
                        placeholder="Add a more detailed description..."
                        minHeight="150px"
                      />
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={handleSaveDescription}
                          className="bg-[#5865f2] hover:bg-[#4752c4]"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditedDescription(currentTask.description);
                            setIsEditingDescription(false);
                          }}
                          className="text-gray-400 hover:text-white hover:bg-[#404249]"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="bg-[#2b2d31] rounded-lg p-4 min-h-[80px] cursor-pointer hover:bg-[#313338] transition-colors border border-transparent hover:border-[#404249]"
                      onClick={() => setIsEditingDescription(true)}
                    >
                      {currentTask.description ? (
                        <div
                          className="text-gray-300 text-sm prose prose-sm prose-invert max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: currentTask.description,
                          }}
                        />
                      ) : (
                        <p className="text-gray-500 text-sm">
                          Click to add a description...
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Subtasks */}
                {(displaySubtasks && displaySubtasks.length > 0) ||
                isAddingSubtask ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-medium uppercase tracking-wide text-gray-500 flex items-center gap-2">
                        <CheckSquare size={14} />
                        Checklist
                        <span className="text-gray-400 normal-case">
                          ({completedSubtasks}/{totalSubtasks})
                        </span>
                      </label>
                      {totalSubtasks > 0 && (
                        <span className="text-xs text-gray-500">
                          {Math.round(subtaskProgress)}%
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    {totalSubtasks > 0 && (
                      <div className="w-full bg-[#2b2d31] rounded-full h-1.5 mb-4">
                        <motion.div
                          className={`h-1.5 rounded-full ${
                            subtaskProgress === 100
                              ? "bg-emerald-500"
                              : "bg-[#5865f2]"
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${subtaskProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      {displaySubtasks?.map((subtask) => (
                        <div
                          key={subtask.id}
                          className="flex items-center gap-3 p-2 rounded-lg group hover:bg-[#2b2d31] transition-colors"
                        >
                          <Checkbox
                            checked={subtask.completed}
                            onCheckedChange={() =>
                              handleToggleSubtask(subtask.id)
                            }
                            className="border-[#404249] data-[state=checked]:bg-[#5865f2] data-[state=checked]:border-[#5865f2]"
                          />
                          <span
                            className={`flex-1 text-sm ${
                              subtask.completed
                                ? "line-through text-gray-500"
                                : "text-gray-200"
                            }`}
                          >
                            {subtask.title}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => handleDeleteSubtask(subtask.id)}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      ))}

                      {/* Add subtask form */}
                      {isAddingSubtask && (
                        <div className="flex gap-2 mt-2">
                          <Input
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                            placeholder="Add an item..."
                            className="bg-[#2b2d31] border-[#404249] text-white h-9 focus-visible:ring-[#5865f2]"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddSubtask();
                              if (e.key === "Escape") {
                                setIsAddingSubtask(false);
                                setNewSubtask("");
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={handleAddSubtask}
                            className="bg-[#5865f2] hover:bg-[#4752c4] h-9"
                          >
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setIsAddingSubtask(false);
                              setNewSubtask("");
                            }}
                            className="text-gray-400 hover:text-white hover:bg-[#404249] h-9"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>

                    {!isAddingSubtask && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-gray-500 hover:text-white hover:bg-[#2b2d31] h-8"
                        onClick={() => setIsAddingSubtask(true)}
                      >
                        <Plus size={14} className="mr-1" />
                        Add item
                      </Button>
                    )}
                  </div>
                ) : null}

                {/* Attachments */}
                {displayAttachments && displayAttachments.length > 0 && (
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-3 flex items-center gap-2">
                      <Paperclip size={14} />
                      Attachments ({displayAttachments.length})
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {displayAttachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-3 p-3 bg-[#2b2d31] rounded-lg hover:bg-[#313338] transition-colors group border border-transparent hover:border-[#404249]"
                        >
                          {attachment.type === "image" && attachment.url ? (
                            <img
                              src={attachment.url}
                              alt={attachment.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-[#1e1f22] rounded flex items-center justify-center">
                              <File size={18} className="text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-200 truncate">
                              {attachment.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {attachment.size}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() =>
                              handleDeleteAttachment(
                                attachment.id,
                                attachment.url || ""
                              )
                            }
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500 flex items-center gap-2">
                      <MessageSquare size={14} />
                      Activity
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowComments(!showComments)}
                      className="text-xs text-gray-500 hover:text-white hover:bg-[#2b2d31] h-7"
                    >
                      {showComments ? (
                        <>
                          <ChevronUp size={12} className="mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <ChevronDown size={12} className="mr-1" />
                          Show
                        </>
                      )}
                    </Button>
                  </div>

                  <AnimatePresence>
                    {showComments && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3 overflow-hidden"
                      >
                        {/* Add comment */}
                        <div className="flex gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="text-xs bg-[#5865f2] text-white">
                              YO
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <Textarea
                              placeholder="Write a comment..."
                              className="mb-2 bg-[#2b2d31] border-[#404249] text-white min-h-[80px] focus-visible:ring-[#5865f2] resize-none"
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              onKeyDown={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  (e.metaKey || e.ctrlKey)
                                ) {
                                  handleAddComment();
                                }
                              }}
                            />
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                Press ⌘+Enter to send
                              </span>
                              <Button
                                size="sm"
                                className="bg-[#5865f2] hover:bg-[#4752c4] h-8"
                                onClick={handleAddComment}
                                disabled={!newComment.trim()}
                              >
                                Comment
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Comments list */}
                        {currentTask.comments?.map((comment) => {
                          // Handle both CardComment (Supabase) and TaskComment (local) types
                          // For local TaskComment: has 'author' as string
                          // For CardComment: has 'author' as { id, username, avatar_url }
                          let authorName: string;
                          let timestamp: string;

                          if ("timestamp" in comment) {
                            // Local TaskComment type
                            authorName = (comment as TaskComment).author;
                            timestamp = (comment as TaskComment).timestamp;
                          } else {
                            // CardComment (Supabase) type
                            const cardComment = comment as CardComment;
                            authorName =
                              cardComment.author?.username || "Unknown";
                            timestamp = new Date(
                              cardComment.created_at || new Date()
                            ).toLocaleString();
                          }

                          const authorInitials = getInitials(authorName);

                          return (
                            <div key={comment.id} className="flex gap-3 group">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className="text-xs bg-[#5865f2] text-white">
                                  {authorInitials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-gray-200">
                                    {authorName}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {timestamp}
                                  </span>
                                </div>
                                <div className="bg-[#2b2d31] rounded-lg p-3">
                                  <p className="text-sm text-gray-300">
                                    {comment.content}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-gray-500 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </ScrollArea>

            {/* Sidebar - "Add to Card" Actions */}
            <div className="w-56 border-l border-[#2b2d31] bg-[#1e1f22] p-4 space-y-4 overflow-y-auto">
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                  Add to card
                </h3>
                <div className="space-y-1.5">
                  {/* Members */}
                  <Popover
                    open={showMembersModal}
                    onOpenChange={(open) => {
                      setShowMembersModal(open);
                      if (!open) {
                        setMemberSearchQuery("");
                        setSearchResults([]);
                      }
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-sm h-9 bg-[#2b2d31] text-gray-300 hover:bg-[#404249] hover:text-white"
                      >
                        <Users size={14} className="mr-2" />
                        Members
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-72 p-2 bg-[#2b2d31] border-[#404249]"
                      align="start"
                    >
                      {/* Search input */}
                      <div className="px-2 mb-2">
                        <Input
                          placeholder="Search members..."
                          value={memberSearchQuery}
                          onChange={(e) => setMemberSearchQuery(e.target.value)}
                          className="h-8 text-sm bg-[#1e1f22] border-[#404249] text-white placeholder:text-gray-500"
                        />
                      </div>

                      {/* Search Results */}
                      {memberSearchQuery.trim() && (
                        <div className="mb-2">
                          <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2 px-2">
                            Search Results
                          </h4>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {isSearching ? (
                              <p className="text-xs text-gray-500 px-2">
                                Searching...
                              </p>
                            ) : searchResults.length > 0 ? (
                              searchResults.map((user) => {
                                const isAlreadyMember = availableMembers.some(
                                  (m) => m.id === user.id
                                );
                                const isAssigned =
                                  currentTask.assignees?.includes(
                                    user.username
                                  );
                                return (
                                  <Button
                                    key={user.id}
                                    variant="ghost"
                                    className={`w-full justify-start text-sm h-9 ${
                                      isAssigned
                                        ? "bg-[#5865f2]/20 text-[#5865f2]"
                                        : "text-gray-300 hover:bg-[#404249]"
                                    }`}
                                    onClick={() => {
                                      if (isAlreadyMember) {
                                        handleAddMember(user.id, user.username);
                                      } else {
                                        handleAddMemberToBoard(
                                          user.id,
                                          user.username
                                        );
                                      }
                                    }}
                                  >
                                    {isAssigned && (
                                      <Check size={12} className="mr-2" />
                                    )}
                                    <Avatar className="h-5 w-5 mr-2">
                                      {user.avatar_url ? (
                                        <AvatarImage src={user.avatar_url} />
                                      ) : null}
                                      <AvatarFallback className="text-[10px] bg-[#5865f2] text-white">
                                        {user.username
                                          ?.slice(0, 2)
                                          .toUpperCase() || "??"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate">
                                      {user.username}
                                    </span>
                                    {!isAlreadyMember && (
                                      <span className="ml-auto text-[10px] text-gray-500">
                                        + Add
                                      </span>
                                    )}
                                  </Button>
                                );
                              })
                            ) : (
                              <p className="text-xs text-gray-500 px-2">
                                No users found
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Board Members */}
                      {availableMembers.length > 0 && (
                        <div className="mb-2">
                          <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2 px-2">
                            {boardMembers.length > 0
                              ? "Board Members"
                              : "Server Members"}
                          </h4>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {availableMembers.map((member) => {
                              const isAssigned =
                                currentTask.assignees?.includes(member.name);
                              return (
                                <Button
                                  key={member.id}
                                  variant="ghost"
                                  className={`w-full justify-start text-sm h-9 ${
                                    isAssigned
                                      ? "bg-[#5865f2]/20 text-[#5865f2]"
                                      : "text-gray-300 hover:bg-[#404249]"
                                  }`}
                                  onClick={() => {
                                    if (!member.isBoardMember) {
                                      handleAddMemberToBoard(
                                        member.id,
                                        member.name
                                      );
                                    } else {
                                      handleAddMember(member.id, member.name);
                                    }
                                  }}
                                >
                                  {isAssigned && (
                                    <Check size={12} className="mr-2" />
                                  )}
                                  <Avatar className="h-5 w-5 mr-2">
                                    {member.avatarUrl ? (
                                      <AvatarImage src={member.avatarUrl} />
                                    ) : null}
                                    <AvatarFallback
                                      className={`text-[10px] ${member.color} text-white`}
                                    >
                                      {member.avatar}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="truncate">
                                    {member.name}
                                  </span>
                                  {!member.isBoardMember && (
                                    <span className="ml-auto text-[10px] text-gray-500">
                                      + Add
                                    </span>
                                  )}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Empty state */}
                      {availableMembers.length === 0 &&
                        !memberSearchQuery.trim() && (
                          <p className="text-xs text-gray-500 px-2 py-2">
                            No members yet. Search to add members to this board.
                          </p>
                        )}
                    </PopoverContent>
                  </Popover>

                  {/* Labels */}
                  <Popover
                    open={showLabelsModal}
                    onOpenChange={setShowLabelsModal}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-sm h-9 bg-[#2b2d31] text-gray-300 hover:bg-[#404249] hover:text-white"
                      >
                        <Tag size={14} className="mr-2" />
                        Labels
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-56 p-2 bg-[#2b2d31] border-[#404249]"
                      align="start"
                    >
                      <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2 px-2">
                        Labels
                      </h4>
                      <div className="space-y-1">
                        {boardLabels?.map((label) => {
                          const isSelected = currentTask.labels.includes(
                            label.id
                          );
                          return (
                            <Button
                              key={label.id}
                              variant="ghost"
                              className={`w-full justify-start text-sm h-9 ${
                                isSelected
                                  ? "bg-[#5865f2]/20"
                                  : "hover:bg-[#404249]"
                              }`}
                              onClick={() =>
                                isSelected
                                  ? handleRemoveLabel(label.id)
                                  : handleAddLabel(label.id)
                              }
                            >
                              {isSelected && (
                                <Check
                                  size={12}
                                  className="mr-2 text-[#5865f2]"
                                />
                              )}
                              <div
                                className={`w-3 h-3 rounded ${label.color} mr-2`}
                              />
                              <span className="text-gray-300">
                                {label.name}
                              </span>
                            </Button>
                          );
                        })}
                        <div className="h-px bg-[#404249] my-1" />
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-sm h-9 text-gray-400 hover:bg-[#404249] hover:text-white"
                          onClick={onManageLabels}
                        >
                          <Plus size={14} className="mr-2" />
                          Create label
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Checklist */}
                  {!displaySubtasks?.length && !isAddingSubtask && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm h-9 bg-[#2b2d31] text-gray-300 hover:bg-[#404249] hover:text-white"
                      onClick={() => setIsAddingSubtask(true)}
                    >
                      <CheckSquare size={14} className="mr-2" />
                      Checklist
                    </Button>
                  )}

                  {/* Dates */}
                  <Popover
                    open={showDatePicker}
                    onOpenChange={setShowDatePicker}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-sm h-9 bg-[#2b2d31] text-gray-300 hover:bg-[#404249] hover:text-white"
                      >
                        <Calendar size={14} className="mr-2" />
                        Due date
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 bg-[#2b2d31] border-[#404249]"
                      align="start"
                    >
                      <CalendarComponent
                        mode="single"
                        selected={
                          currentTask.dueDate
                            ? new Date(currentTask.dueDate)
                            : undefined
                        }
                        onSelect={handleSetDueDate}
                        initialFocus
                        className="bg-[#2b2d31]"
                      />
                      {currentTask.dueDate && (
                        <div className="p-2 border-t border-[#404249]">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-gray-400 hover:text-white hover:bg-[#404249] h-8"
                            onClick={() => handleSetDueDate(undefined)}
                          >
                            Remove date
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>

                  {/* Image */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm h-9 bg-[#2b2d31] text-gray-300 hover:bg-[#404249] hover:text-white"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <ImageIcon size={14} className="mr-2" />
                    Image
                  </Button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />

                  {/* Attachment */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm h-9 bg-[#2b2d31] text-gray-300 hover:bg-[#404249] hover:text-white"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip size={14} className="mr-2" />
                    Attachment
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              {/* Actions */}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                  Actions
                </h3>
                <div className="space-y-1.5">
                  {/* Mark as Complete */}
                  {!isTaskComplete ? (
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm h-9 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                      onClick={handleMarkComplete}
                    >
                      <Check size={14} className="mr-2" />
                      Mark complete
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm h-9 bg-[#2b2d31] text-gray-300 hover:bg-[#404249] hover:text-white"
                      onClick={async () => {
                        await handleUpdateTask({ status: "column-1-1" });
                        await logActivity("task_reopened");
                      }}
                    >
                      <XCircle size={14} className="mr-2" />
                      Mark incomplete
                    </Button>
                  )}

                  {/* Archive */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm h-9 bg-[#2b2d31] text-gray-300 hover:bg-[#404249] hover:text-white"
                    onClick={handleArchiveTask}
                  >
                    <Archive size={14} className="mr-2" />
                    Archive
                  </Button>

                  {/* Delete */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm h-9 text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 size={14} className="mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-[#2b2d31] border-[#404249] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Delete task?</DialogTitle>
            <DialogDescription className="text-gray-400">
              This will permanently delete{currentTask.title}. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteConfirm(false)}
              className="text-gray-400 hover:text-white hover:bg-[#404249]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteTask}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
