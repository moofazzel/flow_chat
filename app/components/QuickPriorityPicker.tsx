"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

type Priority = "low" | "medium" | "high" | "urgent";

interface QuickPriorityPickerProps {
  currentPriority: Priority;
  onPriorityChange: (priority: Priority) => void;
  size?: "sm" | "md" | "lg";
}

const priorityConfig = {
  urgent: {
    label: "Urgent",
    color: "text-red-600",
    bgColor: "bg-red-50 hover:bg-red-100",
    borderColor: "border-red-500",
    icon: "🔥",
  },
  high: {
    label: "High",
    color: "text-orange-600",
    bgColor: "bg-orange-50 hover:bg-orange-100",
    borderColor: "border-orange-500",
    icon: "⬆️",
  },
  medium: {
    label: "Medium",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50 hover:bg-yellow-100",
    borderColor: "border-yellow-600",
    icon: "➡️",
  },
  low: {
    label: "Low",
    color: "text-gray-600",
    bgColor: "bg-gray-50 hover:bg-gray-100",
    borderColor: "border-gray-400",
    icon: "⬇️",
  },
};

export function QuickPriorityPicker({
  currentPriority,
  onPriorityChange,
  size = "md",
}: QuickPriorityPickerProps) {
  const current = priorityConfig[currentPriority];

  const sizeClasses = {
    sm: "text-xs px-2 py-1 h-7",
    md: "text-sm px-3 py-1.5 h-8",
    lg: "text-base px-4 py-2 h-10",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`${sizeClasses[size]} ${current.bgColor} ${current.borderColor} border gap-2 font-medium ${current.color}`}
        >
          <span>{current.icon}</span>
          <span>{current.label}</span>
          <ChevronDown size={14} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-40 bg-[#2b2d31] border-[#1e1f22]"
      >
        {(
          Object.entries(priorityConfig) as [
            Priority,
            (typeof priorityConfig)[Priority]
          ][]
        ).map(([priority, config]) => (
          <DropdownMenuItem
            key={priority}
            onClick={() => onPriorityChange(priority)}
            className={`${config.bgColor} ${config.color} cursor-pointer mb-1 last:mb-0`}
          >
            <span className="mr-2">{config.icon}</span>
            <span className="font-medium">{config.label}</span>
            {priority === currentPriority && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
