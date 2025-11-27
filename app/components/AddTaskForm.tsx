"use client";

import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

interface AddTaskFormProps {
  columnId: string;
  boardId: string;
  onAdd: (taskData: {
    title: string;
    description: string;
    columnId: string;
    boardId: string;
  }) => void;
  onCancel: () => void;
}

export function AddTaskForm({
  columnId,
  boardId,
  onAdd,
  onCancel,
}: AddTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showFullForm, setShowFullForm] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, []);

  const handleAdd = () => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      toast.error("Task title is required");
      return;
    }

    if (trimmedTitle.length > 200) {
      toast.error("Task title too long (max 200 characters)");
      return;
    }

    onAdd({
      title: trimmedTitle,
      description: description.trim(),
      columnId,
      boardId,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setShowFullForm(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!showFullForm) {
        // If just title, add task immediately
        handleAdd();
      }
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="bg-[#1e1f22] rounded-lg p-3 shadow-md border-2 border-[#5865f2] space-y-2">
      <Input
        ref={titleInputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter task title..."
        className="bg-[#2b2d31] border-[#404249] text-white placeholder:text-gray-500"
      />

      {showFullForm && (
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add description (optional)..."
          className="bg-[#2b2d31] border-[#404249] text-white placeholder:text-gray-500 resize-none"
          rows={3}
        />
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleAdd}
          size="sm"
          className="flex-1 gap-1 bg-[#5865f2] hover:bg-[#4752c4]"
        >
          <Check size={14} />
          Add Task
        </Button>
        {!showFullForm && (
          <Button
            onClick={() => setShowFullForm(true)}
            size="sm"
            variant="outline"
            className="border-[#404249] text-gray-300 hover:bg-[#404249]"
          >
            More Details
          </Button>
        )}
        <Button
          onClick={onCancel}
          size="sm"
          variant="outline"
          className="border-[#404249] text-gray-300 hover:bg-[#404249]"
        >
          <X size={14} />
        </Button>
      </div>
    </div>
  );
}
