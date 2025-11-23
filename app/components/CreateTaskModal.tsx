"use client";

import { AlertCircle, Calendar, MessageSquare, Tag, User } from "lucide-react";

import { useState } from "react";
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
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (task: NewTaskData) => void;
  prefilledData?: {
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
  };
}

export interface NewTaskData {
  title: string;
  description: string;
  status: "backlog" | "todo" | "in-progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  assignee?: string;
  labels: string[];
  sourceMessageId?: string;
}

const availableAssignees = [
  { id: "u1", name: "Sarah Chen", avatar: "SC" },
  { id: "u2", name: "Mike Johnson", avatar: "MJ" },
  { id: "u3", name: "Alex Kim", avatar: "AK" },
  { id: "u4", name: "John Doe", avatar: "JD" },
  { id: "unassigned", name: "Unassigned", avatar: "?" },
];

const availableLabels = [
  { id: "frontend", name: "Frontend", color: "bg-blue-500" },
  { id: "backend", name: "Backend", color: "bg-green-500" },
  { id: "bug", name: "Bug", color: "bg-red-500" },
  { id: "feature", name: "Feature", color: "bg-purple-500" },
  { id: "design", name: "Design", color: "bg-pink-500" },
  { id: "docs", name: "Documentation", color: "bg-yellow-500" },
];

export function CreateTaskModal({
  isOpen,
  onClose,
  onCreateTask,
  prefilledData,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState(prefilledData?.title || "");
  const [description, setDescription] = useState(
    prefilledData?.description || ""
  );
  const [priority, setPriority] = useState<
    "low" | "medium" | "high" | "urgent"
  >(prefilledData?.priority || "medium");
  const [assignee, setAssignee] = useState<string>(
    prefilledData?.assignee || "unassigned"
  );
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [status, setStatus] = useState<
    "backlog" | "todo" | "in-progress" | "review" | "done"
  >("todo");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a task title");
      return;
    }

    onCreateTask({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assignee: assignee === "unassigned" ? undefined : assignee,
      labels: selectedLabels,
      sourceMessageId: prefilledData?.sourceMessage?.id,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setPriority("medium");
    setAssignee("unassigned");
    setSelectedLabels([]);
    setStatus("todo");
    onClose();
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId)
        ? prev.filter((l) => l !== labelId)
        : [...prev, labelId]
    );
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "urgent":
        return "text-red-500";
      case "high":
        return "text-orange-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-green-500";
      default:
        return "text-gray-400";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#2b2d31] border-[#1e1f22] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#5865f2]" />
            Create New Task
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Add a new task to your project board.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Source Message Reference */}
          {prefilledData?.sourceMessage && (
            <div className="bg-[#1e1f22] rounded-lg p-3 border border-[#5865f2]/30">
              <div className="flex items-start gap-2 text-sm">
                <MessageSquare className="w-4 h-4 text-[#5865f2] mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-400">
                      Created from message by
                    </span>
                    <span className="font-medium text-white">
                      {prefilledData.sourceMessage.author}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {prefilledData.sourceMessage.timestamp}
                    </span>
                  </div>
                  <p className="text-gray-300 text-xs line-clamp-2">
                    {prefilledData.sourceMessage.content}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Task Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              className="bg-[#1e1f22] border-[#1e1f22] text-white placeholder:text-gray-500"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={4}
              className="bg-[#1e1f22] border-[#1e1f22] text-white placeholder:text-gray-500 resize-none"
            />
          </div>

          {/* Priority & Status Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Priority
              </label>
              <Select
                value={priority}
                onValueChange={(v: "low" | "medium" | "high" | "urgent") =>
                  setPriority(v)
                }
              >
                <SelectTrigger className="bg-[#1e1f22] border-[#1e1f22] text-white">
                  <SelectValue>
                    <span className={getPriorityColor(priority)}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#2b2d31] border-[#1e1f22]">
                  <SelectItem value="urgent" className="text-red-500">
                    🔴 Urgent
                  </SelectItem>
                  <SelectItem value="high" className="text-orange-500">
                    🟠 High
                  </SelectItem>
                  <SelectItem value="medium" className="text-yellow-500">
                    🟡 Medium
                  </SelectItem>
                  <SelectItem value="low" className="text-green-500">
                    🟢 Low
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Initial Status
              </label>
              <Select
                value={status}
                onValueChange={(
                  v: "backlog" | "todo" | "in-progress" | "review" | "done"
                ) => setStatus(v)}
              >
                <SelectTrigger className="bg-[#1e1f22] border-[#1e1f22] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2b2d31] border-[#1e1f22]">
                  <SelectItem value="backlog">📋 Backlog</SelectItem>
                  <SelectItem value="todo">📝 To Do</SelectItem>
                  <SelectItem value="in-progress">🔄 In Progress</SelectItem>
                  <SelectItem value="review">👀 Review</SelectItem>
                  <SelectItem value="done">✅ Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-1">
              <User className="w-4 h-4" />
              Assignee
            </label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger className="bg-[#1e1f22] border-[#1e1f22] text-white">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-5 h-5">
                      <AvatarFallback className="text-xs bg-[#5865f2]">
                        {
                          availableAssignees.find((a) => a.id === assignee)
                            ?.avatar
                        }
                      </AvatarFallback>
                    </Avatar>
                    {availableAssignees.find((a) => a.id === assignee)?.name}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#2b2d31] border-[#1e1f22]">
                {availableAssignees.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="text-xs bg-[#5865f2]">
                          {user.avatar}
                        </AvatarFallback>
                      </Avatar>
                      {user.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-1">
              <Tag className="w-4 h-4" />
              Labels
            </label>
            <div className="flex flex-wrap gap-2">
              {availableLabels.map((label) => (
                <Badge
                  key={label.id}
                  variant={
                    selectedLabels.includes(label.id) ? "default" : "outline"
                  }
                  className={`cursor-pointer transition-all ${
                    selectedLabels.includes(label.id)
                      ? `${label.color} hover:opacity-80`
                      : "border-gray-600 text-gray-400 hover:border-gray-500"
                  }`}
                  onClick={() => toggleLabel(label.id)}
                >
                  {label.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-[#1e1f22]">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#5865f2] hover:bg-[#4752c4] text-white"
            >
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
