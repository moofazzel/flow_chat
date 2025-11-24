"use client";

import { Edit2, Hash, Trash2, Volume2 } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";

interface ManageChannelModalProps {
  isOpen: boolean;
  channel: {
    id: string;
    name: string;
    type: "text" | "voice" | "announcement";
    category: string;
  };
  onClose: () => void;
  onRename: (newName: string) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
}

export function ManageChannelModal({
  isOpen,
  channel,
  onClose,
  onRename,
  onDelete,
}: ManageChannelModalProps) {
  const [newName, setNewName] = useState(channel.name);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRename = async () => {
    if (!newName.trim() || newName === channel.name) {
      onClose();
      return;
    }
    setIsRenaming(true);
    await onRename(newName.trim().toLowerCase().replace(/\s+/g, "-"));
    setIsRenaming(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this channel?")) return;
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[420px] bg-[#313338] border-none text-white p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-b from-[#313338] to-[#2b2d31]">
          <DialogTitle className="flex items-center gap-2 text-xl">
            {channel.type === "voice" ? (
              <Volume2 size={20} className="text-[#5865f2]" />
            ) : (
              <Hash size={20} className="text-[#5865f2]" />
            )}
            Manage Channel
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4 space-y-5">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-[#b5bac1] font-semibold">
              Rename Channel
            </label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-[#1e1f22] border-none text-white h-10 focus-visible:ring-1 focus-visible:ring-[#5865f2]"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
              }}
            />
            <p className="text-[11px] text-[#80848e]">
              Use short, descriptive names. Spaces will be converted to dashes.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-[#b5bac1] font-semibold">
              Danger Zone
            </label>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full bg-[#f23f43] hover:bg-[#d71924] text-white"
            >
              <Trash2 size={16} className="mr-2" /> Delete Channel
            </Button>
          </div>
        </div>
        <DialogFooter className="px-6 pb-5 flex gap-2 justify-end">
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-10 px-4 text-white hover:bg-[#404249]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleRename}
            disabled={isRenaming || !newName.trim() || newName === channel.name}
            className="h-10 px-6 bg-[#5865f2] hover:bg-[#4752c4] text-white disabled:opacity-50"
          >
            <Edit2 size={16} className="mr-2" /> Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
