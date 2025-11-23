"use client";

import { Keyboard } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Navigation
  { keys: ["C"], description: "Switch to Chat view", category: "Navigation" },
  { keys: ["B"], description: "Switch to Board view", category: "Navigation" },
  { keys: ["D"], description: "Switch to DM view", category: "Navigation" },
  { keys: ["S"], description: "Focus search", category: "Navigation" },
  {
    keys: ["?"],
    description: "Show keyboard shortcuts",
    category: "Navigation",
  },
  { keys: ["Esc"], description: "Close modal/dialog", category: "Navigation" },

  // Task Actions
  { keys: ["N"], description: "Create new task", category: "Tasks" },
  { keys: ["E"], description: "Edit selected task", category: "Tasks" },
  { keys: ["Del"], description: "Delete selected task", category: "Tasks" },
  { keys: ["Ctrl", "D"], description: "Duplicate task", category: "Tasks" },
  { keys: ["A"], description: "Archive task", category: "Tasks" },

  // Board Actions
  { keys: ["L"], description: "Open label manager", category: "Board" },
  { keys: ["F"], description: "Toggle filters", category: "Board" },
  { keys: ["Ctrl", "K"], description: "Quick command", category: "Board" },

  // Priority
  { keys: ["1"], description: "Set priority: Low", category: "Priority" },
  { keys: ["2"], description: "Set priority: Medium", category: "Priority" },
  { keys: ["3"], description: "Set priority: High", category: "Priority" },
  { keys: ["4"], description: "Set priority: Urgent", category: "Priority" },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Check if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Show shortcuts with ? key
      if (e.key === "?" && !isTyping && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen(true);
      }

      // Close with Escape
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [open]);

  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-50 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-all hover:scale-110 group"
        title="Keyboard shortcuts (?)"
      >
        <Keyboard size={20} />
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Press ? for shortcuts
        </span>
      </button>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard size={20} />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Boost your productivity with these shortcuts
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 space-y-6 pr-2">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="font-semibold text-sm text-gray-700 mb-2 sticky top-0 bg-white py-1">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts
                    .filter((s) => s.category === category)
                    .map((shortcut, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-sm text-gray-700">
                          {shortcut.description}
                        </span>
                        <div className="flex gap-1">
                          {shortcut.keys.map((key, keyIdx) => (
                            <kbd
                              key={keyIdx}
                              className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono shadow-sm"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t text-center text-sm text-gray-500">
            Press{" "}
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
              Esc
            </kbd>{" "}
            or{" "}
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
              ?
            </kbd>{" "}
            to close
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
