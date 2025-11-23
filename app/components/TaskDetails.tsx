"use client";

import {
  Calendar,
  Link2,
  MoreHorizontal,
  Paperclip,
  Tag,
  User,
  X,
} from "lucide-react";
import type { Task } from "../App";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

interface TaskDetailsProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetails({ task, onClose }: TaskDetailsProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="w-[480px] bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="h-14 px-6 flex items-center justify-between border-b">
        <span className="text-gray-500 text-sm">{task.id}</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Link2 size={18} />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreHorizontal size={18} />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-gray-900 text-xl mb-4">{task.title}</h2>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                <User size={16} />
                Assignee
              </label>
              <Select defaultValue={task.assignee || "unassigned"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  <SelectItem value="Sarah Chen">Sarah Chen</SelectItem>
                  <SelectItem value="Mike Johnson">Mike Johnson</SelectItem>
                  <SelectItem value="Alex Kim">Alex Kim</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">Status</label>
              <Select defaultValue={task.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                Priority
              </label>
              <Select defaultValue={task.priority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                <Calendar size={16} />
                Created
              </label>
              <div className="text-sm text-gray-900">{task.createdAt}</div>
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="text-sm text-gray-600 flex items-center gap-2 mb-2">
              <Tag size={16} />
              Labels
            </label>
            <div className="flex flex-wrap gap-2">
              {task.labels.map((label) => (
                <Badge key={label} variant="secondary">
                  {label}
                </Badge>
              ))}
              <Button variant="outline" size="sm" className="h-6">
                + Add label
              </Button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-gray-600 mb-2 block">
              Description
            </label>
            <p className="text-gray-700 text-sm mb-3">{task.description}</p>
            <Button variant="outline" size="sm">
              Edit Description
            </Button>
          </div>

          {/* Attachments */}
          <div>
            <label className="text-sm text-gray-600 flex items-center gap-2 mb-2">
              <Paperclip size={16} />
              Attachments
            </label>
            <Button variant="outline" size="sm" className="gap-2">
              <Paperclip size={16} />
              Add attachment
            </Button>
          </div>

          {/* Comments */}
          <div>
            <label className="text-sm text-gray-600 mb-3 block">
              Activity ({task.comments.length})
            </label>
            <div className="space-y-4">
              {task.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
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
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                </div>
              ))}

              {/* Add comment */}
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">JD</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea placeholder="Add a comment..." className="mb-2" />
                  <Button size="sm" className="bg-[#0052cc] hover:bg-[#0747a6]">
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
