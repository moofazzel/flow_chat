"use client";

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
  CreditCard,
  Edit2,
  File,
  Image as ImageIcon,
  Link as LinkIcon,
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
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Attachment, Comment, SubTask, Task } from "../page";
import { Label, LabelBadge } from "./LabelBadge";
import { QuickPriorityPicker } from "./QuickPriorityPicker";
import { RichTextEditor } from "./RichTextEditor";
import { Avatar, AvatarFallback } from "./ui/avatar";
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
}

export function TaskDetailsModal({
  task,
  onClose,
  onUpdateTask,
  onDeleteTask,
  boardLabels,
  onManageLabels,
}: TaskDetailsModalProps) {
  const [localTask, setLocalTask] = useState<Task>(task);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(task.description);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Mock members data - in production this should come from props or API
  const availableMembers = [
    { id: "1", name: "John Doe", avatar: "JD", color: "bg-blue-500" },
    { id: "2", name: "Jane Smith", avatar: "JS", color: "bg-green-500" },
    { id: "3", name: "Bob Wilson", avatar: "BW", color: "bg-purple-500" },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const updateTask = (updates: Partial<Task>) => {
    const updatedTask = { ...localTask, ...updates };
    setLocalTask(updatedTask);
    onUpdateTask?.(updatedTask);
  };

  const handleSaveTitle = () => {
    if (editedTitle.trim()) {
      updateTask({ title: editedTitle.trim() });
      setIsEditingTitle(false);
      toast.success("Title updated");
    }
  };

  const handleSaveDescription = () => {
    updateTask({ description: editedDescription.trim() });
    setIsEditingDescription(false);
    toast.success("Description updated");
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: `c-${Date.now()}`,
      author: "You",
      content: newComment.trim(),
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      avatar: "YO",
    };

    updateTask({
      comments: [...(localTask.comments || []), comment],
    });
    setNewComment("");
    toast.success("Comment added");
  };

  const handleDeleteComment = (commentId: string) => {
    updateTask({
      comments: localTask.comments.filter((c) => c.id !== commentId),
    });
    toast.success("Comment deleted");
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;

    const subtask: SubTask = {
      id: `st-${Date.now()}`,
      title: newSubtask.trim(),
      completed: false,
    };

    updateTask({
      subtasks: [...(localTask.subtasks || []), subtask],
    });
    setNewSubtask("");
    setIsAddingSubtask(false);
    toast.success("Subtask added");
  };

  const handleToggleSubtask = (subtaskId: string) => {
    updateTask({
      subtasks: localTask.subtasks?.map((st) =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      ),
    });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    updateTask({
      subtasks: localTask.subtasks?.filter((st) => st.id !== subtaskId),
    });
    toast.success("Subtask deleted");
  };

  const handleAddLabel = (labelId: string) => {
    if (!localTask.labels.includes(labelId)) {
      updateTask({ labels: [...localTask.labels, labelId] });
      toast.success("Label added");
    }
    setShowLabelsModal(false);
  };

  const handleRemoveLabel = (labelId: string) => {
    updateTask({ labels: localTask.labels.filter((l) => l !== labelId) });
    toast.success("Label removed");
  };

  const handleSetDueDate = (date: Date | undefined) => {
    if (date) {
      const formattedDate = date.toISOString().split("T")[0];
      updateTask({ dueDate: formattedDate });
      toast.success(`Due date set to ${formattedDate}`);
    } else {
      updateTask({ dueDate: undefined });
      toast.success("Due date removed");
    }
    setShowDatePicker(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: Attachment[] = Array.from(files).map((file) => ({
      id: `att-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      type: "image",
      url: URL.createObjectURL(file),
    }));

    updateTask({
      attachments: [...(localTask.attachments || []), ...newAttachments],
    });

    toast.success(`${files.length} image(s) added`);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: Attachment[] = Array.from(files).map((file) => ({
      id: `att-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      type: "file",
      url: URL.createObjectURL(file),
    }));

    updateTask({
      attachments: [...(localTask.attachments || []), ...newAttachments],
    });

    toast.success(`${files.length} file(s) added`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    updateTask({
      attachments: localTask.attachments?.filter(
        (att) => att.id !== attachmentId
      ),
    });
    toast.success("Attachment deleted");
  };

  const handleMarkComplete = () => {
    // Update status to done
    updateTask({ status: "column-1-3" }); // Done column

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
      title: localTask.title,
      description: localTask.description,
      priority: localTask.priority,
      labels: localTask.labels,
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
    onDeleteTask?.(localTask.id);
    toast.success("Task deleted");
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(
      `${window.location.origin}/task/${task.id}`
    );
    if (success) {
      toast.success("Link copied to clipboard");
    } else {
      toast.error("Failed to copy link");
    }
  };

  const handleAddMember = (memberId: string, memberName: string) => {
    if (memberName) {
      // Initialize assignees array if it doesn't exist
      const currentAssignees = localTask.assignees || [];

      // Toggle member - add if not present, remove if already assigned
      const isAlreadyAssigned = currentAssignees.includes(memberName);

      if (isAlreadyAssigned) {
        // Remove member
        const newAssignees = currentAssignees.filter(
          (name) => name !== memberName
        );
        updateTask({
          assignees: newAssignees,
          assignee: newAssignees[0], // Keep backward compatibility
        });
        toast.success(`Removed ${memberName}`);
      } else {
        // Add member
        const newAssignees = [...currentAssignees, memberName];
        updateTask({
          assignees: newAssignees,
          assignee: memberName, // Keep backward compatibility
        });
        toast.success(`Assigned to ${memberName}`);
      }
    }
  };

  const completedSubtasks =
    localTask.subtasks?.filter((st) => st.completed).length || 0;
  const totalSubtasks = localTask.subtasks?.length || 0;
  const subtaskProgress =
    totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const isTaskComplete = localTask.status === "column-1-3";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
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
              className="bg-green-500 rounded-full p-8 shadow-2xl"
            >
              <Check size={80} className="text-white" strokeWidth={3} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1, times: [0, 0.5, 1] }}
              className="absolute inset-0 bg-green-500/20"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between border-b">
            <div className="flex items-center gap-3 flex-1">
              <Badge variant="outline" className="text-sm font-mono">
                {localTask.id}
              </Badge>
              <QuickPriorityPicker
                currentPriority={localTask.priority}
                onPriorityChange={(priority) => updateTask({ priority })}
              />
              {localTask.dueDate && (
                <Badge variant="outline" className="text-sm gap-1">
                  <Clock size={12} />
                  Due: {localTask.dueDate}
                </Badge>
              )}
              {isTaskComplete && (
                <Badge className="bg-green-500 text-white gap-1">
                  <Check size={12} />
                  Complete
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleCopyLink}>
                <LinkIcon size={18} />
              </Button>
              <Popover open={showActionsMenu} onOpenChange={setShowActionsMenu}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal size={18} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="end">
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm"
                      onClick={handleCopyTask}
                    >
                      <Copy size={16} className="mr-2" />
                      Copy Task
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm"
                      onClick={handleArchiveTask}
                    >
                      <Archive size={16} className="mr-2" />
                      Archive
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setShowActionsMenu(false);
                        setShowDeleteConfirm(true);
                      }}
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete Task
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X size={18} />
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
                        className="text-2xl"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveTitle();
                          if (e.key === "Escape") setIsEditingTitle(false);
                        }}
                      />
                      <Button size="sm" onClick={handleSaveTitle}>
                        <Save size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingTitle(false)}
                      >
                        <XCircle size={16} />
                      </Button>
                    </div>
                  ) : (
                    <h2
                      className="text-gray-900 text-2xl mb-2 cursor-pointer hover:text-blue-600 transition-colors group flex items-center gap-2"
                      onClick={() => setIsEditingTitle(true)}
                    >
                      {localTask.title}
                      <Edit2
                        size={16}
                        className="opacity-0 group-hover:opacity-50"
                      />
                    </h2>
                  )}
                  <div className="text-sm text-gray-500">
                    in column{" "}
                    <span className="text-gray-900">{localTask.status}</span>
                  </div>
                </div>

                {/* Labels */}
                {localTask.labels && localTask.labels.length > 0 && (
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block flex items-center gap-2">
                      <Tag size={16} />
                      Labels
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {localTask.labels.map((labelId) => {
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
                {localTask.assignees && localTask.assignees.length > 0 && (
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block flex items-center gap-2">
                      <Users size={16} />
                      Assigned Members
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {localTask.assignees.map((assigneeName) => {
                        const member = availableMembers.find(
                          (m) => m.name === assigneeName
                        );
                        return member ? (
                          <div
                            key={assigneeName}
                            className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 group hover:bg-gray-200 transition-colors"
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarFallback
                                className={`text-xs ${member.color} text-white`}
                              >
                                {member.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-900">
                              {assigneeName}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                              onClick={() =>
                                handleAddMember(member.id, member.name)
                              }
                            >
                              <X
                                size={14}
                                className="text-gray-500 hover:text-red-500"
                              />
                            </Button>
                          </div>
                        ) : (
                          <div
                            key={assigneeName}
                            className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2"
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-gray-500 text-white">
                                {getInitials(assigneeName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-900">
                              {assigneeName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="text-sm text-gray-600 mb-2 block flex items-center gap-2">
                    <CreditCard size={16} />
                    Description
                  </label>
                  {isEditingDescription ? (
                    <div>
                      <RichTextEditor
                        value={editedDescription}
                        onChange={setEditedDescription}
                        placeholder="Add a more detailed description..."
                        minHeight="200px"
                      />
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={handleSaveDescription}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditedDescription(localTask.description);
                            setIsEditingDescription(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div
                        className="bg-gray-50 rounded-lg p-4 mb-3 min-h-[60px] cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => setIsEditingDescription(true)}
                      >
                        {localTask.description ? (
                          <div
                            className="text-gray-700 text-sm prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: localTask.description,
                            }}
                          />
                        ) : (
                          <p className="text-gray-400 text-sm">
                            Add a more detailed description...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Subtasks */}
                {(localTask.subtasks && localTask.subtasks.length > 0) ||
                isAddingSubtask ? (
                  <div>
                    <label className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                      <CheckSquare size={16} />
                      Subtasks ({completedSubtasks}/{totalSubtasks})
                    </label>

                    {/* Progress bar */}
                    {totalSubtasks > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <motion.div
                          className="bg-green-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${subtaskProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      {localTask.subtasks?.map((subtask) => (
                        <div
                          key={subtask.id}
                          className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors"
                        >
                          <Checkbox
                            checked={subtask.completed}
                            onCheckedChange={() =>
                              handleToggleSubtask(subtask.id)
                            }
                          />
                          <span
                            className={`flex-1 text-sm ${
                              subtask.completed
                                ? "line-through text-gray-500"
                                : "text-gray-900"
                            }`}
                          >
                            {subtask.title}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-auto p-1"
                            onClick={() => handleDeleteSubtask(subtask.id)}
                          >
                            <Trash2 size={14} className="text-red-500" />
                          </Button>
                        </div>
                      ))}

                      {/* Add subtask form */}
                      {isAddingSubtask && (
                        <div className="flex gap-2">
                          <Input
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                            placeholder="Subtask title..."
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddSubtask();
                              if (e.key === "Escape") {
                                setIsAddingSubtask(false);
                                setNewSubtask("");
                              }
                            }}
                          />
                          <Button size="sm" onClick={handleAddSubtask}>
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setIsAddingSubtask(false);
                              setNewSubtask("");
                            }}
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
                        className="mt-2 text-gray-600 hover:text-gray-900"
                        onClick={() => setIsAddingSubtask(true)}
                      >
                        <Plus size={14} className="mr-2" />
                        Add subtask
                      </Button>
                    )}
                  </div>
                ) : null}

                {/* Attachments */}
                {localTask.attachments && localTask.attachments.length > 0 && (
                  <div>
                    <label className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                      <Paperclip size={16} />
                      Attachments ({localTask.attachments.length})
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {localTask.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                        >
                          {attachment.type === "image" && attachment.url ? (
                            <img
                              src={attachment.url}
                              alt={attachment.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                              <File size={20} className="text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-900 truncate">
                              {attachment.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {attachment.size}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-auto p-1"
                            onClick={() =>
                              handleDeleteAttachment(attachment.id)
                            }
                          >
                            <Trash2 size={14} className="text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm text-gray-600 flex items-center gap-2">
                      <CheckSquare size={16} />
                      Activity ({localTask.comments?.length || 0})
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowComments(!showComments)}
                      className="text-xs"
                    >
                      {showComments ? (
                        <>
                          <ChevronUp size={14} className="mr-1" />
                          Hide Comments
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} className="mr-1" />
                          Show Comments
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
                        className="space-y-4 overflow-hidden"
                      >
                        {localTask.comments?.map((comment) => (
                          <div
                            key={comment.id}
                            className="flex gap-3 p-3 bg-gray-50 rounded-lg group"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-blue-500 text-white">
                                {getInitials(comment.author)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm text-gray-900">
                                  {comment.author}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {comment.timestamp}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">
                                {comment.content}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-auto p-1"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <Trash2 size={14} className="text-red-500" />
                            </Button>
                          </div>
                        ))}

                        {/* Add comment */}
                        <div className="flex gap-3 pt-4 border-t">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-purple-500 text-white">
                              YO
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <Textarea
                              placeholder="Add a comment..."
                              className="mb-2"
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && e.metaKey) {
                                  handleAddComment();
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              className="bg-[#0052cc] hover:bg-[#0747a6]"
                              onClick={handleAddComment}
                              disabled={!newComment.trim()}
                            >
                              Comment
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </ScrollArea>

            {/* Sidebar - "Add to Card" Actions */}
            <div className="w-64 border-l bg-gray-50 p-4 space-y-4 overflow-y-auto">
              <div>
                <h3 className="text-xs text-gray-500 uppercase mb-2">
                  Add to card
                </h3>
                <div className="space-y-2">
                  {/* Members */}
                  <Popover
                    open={showMembersModal}
                    onOpenChange={setShowMembersModal}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-sm"
                        size="sm"
                      >
                        <Users size={16} className="mr-2" />
                        Members
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="start">
                      <h4 className="text-sm mb-2">Members</h4>
                      <div className="text-xs text-gray-500 mb-3">
                        Click to add or remove
                      </div>
                      <div className="space-y-2">
                        {availableMembers.map((member) => {
                          const isAssigned = localTask.assignees?.includes(
                            member.name
                          );
                          return (
                            <Button
                              key={member.id}
                              variant={isAssigned ? "default" : "ghost"}
                              className={`w-full justify-start text-sm ${
                                isAssigned
                                  ? "bg-blue-500 text-white hover:bg-blue-600"
                                  : ""
                              }`}
                              onClick={() =>
                                handleAddMember(member.id, member.name)
                              }
                            >
                              {isAssigned && (
                                <Check size={14} className="mr-2" />
                              )}
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarFallback
                                  className={`text-xs ${
                                    isAssigned
                                      ? "bg-white text-blue-500"
                                      : member.color + " text-white"
                                  }`}
                                >
                                  {member.avatar}
                                </AvatarFallback>
                              </Avatar>
                              {member.name}
                            </Button>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Labels */}
                  <Popover
                    open={showLabelsModal}
                    onOpenChange={setShowLabelsModal}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-sm"
                        size="sm"
                      >
                        <Tag size={16} className="mr-2" />
                        Labels
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="start">
                      <h4 className="text-sm mb-2">Labels</h4>
                      <div className="space-y-2">
                        {boardLabels?.map((label) => {
                          const isSelected = localTask.labels.includes(
                            label.id
                          );
                          return (
                            <Button
                              key={label.id}
                              variant={isSelected ? "default" : "outline"}
                              className={`w-full justify-start text-sm ${
                                isSelected
                                  ? `${label.color} ${label.textColor}`
                                  : ""
                              }`}
                              onClick={() =>
                                isSelected
                                  ? handleRemoveLabel(label.id)
                                  : handleAddLabel(label.id)
                              }
                            >
                              {isSelected && (
                                <Check size={14} className="mr-2" />
                              )}
                              <div
                                className={`w-3 h-3 rounded-full ${label.color} mr-2`}
                              />
                              {label.name}
                            </Button>
                          );
                        })}
                        <Button
                          variant="outline"
                          className="w-full justify-start text-sm"
                          size="sm"
                          onClick={onManageLabels}
                        >
                          Manage Labels
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Checklist */}
                  {!localTask.subtasks?.length && !isAddingSubtask && (
                    <Button
                      variant="outline"
                      className="w-full justify-start text-sm"
                      size="sm"
                      onClick={() => setIsAddingSubtask(true)}
                    >
                      <CheckSquare size={16} className="mr-2" />
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
                        variant="outline"
                        className="w-full justify-start text-sm"
                        size="sm"
                      >
                        <Calendar size={16} className="mr-2" />
                        Dates
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={
                          localTask.dueDate
                            ? new Date(localTask.dueDate)
                            : undefined
                        }
                        onSelect={handleSetDueDate}
                        initialFocus
                      />
                      {localTask.dueDate && (
                        <div className="p-3 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => handleSetDueDate(undefined)}
                          >
                            Remove Due Date
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>

                  {/* Attachment - Image */}
                  <Button
                    variant="outline"
                    className="w-full justify-start text-sm"
                    size="sm"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <ImageIcon size={16} className="mr-2" />
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

                  {/* Attachment - File */}
                  <Button
                    variant="outline"
                    className="w-full justify-start text-sm"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip size={16} className="mr-2" />
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
                <h3 className="text-xs text-gray-500 uppercase mb-2">
                  Actions
                </h3>
                <div className="space-y-2">
                  {/* Mark as Complete */}
                  {!isTaskComplete ? (
                    <Button
                      variant="outline"
                      className="w-full justify-start text-sm bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                      size="sm"
                      onClick={handleMarkComplete}
                    >
                      <Check size={16} className="mr-2" />
                      Mark Complete
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full justify-start text-sm bg-gray-50"
                      size="sm"
                      onClick={() => updateTask({ status: "column-1-1" })}
                    >
                      <XCircle size={16} className="mr-2" />
                      Mark Incomplete
                    </Button>
                  )}

                  {/* Archive */}
                  <Button
                    variant="outline"
                    className="w-full justify-start text-sm"
                    size="sm"
                    onClick={handleArchiveTask}
                  >
                    <Archive size={16} className="mr-2" />
                    Archive
                  </Button>

                  {/* Delete */}
                  <Button
                    variant="outline"
                    className="w-full justify-start text-sm text-red-600 hover:bg-red-50 border-red-200"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {localTask.title}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTask}>
              Delete Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
