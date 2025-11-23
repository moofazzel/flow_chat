"use client";

import { Check, Plus, X } from "lucide-react";
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

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleAdd = () => {
    const trimmedName = columnName.trim();

    // Validation
    if (!trimmedName) {
      setError("Column name cannot be empty");
      return;
    }

    if (
      existingNames.some(
        (name) => name.toLowerCase() === trimmedName.toLowerCase()
      )
    ) {
      setError("Column name already exists");
      return;
    }

    if (trimmedName.length > 30) {
      setError("Column name too long (max 30 characters)");
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

  // Empty board state
  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-full w-full p-8">
        <div className="text-center max-w-md">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <Plus size={64} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Add Your First List
          </h2>
          <p className="text-gray-600 mb-6">
            Lists help you organize your tasks into stages like "To Do", "In
            Progress", and "Done"
          </p>

          {isAdding ? (
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-500">
              <Input
                ref={inputRef}
                value={columnName}
                onChange={(e) => {
                  setColumnName(e.target.value);
                  setError("");
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter list name..."
                className="mb-3"
              />
              {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
              <div className="flex gap-2">
                <Button onClick={handleAdd} className="flex-1 gap-2">
                  <Check size={16} />
                  Add List
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  <X size={16} />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIsAdding(true)}
              size="lg"
              className="gap-2"
            >
              <Plus size={20} />
              Add List
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Normal "Add another list" button at end of columns
  if (isAdding) {
    return (
      <div className="flex-shrink-0 w-72 bg-white rounded-lg p-3 shadow-md border-2 border-blue-500">
        <Input
          ref={inputRef}
          value={columnName}
          onChange={(e) => {
            setColumnName(e.target.value);
            setError("");
          }}
          onKeyDown={handleKeyDown}
          placeholder="Enter list name..."
          className="mb-2"
        />
        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={handleAdd} size="sm" className="flex-1 gap-1">
            <Check size={14} />
            Add List
          </Button>
          <Button onClick={handleCancel} size="sm" variant="outline">
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
      className={`flex-shrink-0 w-72 bg-white/50 hover:bg-white rounded-lg p-4 border-2 border-dashed transition-all h-[55px] ${
        isMaxReached
          ? "border-gray-300 text-gray-400 cursor-not-allowed"
          : "border-gray-400 hover:border-blue-500 text-gray-600 hover:text-blue-600 cursor-pointer"
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
