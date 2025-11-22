import { useState } from 'react';
import { 
  MoreHorizontal, 
  Settings, 
  Image, 
  Palette, 
  Star,
  Archive,
  Copy,
  Trash2,
  Users,
  Lock,
  Globe,
  Download,
  Upload,
  Activity,
  Tag,
  Grid3x3,
  Eye,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface BoardSettingsMenuProps {
  boardId: string;
  boardName: string;
  boardDescription: string;
  boardColor: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  visibility?: 'private' | 'team' | 'public';
  onUpdateBoard: (updates: {
    name?: string;
    description?: string;
    color?: string;
    background?: string;
    isFavorite?: boolean;
    isArchived?: boolean;
    visibility?: 'private' | 'team' | 'public';
  }) => void;
  onDeleteBoard: () => void;
  onDuplicateBoard: () => void;
  onExportBoard?: () => void;
}

const SOLID_COLORS = [
  { name: 'Blue', value: 'bg-blue-500', preview: '#3b82f6' },
  { name: 'Sky', value: 'bg-sky-500', preview: '#0ea5e9' },
  { name: 'Cyan', value: 'bg-cyan-500', preview: '#06b6d4' },
  { name: 'Teal', value: 'bg-teal-500', preview: '#14b8a6' },
  { name: 'Green', value: 'bg-green-500', preview: '#22c55e' },
  { name: 'Lime', value: 'bg-lime-500', preview: '#84cc16' },
  { name: 'Yellow', value: 'bg-yellow-500', preview: '#eab308' },
  { name: 'Amber', value: 'bg-amber-500', preview: '#f59e0b' },
  { name: 'Orange', value: 'bg-orange-500', preview: '#f97316' },
  { name: 'Red', value: 'bg-red-500', preview: '#ef4444' },
  { name: 'Pink', value: 'bg-pink-500', preview: '#ec4899' },
  { name: 'Rose', value: 'bg-rose-500', preview: '#f43f5e' },
  { name: 'Purple', value: 'bg-purple-500', preview: '#a855f7' },
  { name: 'Violet', value: 'bg-violet-500', preview: '#8b5cf6' },
  { name: 'Indigo', value: 'bg-indigo-500', preview: '#6366f1' },
  { name: 'Fuchsia', value: 'bg-fuchsia-500', preview: '#d946ef' },
  { name: 'Slate', value: 'bg-slate-500', preview: '#64748b' },
  { name: 'Gray', value: 'bg-gray-500', preview: '#6b7280' },
];

const GRADIENT_BACKGROUNDS = [
  { name: 'Ocean', value: 'bg-gradient-to-br from-blue-400 via-blue-500 to-cyan-500' },
  { name: 'Sunset', value: 'bg-gradient-to-br from-orange-400 via-red-500 to-pink-500' },
  { name: 'Forest', value: 'bg-gradient-to-br from-green-400 via-teal-500 to-emerald-600' },
  { name: 'Lavender', value: 'bg-gradient-to-br from-purple-400 via-violet-500 to-indigo-500' },
  { name: 'Fire', value: 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600' },
  { name: 'Aurora', value: 'bg-gradient-to-br from-cyan-400 via-purple-400 to-pink-500' },
  { name: 'Mint', value: 'bg-gradient-to-br from-teal-300 via-green-400 to-lime-500' },
  { name: 'Berry', value: 'bg-gradient-to-br from-pink-400 via-rose-500 to-red-500' },
  { name: 'Night', value: 'bg-gradient-to-br from-slate-700 via-blue-900 to-indigo-900' },
  { name: 'Peach', value: 'bg-gradient-to-br from-orange-300 via-pink-400 to-rose-400' },
  { name: 'Emerald', value: 'bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700' },
  { name: 'Royal', value: 'bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600' },
];

const PATTERN_BACKGROUNDS = [
  { name: 'Dots', value: 'bg-blue-500 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.15)_1px,_transparent_1px)] bg-[length:20px_20px]' },
  { name: 'Grid', value: 'bg-purple-500 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[length:20px_20px]' },
  { name: 'Diagonal', value: 'bg-teal-500 bg-[repeating-linear-gradient(45deg,_transparent,_transparent_10px,_rgba(255,255,255,0.1)_10px,_rgba(255,255,255,0.1)_20px)]' },
  { name: 'Waves', value: 'bg-cyan-500 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.2),_transparent_50%)]' },
];

export function BoardSettingsMenu({
  boardId,
  boardName,
  boardDescription,
  boardColor,
  isFavorite = false,
  isArchived = false,
  visibility = 'private',
  onUpdateBoard,
  onDeleteBoard,
  onDuplicateBoard,
  onExportBoard,
}: BoardSettingsMenuProps) {
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showBackgroundDialog, setShowBackgroundDialog] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'members' | 'advanced'>('general');
  
  const [editName, setEditName] = useState(boardName);
  const [editDescription, setEditDescription] = useState(boardDescription);
  const [editVisibility, setEditVisibility] = useState(visibility);

  const handleSaveSettings = () => {
    onUpdateBoard({
      name: editName,
      description: editDescription,
      visibility: editVisibility,
    });
    setShowSettingsDialog(false);
  };

  const handleChangeBackground = (newBackground: string) => {
    onUpdateBoard({ color: newBackground });
    setShowBackgroundDialog(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900 hover:bg-blue-50 h-8 px-2 border border-gray-300"
            title="Board Menu - Change colors, settings, and more"
          >
            <MoreHorizontal size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          {/* Header */}
          <div className="px-3 py-2 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="font-semibold text-gray-900">Board Menu</div>
            <div className="text-xs text-gray-500">Customize your board appearance and settings</div>
          </div>

          {/* Board Actions */}
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 mt-2">
            Board Actions
          </div>
          
          <DropdownMenuItem onClick={() => setShowSettingsDialog(true)}>
            <Settings size={16} className="mr-2" />
            Board Settings
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setShowBackgroundDialog(true)}>
            <Palette size={16} className="mr-2" />
            Change Background
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => onUpdateBoard({ isFavorite: !isFavorite })}
          >
            <Star size={16} className={`mr-2 ${isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
            {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setShowActivityDialog(true)}>
            <Activity size={16} className="mr-2" />
            Activity Log
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Visibility */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Eye size={16} className="mr-2" />
              Visibility: {visibility}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => onUpdateBoard({ visibility: 'private' })}>
                <Lock size={14} className="mr-2" />
                Private
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateBoard({ visibility: 'team' })}>
                <Users size={14} className="mr-2" />
                Team
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateBoard({ visibility: 'public' })}>
                <Globe size={14} className="mr-2" />
                Public
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {/* More Actions */}
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
            More Actions
          </div>

          <DropdownMenuItem onClick={onDuplicateBoard}>
            <Copy size={16} className="mr-2" />
            Duplicate Board
          </DropdownMenuItem>

          {onExportBoard && (
            <DropdownMenuItem onClick={onExportBoard}>
              <Download size={16} className="mr-2" />
              Export Board
            </DropdownMenuItem>
          )}

          <DropdownMenuItem 
            onClick={() => onUpdateBoard({ isArchived: !isArchived })}
          >
            <Archive size={16} className="mr-2" />
            {isArchived ? 'Unarchive Board' : 'Archive Board'}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem 
            onClick={onDeleteBoard}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 size={16} className="mr-2" />
            Delete Board
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Board Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="text-[#0052cc]" size={24} />
              Board Settings
            </DialogTitle>
            <DialogDescription>
              Configure your board settings and preferences.
            </DialogDescription>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setSettingsTab('general')}
              className={`px-4 py-2 text-sm transition-colors ${
                settingsTab === 'general'
                  ? 'border-b-2 border-[#0052cc] text-[#0052cc] font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setSettingsTab('members')}
              className={`px-4 py-2 text-sm transition-colors ${
                settingsTab === 'members'
                  ? 'border-b-2 border-[#0052cc] text-[#0052cc] font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Members
            </button>
            <button
              onClick={() => setSettingsTab('advanced')}
              className={`px-4 py-2 text-sm transition-colors ${
                settingsTab === 'advanced'
                  ? 'border-b-2 border-[#0052cc] text-[#0052cc] font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Advanced
            </button>
          </div>

          <ScrollArea className="max-h-[60vh]">
            {settingsTab === 'general' && (
              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Board Name</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setEditVisibility('private')}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        editVisibility === 'private'
                          ? 'border-[#0052cc] bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Lock size={20} className="mx-auto mb-1" />
                      <div className="text-xs font-medium">Private</div>
                    </button>
                    <button
                      onClick={() => setEditVisibility('team')}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        editVisibility === 'team'
                          ? 'border-[#0052cc] bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Users size={20} className="mx-auto mb-1" />
                      <div className="text-xs font-medium">Team</div>
                    </button>
                    <button
                      onClick={() => setEditVisibility('public')}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        editVisibility === 'public'
                          ? 'border-[#0052cc] bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Globe size={20} className="mx-auto mb-1" />
                      <div className="text-xs font-medium">Public</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {settingsTab === 'members' && (
              <div className="p-4">
                <div className="text-center py-8 text-gray-500">
                  <Users size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Member management coming soon!</p>
                </div>
              </div>
            )}

            {settingsTab === 'advanced' && (
              <div className="space-y-4 p-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Archive size={20} className="text-yellow-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-900">Archive Board</div>
                      <p className="text-sm text-yellow-700 mt-1">
                        Archived boards are hidden from view but can be restored later.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          onUpdateBoard({ isArchived: !isArchived });
                          setShowSettingsDialog(false);
                        }}
                      >
                        {isArchived ? 'Unarchive' : 'Archive'} Board
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Trash2 size={20} className="text-red-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-red-900">Delete Board</div>
                      <p className="text-sm text-red-700 mt-1">
                        Permanently delete this board and all its contents. This action cannot be undone.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (confirm(`Delete "${boardName}"? This cannot be undone.`)) {
                            onDeleteBoard();
                            setShowSettingsDialog(false);
                          }
                        }}
                      >
                        Delete Board
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowSettingsDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSettings}
              className="flex-1 bg-[#0052cc] hover:bg-[#0747a6]"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Background Picker Dialog */}
      <Dialog open={showBackgroundDialog} onOpenChange={setShowBackgroundDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="text-[#0052cc]" size={24} />
              Change Board Background
            </DialogTitle>
            <DialogDescription>
              Choose from solid colors, gradients, or patterns to customize your board.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6 p-2">
              {/* Solid Colors */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-500" />
                  Solid Colors
                </h3>
                <div className="grid grid-cols-6 gap-3">
                  {SOLID_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleChangeBackground(color.value)}
                      className={`relative h-20 rounded-lg transition-all ${color.value} ${
                        boardColor === color.value
                          ? 'ring-4 ring-offset-2 ring-[#0052cc] scale-105'
                          : 'hover:scale-105 hover:shadow-lg'
                      }`}
                      title={color.name}
                    >
                      {boardColor === color.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-2xl">✓</span>
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-1 left-0 right-0 text-center">
                        <span className="text-xs text-white font-medium drop-shadow-lg">
                          {color.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Gradient Backgrounds */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-purple-500" />
                  Gradients
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {GRADIENT_BACKGROUNDS.map((bg) => (
                    <button
                      key={bg.value}
                      onClick={() => handleChangeBackground(bg.value)}
                      className={`relative h-24 rounded-lg transition-all ${bg.value} ${
                        boardColor === bg.value
                          ? 'ring-4 ring-offset-2 ring-[#0052cc] scale-105'
                          : 'hover:scale-105 hover:shadow-lg'
                      }`}
                      title={bg.name}
                    >
                      {boardColor === bg.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-2xl">✓</span>
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-0 right-0 text-center">
                        <span className="text-xs text-white font-medium drop-shadow-lg">
                          {bg.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Pattern Backgrounds */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Grid3x3 size={16} />
                  Patterns
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {PATTERN_BACKGROUNDS.map((bg) => (
                    <button
                      key={bg.value}
                      onClick={() => handleChangeBackground(bg.value)}
                      className={`relative h-24 rounded-lg transition-all ${bg.value} ${
                        boardColor === bg.value
                          ? 'ring-4 ring-offset-2 ring-[#0052cc] scale-105'
                          : 'hover:scale-105 hover:shadow-lg'
                      }`}
                      title={bg.name}
                    >
                      {boardColor === bg.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-2xl">✓</span>
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-0 right-0 text-center">
                        <span className="text-xs text-white font-medium drop-shadow-lg">
                          {bg.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Activity Log Dialog */}
      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="text-[#0052cc]" size={24} />
              Board Activity
            </DialogTitle>
            <DialogDescription>
              Recent actions and changes on this board.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 p-4">
              {/* Mock activity items */}
              <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Tag size={16} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <strong>You</strong> changed the board color
                  </p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Settings size={16} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <strong>You</strong> updated board settings
                  </p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>

              <div className="text-center py-4 text-gray-500 text-sm">
                End of activity log
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}