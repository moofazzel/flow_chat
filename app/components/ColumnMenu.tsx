import {
    Archive,
    ArrowRight,
    ArrowUpDown,
    Calendar,
    Check,
    Clock,
    Copy,
    Edit2,
    MoreHorizontal,
    Paintbrush,
    Palette,
    Plus,
    Tag,
    Trash2,
    User,
    X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from './ui/alert-dialog';
import { Button } from './ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface ColumnMenuProps {
  columnId: string;
  columnTitle: string;
  columnColor: string;
  columnBgColor?: string;
  taskCount: number;
  onRename: (newTitle: string) => void;
  onDelete: () => void;
  onChangeColor: (newColor: string) => void;
  onChangeBgColor?: (newBgColor: string) => void;
  onCopy?: () => void;
  onMove?: (direction: 'left' | 'right') => void;
  onSortBy?: (sortBy: 'date' | 'name' | 'priority' | 'assignee') => void;
  onArchiveAllCards?: () => void;
  onAddCard?: () => void;
  existingTitles: string[];
  canMoveLeft?: boolean;
  canMoveRight?: boolean;
}

const COLOR_OPTIONS = [
  { name: 'Gray', value: 'bg-gray-500', hex: '#6b7280' },
  { name: 'Slate', value: 'bg-slate-500', hex: '#64748b' },
  { name: 'Red', value: 'bg-red-500', hex: '#ef4444' },
  { name: 'Orange', value: 'bg-orange-500', hex: '#f97316' },
  { name: 'Amber', value: 'bg-amber-500', hex: '#f59e0b' },
  { name: 'Yellow', value: 'bg-yellow-500', hex: '#eab308' },
  { name: 'Lime', value: 'bg-lime-500', hex: '#84cc16' },
  { name: 'Green', value: 'bg-green-500', hex: '#22c55e' },
  { name: 'Emerald', value: 'bg-emerald-500', hex: '#10b981' },
  { name: 'Teal', value: 'bg-teal-500', hex: '#14b8a6' },
  { name: 'Cyan', value: 'bg-cyan-500', hex: '#06b6d4' },
  { name: 'Sky', value: 'bg-sky-500', hex: '#0ea5e9' },
  { name: 'Blue', value: 'bg-blue-500', hex: '#3b82f6' },
  { name: 'Indigo', value: 'bg-indigo-500', hex: '#6366f1' },
  { name: 'Violet', value: 'bg-violet-500', hex: '#8b5cf6' },
  { name: 'Purple', value: 'bg-purple-500', hex: '#a855f7' },
  { name: 'Fuchsia', value: 'bg-fuchsia-500', hex: '#d946ef' },
  { name: 'Pink', value: 'bg-pink-500', hex: '#ec4899' },
  { name: 'Rose', value: 'bg-rose-500', hex: '#f43f5e' },
];

const BG_COLOR_OPTIONS = [
  { name: 'Default', value: 'bg-[#f1f2f4]', class: 'bg-[#f1f2f4]' },
  { name: 'Light Gray', value: 'bg-gray-100', class: 'bg-gray-100' },
  { name: 'Light Blue', value: 'bg-blue-50', class: 'bg-blue-50' },
  { name: 'Light Green', value: 'bg-green-50', class: 'bg-green-50' },
  { name: 'Light Yellow', value: 'bg-yellow-50', class: 'bg-yellow-50' },
  { name: 'Light Red', value: 'bg-red-50', class: 'bg-red-50' },
  { name: 'Light Purple', value: 'bg-purple-50', class: 'bg-purple-50' },
  { name: 'Light Pink', value: 'bg-pink-50', class: 'bg-pink-50' },
  { name: 'Light Indigo', value: 'bg-indigo-50', class: 'bg-indigo-50' },
  { name: 'Light Teal', value: 'bg-teal-50', class: 'bg-teal-50' },
  { name: 'Light Orange', value: 'bg-orange-50', class: 'bg-orange-50' },
  { name: 'Light Cyan', value: 'bg-cyan-50', class: 'bg-cyan-50' },
];

