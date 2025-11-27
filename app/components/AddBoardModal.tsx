"use client";
import { FileText, LayoutGrid, Palette } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

export interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  columns: { title: string; color: string }[];
}

interface AddBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBoard: (boardData: {
    name: string;
    description: string;
    color: string;
    columns: { title: string; color: string }[];
  }) => void;
}

const BOARD_COLORS = [
  { name: "Blue", value: "bg-blue-500", hex: "#3b82f6" },
  { name: "Purple", value: "bg-purple-500", hex: "#a855f7" },
  { name: "Pink", value: "bg-pink-500", hex: "#ec4899" },
  { name: "Red", value: "bg-red-500", hex: "#ef4444" },
  { name: "Orange", value: "bg-orange-500", hex: "#f97316" },
  { name: "Yellow", value: "bg-yellow-500", hex: "#eab308" },
  { name: "Green", value: "bg-green-500", hex: "#22c55e" },
  { name: "Teal", value: "bg-teal-500", hex: "#14b8a6" },
  { name: "Cyan", value: "bg-cyan-500", hex: "#06b6d4" },
  { name: "Indigo", value: "bg-indigo-500", hex: "#6366f1" },
  { name: "Violet", value: "bg-violet-500", hex: "#8b5cf6" },
  { name: "Fuchsia", value: "bg-fuchsia-500", hex: "#d946ef" },
];

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: "custom",
    name: "Custom Board",
    description: "Start with an empty board",
    icon: "✨",
    columns: [],
  },
  {
    id: "basic",
    name: "Basic Board",
    description: "Simple 3-column workflow",
    icon: "📋",
    columns: [
      { title: "To Do", color: "bg-gray-400" },
      { title: "In Progress", color: "bg-yellow-400" },
      { title: "Done", color: "bg-green-400" },
    ],
  },
  {
    id: "kanban",
    name: "Kanban Board",
    description: "Classic 5-stage workflow",
    icon: "📊",
    columns: [
      { title: "Backlog", color: "bg-gray-400" },
      { title: "To Do", color: "bg-blue-400" },
      { title: "In Progress", color: "bg-yellow-400" },
      { title: "Review", color: "bg-purple-400" },
      { title: "Done", color: "bg-green-400" },
    ],
  },
  {
    id: "sprint",
    name: "Sprint Board",
    description: "Agile development workflow",
    icon: "🚀",
    columns: [
      { title: "Sprint Backlog", color: "bg-gray-400" },
      { title: "In Development", color: "bg-blue-400" },
      { title: "Code Review", color: "bg-orange-400" },
      { title: "Testing", color: "bg-yellow-400" },
      { title: "Done", color: "bg-green-400" },
    ],
  },
  {
    id: "bugs",
    name: "Bug Tracker",
    description: "Track and fix issues",
    icon: "🐛",
    columns: [
      { title: "Reported", color: "bg-red-400" },
      { title: "Triaging", color: "bg-orange-400" },
      { title: "In Progress", color: "bg-blue-400" },
      { title: "Testing", color: "bg-yellow-400" },
      { title: "Resolved", color: "bg-green-400" },
    ],
  },
  {
    id: "content",
    name: "Content Pipeline",
    description: "Content creation workflow",
    icon: "✍️",
    columns: [
      { title: "Ideas", color: "bg-purple-400" },
      { title: "Drafting", color: "bg-blue-400" },
      { title: "Editing", color: "bg-yellow-400" },
      { title: "Published", color: "bg-green-400" },
    ],
  },
];

