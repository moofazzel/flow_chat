"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Bug,
  Calendar,
  CheckCircle2,
  Target,
  User,
} from "lucide-react";
import { Task } from "../page";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";

interface TaskMentionPreviewProps {
  task: Task;
  onClick?: () => void;
  compact?: boolean;
}

const issueTypeConfig = {
  task: {
    icon: CheckCircle2,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    label: "Task",
  },
  story: {
    icon: BookOpen,
    color: "text-green-500",
    bg: "bg-green-500/10",
    label: "Story",
  },
  bug: { icon: Bug, color: "text-red-500", bg: "bg-red-500/10", label: "Bug" },
  epic: {
    icon: Target,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    label: "Epic",
  },
};

const priorityConfig = {
  low: { color: "bg-gray-500", label: "Low" },
  medium: { color: "bg-blue-500", label: "Medium" },
  high: { color: "bg-orange-500", label: "High" },
  urgent: { color: "bg-red-500", label: "Urgent" },
};

const statusConfig = {
  backlog: { color: "text-gray-400", label: "Backlog" },
  todo: { color: "text-blue-400", label: "To Do" },
  "in-progress": { color: "text-yellow-400", label: "In Progress" },
  review: { color: "text-purple-400", label: "Review" },
  done: { color: "text-green-400", label: "Done" },
};

export function TaskMentionPreview({
  task,
  onClick,
  compact = false,
}: TaskMentionPreviewProps) {
  const issueType = task.issueType || "task";
  const config =
    issueTypeConfig[issueType as keyof typeof issueTypeConfig] ||
    issueTypeConfig.task;
  const Icon = config.icon;

  const priorityColor =
    priorityConfig[task.priority]?.color || priorityConfig.medium.color;
  const statusInfo =
    statusConfig[task.status as keyof typeof statusConfig] || statusConfig.todo;

  if (compact) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#2b2d31] hover:bg-[#404249] border border-[#1e1f22] transition-colors"
      >
        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
        <span className="text-xs font-medium text-white">{task.id}</span>
        <span className="text-xs text-gray-400 max-w-[200px] truncate">
          {task.title}
        </span>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="bg-[#2b2d31] border-[#1e1f22] hover:border-[#404249] transition-all cursor-pointer group"
        onClick={onClick}
      >
        <div className="p-3 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className={`p-1.5 rounded ${config.bg}`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">
                    {task.id}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-xs border-[#1e1f22] text-gray-400"
                  >
                    {config.label}
                  </Badge>
                </div>
                <h4 className="text-sm text-white font-medium truncate group-hover:text-[#5865f2] transition-colors">
                  {task.title}
                </h4>
              </div>
            </div>

            {/* Priority Indicator */}
            <div
              className={`w-2 h-2 rounded-full ${priorityColor} shrink-0 mt-1.5`}
              title={priorityConfig[task.priority]?.label}
            />
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-gray-400 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {/* Status */}
            <div className="flex items-center gap-1">
              <div
                className={`w-1.5 h-1.5 rounded-full ${statusInfo.color.replace(
                  "text-",
                  "bg-"
                )}`}
              />
              <span className={statusInfo.color}>{statusInfo.label}</span>
            </div>

            {/* Assignee */}
            {task.assignee && (
              <>
                <span className="text-gray-600">•</span>
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{task.assignee}</span>
                </div>
              </>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <>
                <span className="text-gray-600">•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              </>
            )}

            {/* Labels */}
            {task.labels && task.labels.length > 0 && (
              <>
                <span className="text-gray-600">•</span>
                <div className="flex items-center gap-1">
                  <span>
                    {task.labels.length} label
                    {task.labels.length > 1 ? "s" : ""}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Inline compact version for use within text
export function InlineTaskMention({
  taskId,
  onClick,
}: {
  taskId: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#5865f2]/20 hover:bg-[#5865f2]/30 border border-[#5865f2]/30 transition-colors"
    >
      <CheckCircle2 className="w-3 h-3 text-[#5865f2]" />
      <span className="text-xs font-medium text-[#5865f2]">{taskId}</span>
    </motion.button>
  );
}
