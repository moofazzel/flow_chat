"use client";

import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Tag,
  User,
} from "lucide-react";
import type { Task } from "../page";
import { Badge } from "./ui/badge";

interface TaskActivityCardProps {
  taskId: string;
  taskTitle: string;
  activityType: string;
  boardName?: string;
  task?: Task;
  onTaskClick?: (taskId: string) => void;
}

// Parse activity type from message content
export function parseActivityType(content: string): {
  type: string;
  emoji: string;
} | null {
  const activityPatterns: Record<string, { pattern: RegExp; emoji: string }> = {
    task_created: { pattern: /✨.*created task/, emoji: "✨" },
    task_completed: { pattern: /✅.*completed task/, emoji: "✅" },
    task_reopened: { pattern: /🔄.*reopened task/, emoji: "🔄" },
    task_status_changed: { pattern: /📋.*moved.*from.*to/, emoji: "📋" },
    task_assigned: { pattern: /👤.*assigned/, emoji: "👤" },
    task_unassigned: { pattern: /👤.*removed/, emoji: "👤" },
    task_priority_changed: { pattern: /🎯.*changed priority/, emoji: "🎯" },
    task_due_date: {
      pattern: /📅.*(set|changed|removed) due date/,
      emoji: "📅",
    },
    task_label: { pattern: /🏷️.*(added|removed) label/, emoji: "🏷️" },
    task_title_changed: { pattern: /✏️.*renamed task/, emoji: "✏️" },
    task_description_changed: {
      pattern: /📝.*updated description/,
      emoji: "📝",
    },
    subtask: { pattern: /☑️|✅.*checklist|⬜/, emoji: "☑️" },
    attachment: { pattern: /📎.*(attached|removed)/, emoji: "📎" },
  };

  for (const [type, { pattern, emoji }] of Object.entries(activityPatterns)) {
    if (pattern.test(content)) {
      return { type, emoji };
    }
  }
  return null;
}

// Extract task title from activity message
export function extractTaskInfo(content: string): {
  taskTitle: string | null;
  boardName: string | null;
} {
  // Match patterns like **Task Title** in the message
  const titleMatch = content.match(/\*\*([^*]+)\*\*(?!.*\*\*)/);
  const boardMatch = content.match(/Board:\s*([^\n]+)/);

  return {
    taskTitle: titleMatch ? titleMatch[1] : null,
    boardName: boardMatch ? boardMatch[1].trim() : null,
  };
}

// Priority colors
const priorityColors: Record<string, string> = {
  low: "border-gray-500 text-gray-400 bg-gray-500/10",
  medium: "border-yellow-500 text-yellow-400 bg-yellow-500/10",
  high: "border-orange-500 text-orange-400 bg-orange-500/10",
  urgent: "border-red-500 text-red-400 bg-red-500/10",
};

// Status colors
const statusColors: Record<string, string> = {
  backlog: "bg-gray-500",
  todo: "bg-blue-500",
  "in-progress": "bg-yellow-500",
  review: "bg-purple-500",
  done: "bg-green-500",
};

