"use client";

import { Folder, Lock } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (categoryData: { name: string; isPrivate: boolean }) => void;
}

export function CreateCategoryModal({
  isOpen,
  onClose,
  onCreate,
}: CreateCategoryModalProps) {
  const [categoryName, setCategoryName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const handleCreate = () => {
    if (categoryName.trim()) {
      onCreate({
        name: categoryName.toUpperCase(),
        isPrivate: isPrivate,
      });
      // Reset form
      setCategoryName("");
      setIsPrivate(false);
      onClose();
    }
  };

  const handleClose = () => {
    setCategoryName("");
    setIsPrivate(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[460px] bg-[#313338] border-none text-white p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-b from-[#313338] to-[#2b2d31]">
          <DialogTitle className="text-white text-xl flex items-center gap-2">
            <Folder className="text-[#5865f2]" size={22} />
            Create Category
          </DialogTitle>
          <DialogDescription className="text-[#b5bac1] text-[14px] mt-2">
            Categories help organize your channels into groups
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Category Name */}
          <div className="space-y-2">
            <Label
              htmlFor="category-name"
              className="text-[#b5bac1] text-xs uppercase tracking-wider font-semibold"
            >
              Category Name
            </Label>
            <div className="relative">
              <Input
                id="category-name"
                placeholder="NEW CATEGORY"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="bg-[#1e1f22] border-none text-white h-11 uppercase placeholder:text-[#6d6f78]"
                autoFocus
                maxLength={32}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreate();
                  }
                }}
              />
            </div>
            {categoryName && (
              <p className="text-xs text-[#80848e]">
                {categoryName.length}/32 characters
              </p>
            )}
          </div>

          {/* Private Category */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-[#2b2d31] border border-[#1e1f22] hover:border-[#404249] transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Lock size={18} className="text-[#b5bac1]" />
                <span className="text-white font-semibold">
                  Private Category
                </span>
              </div>
              <p className="text-[13px] text-[#b5bac1] leading-relaxed">
                By making a category private, only selected members and roles
                will be able to view this category and its channels
              </p>
            </div>
            <Switch
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
              className="mt-1 data-[state=checked]:bg-[#5865f2]"
            />
          </div>

          {/* Info Box */}
          <div className="p-3 bg-[#5865f2]/10 border-l-4 border-[#5865f2] rounded">
            <p className="text-[#b5bac1] text-sm leading-relaxed">
              💡 You can drag and drop channels into this category after
              creating it
            </p>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 bg-[#2b2d31] border-t border-[#1e1f22] gap-3">
          <Button
            onClick={handleClose}
            variant="ghost"
            className="text-white hover:text-white hover:bg-[#4e5058] h-10 px-4"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!categoryName.trim()}
            className="bg-[#5865f2] hover:bg-[#4752c4] text-white h-10 px-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#5865f2]"
          >
            Create Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
