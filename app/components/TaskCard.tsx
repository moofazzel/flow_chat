import { copyToClipboard } from "@/utils/clipboard";
import {
  AlertCircle,
  Archive,
  Calendar,
  CheckSquare,
  Copy,
  Edit2,
  Eye,
  MessageSquare,
  Paperclip,
  Tag,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { LabelBadge, type Label } from "./LabelBadge";
// import type { Task } from "./TaskBoard";
import { Task } from "../page";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onDelete?: (taskId: string) => void;
  onDuplicate?: (task: Task) => void;
  onArchive?: (taskId: string) => void;
  onQuickEdit?: (task: Task) => void;
  boardLabels?: Label[];
  isDragging?: boolean;
}

export function TaskCard({
  task,
  onClick,
  onDelete,
  onDuplicate,
  onArchive,
  onQuickEdit,
  boardLabels,
  isDragging,
}: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Calculate subtask progress
  const subtaskProgress = task.subtasks
    ? {
        completed: task.subtasks.filter((st) => st.completed).length,
        total: task.subtasks.length,
        percentage:
          (task.subtasks.filter((st) => st.completed).length /
            task.subtasks.length) *
          100,
      }
    : null;

  // Check if due date is overdue or approaching
  const getDueDateStatus = () => {
    if (!task.dueDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0)
      return {
        status: "overdue",
        text: "Overdue",
        color: "text-red-600 bg-red-50 border-red-200",
      };
    if (diffDays === 0)
      return {
        status: "today",
        text: "Due today",
        color: "text-orange-600 bg-orange-50 border-orange-200",
      };
    if (diffDays === 1)
      return {
        status: "tomorrow",
        text: "Due tomorrow",
        color: "text-yellow-600 bg-yellow-50 border-yellow-200",
      };
    if (diffDays <= 3)
      return {
        status: "soon",
        text: `${diffDays} days left`,
        color: "text-blue-600 bg-blue-50 border-blue-200",
      };
    return {
      status: "future",
      text: `${diffDays} days left`,
      color: "text-gray-600 bg-gray-50 border-gray-200",
    };
  };

  const dueDateStatus = getDueDateStatus();

  // Priority color for left border
  const priorityBorderColor =
    task.priority === "urgent"
      ? "border-l-red-500"
      : task.priority === "high"
      ? "border-l-orange-500"
      : task.priority === "medium"
      ? "border-l-yellow-500"
      : "border-l-gray-400";

  // Handle right-click to show context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent browser's default context menu
    e.stopPropagation(); // Prevent card click

    // Set menu position at cursor
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  // Close menu when clicking outside
  const handleCloseMenu = () => {
    setShowMenu(false);
  };

  const handleMenuAction = (action: () => void) => {
    action();
    setShowMenu(false);
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(
      `${window.location.origin}/task/${task.id}`
    );
    if (success) {
      toast.success("Task link copied to clipboard");
    } else {
      toast.error("Failed to copy link");
    }
    setShowMenu(false);
  };

  const handleDuplicate = () => {
    onDuplicate?.(task);
    toast.success(`Task duplicated: ${task.title}`);
    setShowMenu(false);
  };

  const handleArchive = () => {
    onArchive?.(task.id);
    toast.success(`Task archived: ${task.title}`);
    setShowMenu(false);
  };

  const handleDeleteClick = () => {
    setShowMenu(false);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(task.id);
    toast.success("Task deleted");
    setShowDeleteDialog(false);
  };

  const handleOpenInModal = () => {
    setShowMenu(false);
    onClick();
  };

  return (
    <>
      {/* Context Menu Backdrop */}
      {showMenu && (
        <div className="fixed inset-0 z-40" onClick={handleCloseMenu} />
      )}

      <motion.div
        onClick={onClick}
        onContextMenu={handleContextMenu}
        data-task-card="true"
        whileHover={
          !isDragging
            ? {
                scale: 1.02,
                y: -3,
                boxShadow:
                  "0 12px 24px -8px rgba(0, 0, 0, 0.15), 0 6px 12px -6px rgba(0, 0, 0, 0.1)",
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  mass: 0.5,
                },
              }
            : undefined
        }
        whileTap={
          !isDragging
            ? {
                scale: 0.98,
                transition: {
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                },
              }
            : undefined
        }
        className={`bg-white rounded-lg p-3 shadow-sm transition-shadow cursor-pointer border border-gray-200 border-l-4 ${priorityBorderColor} hover:border-gray-300 group relative ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          pointerEvents: isDragging ? "none" : "auto",
        }}
      >
        {/* Header with ID and Priority */}
        <div className="flex items-start gap-2 mb-2">
          <span className="text-xs text-gray-500 font-medium">{task.id}</span>
          <Badge
            variant="outline"
            className={`text-xs ml-auto ${
              task.priority === "urgent"
                ? "border-red-500 text-red-600 bg-red-50"
                : task.priority === "high"
                ? "border-orange-500 text-orange-600 bg-orange-50"
                : task.priority === "medium"
                ? "border-yellow-600 text-yellow-700 bg-yellow-50"
                : "border-gray-400 text-gray-600 bg-gray-50"
            }`}
          >
            {task.priority}
          </Badge>
        </div>

        {/* Title */}
        <h4 className="text-gray-900 mb-2 line-clamp-2">{task.title}</h4>

        {/* Due Date with Status */}
        {dueDateStatus && (
          <div
            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded mb-2 border ${dueDateStatus.color}`}
          >
            <Calendar size={12} />
            <span>{dueDateStatus.text}</span>
            {dueDateStatus.status === "overdue" && <AlertCircle size={12} />}
          </div>
        )}

        {/* Subtasks Progress */}
        {subtaskProgress && subtaskProgress.total > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
              <CheckSquare size={12} />
              <span>
                {subtaskProgress.completed}/{subtaskProgress.total} subtasks
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  subtaskProgress.percentage === 100
                    ? "bg-green-500"
                    : "bg-blue-500"
                }`}
                style={{ width: `${subtaskProgress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Labels */}
        <div className="flex flex-wrap gap-1 mb-3">
          {task.labels.slice(0, 3).map((label) => (
            <LabelBadge key={label} label={label} boardLabels={boardLabels} />
          ))}
          {task.labels.length > 3 && (
            <Badge
              variant="secondary"
              className="text-xs bg-gray-100 text-gray-700"
            >
              +{task.labels.length - 3}
            </Badge>
          )}
        </div>

        {/* Footer: Assignee, Attachments, Comments */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {task.assignee && (
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-[#0052cc] text-white">
                  {getInitials(task.assignee)}
                </AvatarFallback>
              </Avatar>
            )}
            {task.attachments && task.attachments.length > 0 && (
              <div className="flex items-center gap-1 text-gray-500">
                <Paperclip size={12} />
                <span>{task.attachments.length}</span>
              </div>
            )}
          </div>
          {task.comments.length > 0 && (
            <div className="flex items-center gap-1 text-gray-500">
              <MessageSquare size={14} />
              {task.comments.length}
            </div>
          )}
        </div>
      </motion.div>

      {/* Context Menu */}
      {showMenu && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 min-w-[200px]"
          style={{
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-1 px-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm h-9 px-3 hover:bg-gray-100"
              onClick={handleOpenInModal}
            >
              <Eye size={16} className="mr-3" />
              Open Card
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-sm h-9 px-3 hover:bg-gray-100"
              onClick={() => handleMenuAction(() => onQuickEdit?.(task))}
            >
              <Edit2 size={16} className="mr-3" />
              Quick Edit
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-sm h-9 px-3 hover:bg-gray-100"
              onClick={handleCopyLink}
            >
              <Copy size={16} className="mr-3" />
              Copy Link
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-sm h-9 px-3 hover:bg-gray-100"
              onClick={handleDuplicate}
            >
              <Tag size={16} className="mr-3" />
              Duplicate Card
            </Button>

            <div className="border-t my-1" />

            <Button
              variant="ghost"
              className="w-full justify-start text-sm h-9 px-3 hover:bg-gray-100"
              onClick={handleArchive}
            >
              <Archive size={16} className="mr-3" />
              Archive
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-sm h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDeleteClick}
            >
              <Trash2 size={16} className="mr-3" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Delete Task?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>"{task.title}"</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