export function TaskActivityCard({
  taskId,
  taskTitle,
  activityType,
  boardName,
  task,
  onTaskClick,
}: TaskActivityCardProps) {
  const getActivityIcon = () => {
    switch (activityType) {
      case "task_created":
        return <CheckCircle2 size={14} className="text-emerald-400" />;
      case "task_completed":
        return <CheckCircle2 size={14} className="text-emerald-400" />;
      case "task_status_changed":
        return <Clock size={14} className="text-blue-400" />;
      case "task_assigned":
      case "task_unassigned":
        return <User size={14} className="text-purple-400" />;
      case "task_priority_changed":
        return <Tag size={14} className="text-orange-400" />;
      case "task_due_date":
        return <Calendar size={14} className="text-cyan-400" />;
      default:
        return <CheckCircle2 size={14} className="text-gray-400" />;
    }
  };

  const getActivityColor = () => {
    switch (activityType) {
      case "task_created":
        return "border-l-emerald-500";
      case "task_completed":
        return "border-l-green-500";
      case "task_status_changed":
        return "border-l-blue-500";
      case "task_assigned":
      case "task_unassigned":
        return "border-l-purple-500";
      case "task_priority_changed":
        return "border-l-orange-500";
      case "task_due_date":
        return "border-l-cyan-500";
      case "task_label":
        return "border-l-pink-500";
      default:
        return "border-l-gray-500";
    }
  };

  return (
    <button
      onClick={() => onTaskClick?.(taskId)}
      className={`mt-2 w-full max-w-md bg-[#2b2d31] rounded-lg border-l-4 ${getActivityColor()} hover:bg-[#35363c] transition-all duration-200 text-left group overflow-hidden`}
    >
      {/* Card Header */}
      <div className="px-3 py-2.5 flex items-start gap-3">
        {/* Activity Icon */}
        <div className="mt-0.5 p-1.5 bg-[#1e1f22] rounded-lg shrink-0">
          {getActivityIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Task Title */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-medium text-sm truncate">
              {taskTitle}
            </span>
            <ChevronRight
              size={14}
              className="text-gray-500 group-hover:text-gray-300 group-hover:translate-x-0.5 transition-all shrink-0"
            />
          </div>

          {/* Task Details */}
          {task && (
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 h-5 ${
                  priorityColors[task.priority] || priorityColors.medium
                }`}
              >
                {task.priority}
              </Badge>
              <div className="flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    statusColors[task.status] || "bg-gray-500"
                  }`}
                />
                <span className="text-[10px] text-gray-400 capitalize">
                  {task.status.replace("-", " ")}
                </span>
              </div>
              {task.assignee && (
                <div className="flex items-center gap-1">
                  <User size={10} className="text-gray-500" />
                  <span className="text-[10px] text-gray-400">
                    {task.assignee}
                  </span>
                </div>
              )}
              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar size={10} className="text-gray-500" />
                  <span className="text-[10px] text-gray-400">
                    {new Date(task.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Board Name */}
          {boardName && (
            <div className="text-[10px] text-gray-500">Board: {boardName}</div>
          )}
        </div>
      </div>

      {/* Hover hint */}
      <div className="px-3 py-1.5 bg-[#1e1f22] text-[10px] text-gray-500 group-hover:text-gray-400 transition-colors flex items-center gap-1">
        <span>Click to view task details</span>
      </div>
    </button>
  );
}

interface MessageEmbed {
  type: "task" | "link";
  task_id?: string;
  url?: string;
  title?: string;
  description?: string;
}

// Simple inline task card for activity messages
export function InlineTaskActivityCard({
  content,
  tasks,
  embeds,
  onTaskClick,
}: {
  content: string;
  tasks: Task[];
  embeds?: MessageEmbed[];
  onTaskClick: (task: Task) => void;
}) {
  const activity = parseActivityType(content);
  if (!activity) return null;

  const { taskTitle } = extractTaskInfo(content);
  if (!taskTitle) return null;

  // First try to find task from embed (most reliable)
  const taskEmbed = embeds?.find((e) => e.type === "task" && e.task_id);
  let task: Task | undefined;

  if (taskEmbed?.task_id) {
    task = tasks.find((t) => t.id === taskEmbed.task_id);
  }

  // Fall back to title match if no embed or task not found
  if (!task) {
    task = tasks.find(
      (t) => t.title === taskTitle || content.includes(t.title)
    );
  }

  if (!task) {
    // Still show the card even without full task data
    return (
      <div className="mt-2 max-w-md bg-[#2b2d31] rounded-lg border-l-4 border-l-[#5865f2] p-3">
        <div className="flex items-center gap-2 text-white text-sm font-medium">
          <span>{activity.emoji}</span>
          <span className="truncate">{taskTitle}</span>
        </div>
        <div className="text-[11px] text-gray-500 mt-1">
          Task activity detected
        </div>
      </div>
    );
  }

  return (
    <TaskActivityCard
      taskId={task.id}
      taskTitle={task.title}
      activityType={activity.type}
      task={task}
      onTaskClick={() => onTaskClick(task)}
    />
  );
}