const BG_GRADIENT_OPTIONS = [
  { name: 'Blue Gradient', value: 'bg-gradient-to-br from-blue-50 to-blue-100', class: 'bg-gradient-to-br from-blue-50 to-blue-100' },
  { name: 'Green Gradient', value: 'bg-gradient-to-br from-green-50 to-green-100', class: 'bg-gradient-to-br from-green-50 to-green-100' },
  { name: 'Purple Gradient', value: 'bg-gradient-to-br from-purple-50 to-purple-100', class: 'bg-gradient-to-br from-purple-50 to-purple-100' },
  { name: 'Pink Gradient', value: 'bg-gradient-to-br from-pink-50 to-pink-100', class: 'bg-gradient-to-br from-pink-50 to-pink-100' },
  { name: 'Ocean', value: 'bg-gradient-to-br from-cyan-50 to-blue-100', class: 'bg-gradient-to-br from-cyan-50 to-blue-100' },
  { name: 'Sunset', value: 'bg-gradient-to-br from-orange-50 to-pink-100', class: 'bg-gradient-to-br from-orange-50 to-pink-100' },
  { name: 'Forest', value: 'bg-gradient-to-br from-green-50 to-teal-100', class: 'bg-gradient-to-br from-green-50 to-teal-100' },
  { name: 'Lavender', value: 'bg-gradient-to-br from-purple-50 to-pink-100', class: 'bg-gradient-to-br from-purple-50 to-pink-100' },
];