export function AddBoardModal({
  isOpen,
  onClose,
  onCreateBoard,
}: AddBoardModalProps) {
  const [step, setStep] = useState<"template" | "customize">("template");
  const [selectedTemplate, setSelectedTemplate] = useState(BOARD_TEMPLATES[1]); // Default to Basic Board
  const [boardName, setBoardName] = useState("");
  const [boardDescription, setBoardDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(BOARD_COLORS[0].value);

  const handleClose = () => {
    setStep("template");
    setSelectedTemplate(BOARD_TEMPLATES[1]);
    setBoardName("");
    setBoardDescription("");
    setSelectedColor(BOARD_COLORS[0].value);
    onClose();
  };

  const handleTemplateSelect = (template: BoardTemplate) => {
    setSelectedTemplate(template);
    setStep("customize");
  };

  const handleCreate = () => {
    if (!boardName.trim()) {
      alert("Please enter a board name");
      return;
    }

    onCreateBoard({
      name: boardName.trim(),
      description: boardDescription.trim(),
      color: selectedColor,
      columns: selectedTemplate.columns,
    });

    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-[#313338] border-[#1e1f22] text-white p-0">
        {step === "template" ? (
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="flex items-center gap-3 text-xl text-white">
                <div className="w-10 h-10 rounded-lg bg-[#5865f2] flex items-center justify-center">
                  <LayoutGrid className="text-white" size={20} />
                </div>
                Create New Board
              </DialogTitle>
              <DialogDescription className="text-gray-400 mt-2">
                Choose a template to get started or create a custom board
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {BOARD_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`flex flex-col items-center p-4 rounded-xl transition-all text-center group ${
                    template.id === "custom"
                      ? "bg-[#1e1f22] border-2 border-dashed border-[#404249] hover:border-[#5865f2] hover:bg-[#2b2d31]"
                      : "bg-[#2b2d31] border border-[#404249] hover:border-[#5865f2] hover:bg-[#383a40]"
                  }`}
                >
                  <div className="text-3xl mb-2">{template.icon}</div>
                  <h3 className="font-medium text-sm text-gray-200 group-hover:text-white mb-1">
                    {template.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    {template.description}
                  </p>
                  {template.columns.length > 0 && (
                    <div className="flex gap-1 justify-center flex-wrap">
                      {template.columns.slice(0, 3).map((col, idx) => (
                        <span
                          key={idx}
                          className={`w-2 h-2 rounded-full ${col.color}`}
                          title={col.title}
                        />
                      ))}
                      {template.columns.length > 3 && (
                        <span className="text-[10px] text-gray-500">
                          +{template.columns.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  {template.id === "custom" && (
                    <span className="text-[10px] text-gray-500 mt-1">
                      No lists
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Header with color preview */}
            <div
              className={`h-24 ${selectedColor} relative rounded-t-lg`}
              style={{ borderRadius: "8px 8px 0 0" }}
            >
              <div className="absolute inset-0 bg-black/20 flex items-end p-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedTemplate.icon}</span>
                  <div>
                    <p className="text-white/80 text-xs font-medium">
                      {selectedTemplate.name}
                    </p>
                    <p className="text-white text-lg font-semibold truncate max-w-[300px]">
                      {boardName || "Untitled Board"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Board Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="board-name"
                  className="text-xs font-semibold uppercase tracking-wide text-gray-400"
                >
                  Board Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="board-name"
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  placeholder="e.g., Project Alpha"
                  className="bg-[#1e1f22] border-none text-white placeholder:text-gray-500 h-11 focus-visible:ring-[#5865f2]"
                  autoFocus
                />
              </div>

              {/* Board Description */}
              <div className="space-y-2">
                <Label
                  htmlFor="board-description"
                  className="text-xs font-semibold uppercase tracking-wide text-gray-400"
                >
                  Description
                </Label>
                <Textarea
                  id="board-description"
                  value={boardDescription}
                  onChange={(e) => setBoardDescription(e.target.value)}
                  placeholder="What's this board for?"
                  rows={2}
                  className="resize-none bg-[#1e1f22] border-none text-white placeholder:text-gray-500 focus-visible:ring-[#5865f2]"
                />
              </div>

              {/* Board Color */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-2">
                  <Palette size={14} />
                  Color Theme
                </Label>
                <div className="grid grid-cols-6 gap-2">
                  {BOARD_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedColor(color.value)}
                      className={`relative h-9 rounded-lg transition-all ${
                        color.value
                      } ${
                        selectedColor === color.value
                          ? "ring-2 ring-offset-2 ring-offset-[#313338] ring-white scale-110"
                          : "hover:scale-105 opacity-80 hover:opacity-100"
                      }`}
                      title={color.name}
                    >
                      {selectedColor === color.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white drop-shadow-md"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lists Preview */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-2">
                  <FileText size={14} />
                  Lists ({selectedTemplate.columns.length})
                </Label>
                <div className="bg-[#1e1f22] rounded-lg p-3">
                  {selectedTemplate.columns.length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                      {selectedTemplate.columns.map((col, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-3 py-1.5 bg-[#2b2d31] rounded-md"
                        >
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${col.color}`}
                          />
                          <span className="text-sm text-gray-300">
                            {col.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-2">
                      No lists — you can add them after creating the board
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep("template")}
                  className="flex-1 text-gray-300 hover:text-white hover:bg-[#404249]"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleCreate}
                  disabled={!boardName.trim()}
                  className="flex-1 bg-[#5865f2] hover:bg-[#4752c4] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Board
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
