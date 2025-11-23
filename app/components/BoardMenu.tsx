"use client";
import { Copy, Edit2, MoreVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

interface BoardMenuProps {
  boardId: string;
  boardName: string;
  boardDescription: string;
  boardColor: string;
  isOnlyBoard: boolean;
  onDelete: (boardId: string) => void;
  onRename: (
    boardId: string,
    newName: string,
    newDescription: string,
    newColor: string
  ) => void;
  onDuplicate?: (boardId: string) => void;
}

const BOARD_COLORS = [
  { name: "Blue", value: "bg-blue-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Pink", value: "bg-pink-500" },
  { name: "Red", value: "bg-red-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Yellow", value: "bg-yellow-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Teal", value: "bg-teal-500" },
  { name: "Cyan", value: "bg-cyan-500" },
  { name: "Indigo", value: "bg-indigo-500" },
  { name: "Violet", value: "bg-violet-500" },
  { name: "Fuchsia", value: "bg-fuchsia-500" },
];

export function BoardMenu({
  boardId,
  boardName,
  boardDescription,
  boardColor,
  isOnlyBoard,
  onDelete,
  onRename,
  onDuplicate,
}: BoardMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newName, setNewName] = useState(boardName);
  const [newDescription, setNewDescription] = useState(boardDescription);
  const [newColor, setNewColor] = useState(boardColor);

  const handleDelete = () => {
    onDelete(boardId);
    setShowDeleteDialog(false);
  };

  const handleRename = () => {
    if (!newName.trim()) {
      alert("Board name cannot be empty");
      return;
    }
    onRename(boardId, newName.trim(), newDescription.trim(), newColor);
    setShowRenameDialog(false);
  };

  const handleOpenRenameDialog = () => {
    setNewName(boardName);
    setNewDescription(boardDescription);
    setNewColor(boardColor);
    setShowRenameDialog(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1 hover:bg-black/10 rounded transition-colors ml-1"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical size={16} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleOpenRenameDialog}>
            <Edit2 size={16} className="mr-2" />
            Edit Board
          </DropdownMenuItem>

          {onDuplicate && (
            <DropdownMenuItem onClick={() => onDuplicate(boardId)}>
              <Copy size={16} className="mr-2" />
              Duplicate Board
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            disabled={isOnlyBoard}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 size={16} className="mr-2" />
            {isOnlyBoard ? "Delete (Need 1+ board)" : "Delete Board"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Board?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{boardName}"</strong>?
              This action cannot be undone. All tasks in this board will remain
              but will need to be reassigned to other boards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Board
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Board</DialogTitle>
            <DialogDescription>
              Update the board name, description, and color.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="board-name">Board Name</Label>
              <Input
                id="board-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Board name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="board-description">Description</Label>
              <Textarea
                id="board-description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Board description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Board Color</Label>
              <div className="grid grid-cols-6 gap-2">
                {BOARD_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setNewColor(color.value)}
                    className={`relative h-10 rounded-lg transition-all ${
                      color.value
                    } ${
                      newColor === color.value
                        ? "ring-4 ring-offset-2 ring-blue-500 scale-105"
                        : "hover:scale-105"
                    }`}
                    title={color.name}
                  >
                    {newColor === color.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-sm">
                          ✓
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowRenameDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              className="flex-1 bg-[#0052cc] hover:bg-[#0747a6]"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
