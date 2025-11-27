"use client";

import { Check, Edit2, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Label } from "./LabelBadge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";

interface LabelManagerProps {
  labels: Label[];
  onAddLabel: (name: string, color: string) => void;
  onEditLabel: (labelId: string, name: string, color: string) => void;
  onDeleteLabel: (labelId: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LABEL_COLORS = [
  { name: "Red", value: "bg-red-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Yellow", value: "bg-yellow-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Teal", value: "bg-teal-500" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Indigo", value: "bg-indigo-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Pink", value: "bg-pink-500" },
  { name: "Gray", value: "bg-gray-500" },
];

export function LabelManager({
  labels,
  onAddLabel,
  onEditLabel,
  onDeleteLabel,
  open,
  onOpenChange,
}: LabelManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("bg-blue-500");
  const [editLabelName, setEditLabelName] = useState("");
  const [editLabelColor, setEditLabelColor] = useState("");

  const handleCreate = () => {
    if (newLabelName.trim()) {
      onAddLabel(newLabelName.trim(), newLabelColor);
      setNewLabelName("");
      setNewLabelColor("bg-blue-500");
      setIsCreating(false);
    }
  };

  const handleEdit = (labelId: string) => {
    if (editLabelName.trim()) {
      onEditLabel(labelId, editLabelName.trim(), editLabelColor);
      setEditingId(null);
      setEditLabelName("");
      setEditLabelColor("");
    }
  };

  const startEdit = (label: Label) => {
    setEditingId(label.id);
    setEditLabelName(label.name);
    setEditLabelColor(label.color);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditLabelName("");
    setEditLabelColor("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#2b2d31] border-[#1e1f22]">
        <DialogHeader>
          <DialogTitle className="text-white">Manage Labels</DialogTitle>
          <DialogDescription className="text-gray-400">
            Create and organize labels for your tasks
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {/* Existing Labels */}
          {labels.map((label) => (
            <div
              key={label.id}
              className="flex items-center gap-2 p-2 bg-[#1e1f22] rounded-lg"
            >
              {editingId === label.id ? (
                <>
                  <div className="flex-1 flex gap-2">
                    <Input
                      value={editLabelName}
                      onChange={(e) => setEditLabelName(e.target.value)}
                      placeholder="Label name"
                      className="flex-1 bg-[#313338] border-[#404249] text-white"
                      autoFocus
                    />
                    <select
                      value={editLabelColor}
                      onChange={(e) => setEditLabelColor(e.target.value)}
                      className="px-2 py-1 border rounded bg-[#313338] border-[#404249] text-gray-200"
                    >
                      {LABEL_COLORS.map((color) => (
                        <option key={color.value} value={color.value}>
                          {color.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(label.id)}
                    className="h-8 w-8 p-0 hover:bg-[#404249]"
                  >
                    <Check size={16} className="text-[#57f287]" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={cancelEdit}
                    className="h-8 w-8 p-0 hover:bg-[#404249]"
                  >
                    <X size={16} className="text-[#ed4245]" />
                  </Button>
                </>
              ) : (
                <>
                  <span
                    className={`${label.color} text-white px-3 py-1 rounded font-medium text-sm flex-1`}
                  >
                    {label.name}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(label)}
                    className="h-8 w-8 p-0 hover:bg-[#404249]"
                  >
                    <Edit2 size={16} className="text-gray-400" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteLabel(label.id)}
                    className="h-8 w-8 p-0 hover:bg-[#404249]"
                  >
                    <Trash2 size={16} className="text-[#ed4245]" />
                  </Button>
                </>
              )}
            </div>
          ))}

          {/* Create New Label */}
          {isCreating ? (
            <div className="flex items-center gap-2 p-2 bg-[#5865f2]/10 rounded-lg border-2 border-[#5865f2]/30">
              <Input
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Label name"
                className="flex-1 bg-[#1e1f22] border-[#404249] text-white"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") {
                    setIsCreating(false);
                    setNewLabelName("");
                  }
                }}
              />
              <select
                value={newLabelColor}
                onChange={(e) => setNewLabelColor(e.target.value)}
                className="px-2 py-1 border rounded bg-[#1e1f22] border-[#404249] text-gray-200"
              >
                {LABEL_COLORS.map((color) => (
                  <option key={color.value} value={color.value}>
                    {color.name}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCreate}
                className="h-8 w-8 p-0 hover:bg-[#404249]"
              >
                <Check size={16} className="text-[#57f287]" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsCreating(false);
                  setNewLabelName("");
                }}
                className="h-8 w-8 p-0 hover:bg-[#404249]"
              >
                <X size={16} className="text-[#ed4245]" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2 border-dashed bg-[#1e1f22] border-[#404249] text-gray-200 hover:bg-[#404249] hover:text-white"
              onClick={() => setIsCreating(true)}
            >
              <Plus size={16} />
              Create Label
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