export function ColumnMenu({
  columnId,
  columnTitle,
  columnColor,
  columnBgColor,
  taskCount,
  onRename,
  onDelete,
  onChangeColor,
  onChangeBgColor,
  onCopy,
  onMove,
  onSortBy,
  onArchiveAllCards,
  onAddCard,
  existingTitles,
  canMoveLeft = true,
  canMoveRight = true,
}: ColumnMenuProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(columnTitle);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showColorDialog, setShowColorDialog] = useState(false);
  const [showBgColorDialog, setShowBgColorDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleRename = () => {
    const trimmedTitle = newTitle.trim();

    if (!trimmedTitle) {
      toast.error('Column name cannot be empty');
      return;
    }

    if (trimmedTitle === columnTitle) {
      setIsRenaming(false);
      return;
    }

    if (existingTitles.some((t) => t.toLowerCase() === trimmedTitle.toLowerCase())) {
      toast.error('Column name already exists');
      return;
    }

    if (trimmedTitle.length > 30) {
      toast.error('Column name too long (max 30 characters)');
      return;
    }

    onRename(trimmedTitle);
    setIsRenaming(false);
    toast.success(`Column renamed to "${trimmedTitle}"`);
  };

  const handleDelete = () => {
    onDelete();
    setShowDeleteDialog(false);
    toast.success('Column deleted');
  };

  const handleColorChange = (color: string) => {
    onChangeColor(color);
    setShowColorDialog(false);
    toast.success('Column color changed');
  };

  const handleBgColorChange = (bgColor: string) => {
    onChangeBgColor?.(bgColor);
    setShowBgColorDialog(false);
    toast.success('Column background color changed');
  };

  const handleArchiveAll = () => {
    onArchiveAllCards?.();
    setShowArchiveDialog(false);
    toast.success(`Archived ${taskCount} card${taskCount !== 1 ? 's' : ''}`);
  };

  if (isRenaming) {
    return (
      <div className="flex gap-1 items-center">
        <Input
          ref={inputRef}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleRename();
            } else if (e.key === 'Escape') {
              setIsRenaming(false);
              setNewTitle(columnTitle);
            }
          }}
          className="h-7 text-sm"
        />
        <Button size="sm" variant="ghost" onClick={handleRename}>
          <Check size={14} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setIsRenaming(false);
            setNewTitle(columnTitle);
          }}
        >
          <X size={14} />
        </Button>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200"
          >
            <MoreHorizontal size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {/* Header */}
          <div className="px-3 py-2 border-b">
            <div className="font-medium text-sm">List Actions</div>
            <div className="text-xs text-gray-500">{taskCount} card{taskCount !== 1 ? 's' : ''}</div>
          </div>

          {/* Quick Actions */}
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 mt-1">
            Quick Actions
          </div>

          {onAddCard && (
            <DropdownMenuItem onClick={onAddCard}>
              <Plus size={16} className="mr-2" />
              Add Card
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={() => setIsRenaming(true)}>
            <Edit2 size={16} className="mr-2" />
            Rename List
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setShowColorDialog(true)}>
            <Palette size={16} className="mr-2" />
            Change Color
          </DropdownMenuItem>

          {onChangeBgColor && (
            <DropdownMenuItem onClick={() => setShowBgColorDialog(true)}>
              <Paintbrush size={16} className="mr-2" />
              Change List Background
            </DropdownMenuItem>
          )}

          {onCopy && (
            <DropdownMenuItem onClick={onCopy}>
              <Copy size={16} className="mr-2" />
              Copy List
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Move List */}
          {onMove && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ArrowRight size={16} className="mr-2" />
                Move List
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem 
                  onClick={() => onMove('left')}
                  disabled={!canMoveLeft}
                >
                  Move Left
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onMove('right')}
                  disabled={!canMoveRight}
                >
                  Move Right
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}

          {/* Sort Cards */}
          {onSortBy && taskCount > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ArrowUpDown size={16} className="mr-2" />
                Sort Cards
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => onSortBy('date')}>
                  <Calendar size={14} className="mr-2" />
                  By Date
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortBy('name')}>
                  <Tag size={14} className="mr-2" />
                  By Name
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortBy('priority')}>
                  <Clock size={14} className="mr-2" />
                  By Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortBy('assignee')}>
                  <User size={14} className="mr-2" />
                  By Assignee
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}

          <DropdownMenuSeparator />

          {/* Archive & Delete */}
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
            Manage
          </div>

          {onArchiveAllCards && taskCount > 0 && (
            <DropdownMenuItem onClick={() => setShowArchiveDialog(true)}>
              <Archive size={16} className="mr-2" />
              Archive All Cards
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 size={16} className="mr-2" />
            Delete List
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Color Picker Dialog */}
      <Dialog open={showColorDialog} onOpenChange={setShowColorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="text-[#0052cc]" size={24} />
              Change List Color
            </DialogTitle>
            <DialogDescription>
              Select a color for "{columnTitle}"
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-6 gap-3 p-4">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color.value}
                onClick={() => handleColorChange(color.value)}
                className={`relative h-12 rounded-lg transition-all ${color.value} hover:scale-110 ${
                  columnColor === color.value
                    ? 'ring-4 ring-offset-2 ring-[#0052cc] scale-105'
                    : 'hover:shadow-lg'
                }`}
                title={color.name}
              >
                {columnColor === color.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check size={20} className="text-white drop-shadow-lg" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Background Color Picker Dialog */}
      <Dialog open={showBgColorDialog} onOpenChange={setShowBgColorDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paintbrush className="text-[#0052cc]" size={24} />
              Change List Background
            </DialogTitle>
            <DialogDescription>
              Select a background for "{columnTitle}"
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="colors" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="colors">Solid Colors</TabsTrigger>
              <TabsTrigger value="gradients">Gradients</TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="mt-4">
              <div className="grid grid-cols-6 gap-3">
                {BG_COLOR_OPTIONS.map((bgColor) => (
                  <button
                    key={bgColor.value}
                    onClick={() => handleBgColorChange(bgColor.value)}
                    className={`relative h-14 rounded-lg transition-all ${bgColor.class} border-2 hover:scale-110 ${
                      columnBgColor === bgColor.value
                        ? 'ring-4 ring-offset-2 ring-[#0052cc] scale-105 border-[#0052cc]'
                        : 'border-gray-200 hover:shadow-lg'
                    }`}
                    title={bgColor.name}
                  >
                    {columnBgColor === bgColor.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check size={20} className="text-gray-700 drop-shadow-lg" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="gradients" className="mt-4">
              <div className="grid grid-cols-4 gap-3">
                {BG_GRADIENT_OPTIONS.map((gradient) => (
                  <button
                    key={gradient.value}
                    onClick={() => handleBgColorChange(gradient.value)}
                    className={`relative h-20 rounded-lg transition-all ${gradient.class} border-2 hover:scale-110 ${
                      columnBgColor === gradient.value
                        ? 'ring-4 ring-offset-2 ring-[#0052cc] scale-105 border-[#0052cc]'
                        : 'border-gray-200 hover:shadow-lg'
                    }`}
                    title={gradient.name}
                  >
                    {columnBgColor === gradient.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check size={24} className="text-white drop-shadow-lg" />
                      </div>
                    )}
                    <div className="absolute bottom-1 left-0 right-0 text-center">
                      <span className="text-[10px] bg-white/80 px-1 rounded">{gradient.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Archive All Cards Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive All Cards?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive all {taskCount} card{taskCount !== 1 ? 's' : ''} in "{columnTitle}"?
              <span className="block mt-2 text-sm text-gray-600">
                Archived cards can be restored later from the archive.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveAll}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Archive All Cards
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Column Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete List?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{columnTitle}"?
              {taskCount > 0 && (
                <span className="block mt-2 font-medium text-orange-600">
                  ⚠️ This list contains {taskCount} card{taskCount !== 1 ? 's' : ''}. 
                  Cards will be moved to the first list.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete List
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}