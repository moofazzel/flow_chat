"use client";

import { X } from "lucide-react";

export interface Label {
  id: string;
  name: string;
  color: string;
  textColor?: string;
  boardId?: string;
}

interface LabelBadgeProps {
  label: string | Label; // Can be label ID (string) or full Label object
  boardLabels?: Label[]; // Board's label definitions (for lookup)
  removable?: boolean;
  onRemove?: () => void;
  size?: "sm" | "md";
}

export function LabelBadge({
  label,
  boardLabels = [],
  removable = false,
  onRemove,
  size = "md",
}: LabelBadgeProps) {
  const sizeClasses =
    size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";

  // If label is a string (ID), look it up in boardLabels
  const labelObj: Label =
    typeof label === "string"
      ? boardLabels.find((l) => l.id === label) || {
          id: label,
          name: label,
          color: "bg-gray-500",
        }
      : label;

  return (
    <span
      className={`inline-flex items-center gap-1 ${sizeClasses} rounded font-medium ${labelObj.color} text-white transition-all`}
    >
      {labelObj.name}
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}
