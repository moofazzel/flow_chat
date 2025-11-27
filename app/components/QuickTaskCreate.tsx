"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Bug, CheckCircle2, Circle, Target, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface QuickTaskData {
  title: string;
  description: string;
  issueType: "story" | "task" | "bug" | "epic";
  priority: "low" | "medium" | "high" | "urgent";
  status: "backlog" | "todo" | "in-progress" | "review" | "done";
  assignee?: string;
  labels: string[];
  sourceMessageId?: string;
  sourceMessageContent?: string;
  sourceMessageAuthor?: string;
}

interface QuickTaskCreateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (taskData: QuickTaskData) => void;
  prefilledData?: Partial<QuickTaskData>;
  boardId?: string;
}

const issueTypes = [
  { value: "task", label: "Task", icon: CheckCircle2, color: "text-blue-500" },
  { value: "story", label: "Story", icon: BookOpen, color: "text-green-500" },
  { value: "bug", label: "Bug", icon: Bug, color: "text-red-500" },
  { value: "epic", label: "Epic", icon: Target, color: "text-purple-500" },
] as const;

const priorities = [
  { value: "low", label: "Low", color: "bg-gray-500" },
  { value: "medium", label: "Medium", color: "bg-blue-500" },
  { value: "high", label: "High", color: "bg-orange-500" },
  { value: "urgent", label: "Urgent", color: "bg-red-500" },
] as const;

export function QuickTaskCreate({
  open,
  onOpenChange,
  onCreateTask,
  prefilledData,
  boardId,
}: QuickTaskCreateProps) {
  const [title, setTitle] = useState(prefilledData?.title || "");
  const [description, setDescription] = useState(
    prefilledData?.description || ""
  );
  const [issueType, setIssueType] = useState<QuickTaskData["issueType"]>(
    prefilledData?.issueType || "task"
  );
  const [priority, setPriority] = useState<QuickTaskData["priority"]>(
    prefilledData?.priority || "medium"
  );
  const [status, setStatus] = useState<QuickTaskData["status"]>(
    prefilledData?.status || "todo"
  );

  const handleCreate = () => {
    if (!title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    const taskData: QuickTaskData = {
      title: title.trim(),
      description: description.trim(),
      issueType,
      priority,
      status,
      labels: [],
      sourceMessageId: prefilledData?.sourceMessageId,
      sourceMessageContent: prefilledData?.sourceMessageContent,
      sourceMessageAuthor: prefilledData?.sourceMessageAuthor,
    };

    onCreateTask(taskData);

    // Reset form
    setTitle("");
    setDescription("");
    setIssueType("task");
    setPriority("medium");
    setStatus("todo");

    onOpenChange(false);
    toast.success("Task created successfully!");
  };

  const selectedIssueType = issueTypes.find((t) => t.value === issueType);
  const IssueIcon = selectedIssueType?.icon || Circle;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[#313338] border-[#1e1f22]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Quick Create Task
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a task from this message quickly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Source Message Preview */}
          {prefilledData?.sourceMessageContent && (
            <div className="bg-[#2b2d31] rounded-lg p-3 border border-[#1e1f22]">
              <div className="text-xs text-gray-400 mb-1">
                From message by {prefilledData.sourceMessageAuthor}:
              </div>
              <div className="text-sm text-gray-300 line-clamp-2">
                {prefilledData.sourceMessageContent}
              </div>
            </div>
          )}

          {/* Issue Type */}
          <div className="space-y-2">
            <Label htmlFor="issue-type" className="text-gray-300">
              Issue Type
            </Label>
            <Select
              value={issueType}
              onValueChange={(value) =>
                setIssueType(value as QuickTaskData["issueType"])
              }
            >
              <SelectTrigger className="bg-[#1e1f22] border-[#1e1f22] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2b2d31] border-[#1e1f22]">
                {issueTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem
                      key={type.value}
                      value={type.value}
                      className="text-white hover:bg-[#404249]"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${type.color}`} />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-300">
              Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              className="bg-[#1e1f22] border-[#1e1f22] text-white placeholder:text-gray-500"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-300">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              className="bg-[#1e1f22] border-[#1e1f22] text-white placeholder:text-gray-500 min-h-[100px]"
            />
          </div>

          {/* Priority and Status Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-gray-300">
                Priority
              </Label>
              <Select
                value={priority}
                onValueChange={(value) =>
                  setPriority(value as QuickTaskData["priority"])
                }
              >
                <SelectTrigger className="bg-[#1e1f22] border-[#1e1f22] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2b2d31] border-[#1e1f22]">
                  {priorities.map((p) => (
                    <SelectItem
                      key={p.value}
                      value={p.value}
                      className="text-white hover:bg-[#404249]"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${p.color}`} />
                        <span>{p.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-gray-300">
                Status
              </Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as QuickTaskData["status"])
                }
              >
                <SelectTrigger className="bg-[#1e1f22] border-[#1e1f22] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2b2d31] border-[#1e1f22]">
                  <SelectItem
                    value="backlog"
                    className="text-white hover:bg-[#404249]"
                  >
                    Backlog
                  </SelectItem>
                  <SelectItem
                    value="todo"
                    className="text-white hover:bg-[#404249]"
                  >
                    To Do
                  </SelectItem>
                  <SelectItem
                    value="in-progress"
                    className="text-white hover:bg-[#404249]"
                  >
                    In Progress
                  </SelectItem>
                  <SelectItem
                    value="review"
                    className="text-white hover:bg-[#404249]"
                  >
                    Review
                  </SelectItem>
                  <SelectItem
                    value="done"
                    className="text-white hover:bg-[#404249]"
                  >
                    Done
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-white hover:bg-[#404249]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            className="bg-[#5865f2] hover:bg-[#4752c4] text-white"
          >
            <IssueIcon className="w-4 h-4 mr-2" />
            Create {selectedIssueType?.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
