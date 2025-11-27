"use client";

import { Check, LayoutList, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface AddListButtonProps {
  onAdd: (columnName: string) => void;
  existingNames: string[];
  maxColumns?: number;
  currentCount: number;
  isEmpty?: boolean;
}

const QUICK_LIST_SUGGESTIONS = [
  "To Do",
  "In Progress",
  "Done",
  "Backlog",
  "Review",
  "Testing",
];

export function AddListButton({
  onAdd,
  existingNames,
  maxColumns = 10,
  currentCount,
  isEmpty = false,
}: AddListButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [columnName, setColumnName] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isMaxReached = currentCount >= maxColumns;

  // Filter out already existing names from suggestions
  const availableSuggestions = QUICK_LIST_SUGGESTIONS.filter(
    (name) =>
      !existingNames.some(
        (existing) => existing.toLowerCase() === name.toLowerCase()
      )
  );

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleAdd = (name?: string) => {
    const trimmedName = (name || columnName).trim();

    // Validation
    if (!trimmedName) {
      setError("List name cannot be empty");
      return;
    }

    if (
      existingNames.some(
        (existingName) =>
          existingName.toLowerCase() === trimmedName.toLowerCase()
      )
    ) {
      setError("List name already exists");
      return;
    }

    if (trimmedName.length > 30) {
      setError("List name too long (max 30 characters)");
      return;
    }

    // Add column
    onAdd(trimmedName);
    setColumnName("");
    setError("");
    setIsAdding(false);
  };

  const handleCancel = () => {
    setColumnName("");
    setError("");
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdd();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  // Empty board state - compact centered design
  if (isEmpty) {
    return (
      <div className="flex items-centerf justify-center w-full">
        <div className="bg-[#2b2d31] rounded-xl p-6 max-w-sm w-full mx-4 border border-[#404249]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#5865f2]/20 flex items-center justify-center">
              <LayoutList size={20} className="text-[#5865f2]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Get Started
              </h3>
              <p className="text-xs text-gray-400">Add your first list</p>
            </div>
          </div>

          {isAdding ? (
            <div className="space-y-3">
              <Input
                ref={inputRef}
                value={columnName}
                onChange={(e) => {
                  setColumnName(e.target.value);
                  setError("");
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter list name..."
                className="bg-[#1e1f22] border-none text-white placeholder:text-gray-500 h-10 focus-visible:ring-[#5865f2]"
              />
              {error && <p className="text-xs text-[#ed4245]">{error}</p>}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAdd()}
                  size="sm"
                  className="flex-1 gap-1.5 bg-[#5865f2] hover:bg-[#4752c4] h-9"
                >
                  <Check size={14} />
                  Add
                </Button>
                <Button
                  onClick={handleCancel}
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white hover:bg-[#404249] h-9 px-3"
                >
                  <X size={14} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Quick suggestions */}
              {availableSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {availableSuggestions.slice(0, 4).map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleAdd(suggestion)}
                      className="px-3 py-1.5 text-xs font-medium bg-[#1e1f22] hover:bg-[#404249] text-gray-300 hover:text-white rounded-md transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#404249]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-2 text-xs text-gray-500 bg-[#2b2d31]">
                    or
                  </span>
                </div>
              </div>

              <Button
                onClick={() => setIsAdding(true)}
                className="w-full gap-2 bg-[#5865f2] hover:bg-[#4752c4] h-10"
              >
                <Plus size={16} />
                Custom List
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Normal "Add another list" button at end of columns
  if (isAdding) {
    return (
      <div className="shrink-0 w-72 bg-[#2b2d31] rounded-lg p-3 shadow-md border-2 border-[#5865f2]">
        <Input
          ref={inputRef}
          value={columnName}
          onChange={(e) => {
            setColumnName(e.target.value);
            setError("");
          }}
          onKeyDown={handleKeyDown}
          placeholder="Enter list name..."
          className="mb-2 bg-[#1e1f22] border-[#1e1f22] text-white placeholder:text-gray-500"
        />
        {error && <p className="text-xs text-[#ed4245] mb-2">{error}</p>}
        <div className="flex gap-2">
          <Button
            onClick={() => handleAdd()}
            size="sm"
            className="flex-1 gap-1 bg-[#5865f2] hover:bg-[#4752c4]"
          >
            <Check size={14} />
            Add List
          </Button>
          <Button
            onClick={handleCancel}
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

  return (
    <button
      onClick={() => setIsAdding(true)}
      disabled={isMaxReached}
      className={`shrink-0 w-72 bg-[#2b2d31]/50 hover:bg-[#2b2d31] rounded-lg p-4 border-2 border-dashed transition-all h-[55px] ${
        isMaxReached
          ? "border-[#404249] text-gray-600 cursor-not-allowed"
          : "border-[#404249] hover:border-[#5865f2] text-gray-400 hover:text-[#5865f2] cursor-pointer"
      }`}
    >
      <div className="flex items-center gap-2 justify-center">
        <Plus size={20} />
        <span className="font-medium">
          {isMaxReached
            ? `Max ${maxColumns} lists reached`
            : "Add another list"}
        </span>
      </div>
    </button>
  );
}
