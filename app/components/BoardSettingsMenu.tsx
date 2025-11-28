"use client";
import { BoardMember } from "@/hooks/useBoard";
import {
  Activity,
  Archive,
  ChevronDown,
  Copy,
  Download,
  Eye,
  Globe,
  Grid3x3,
  Lock,
  MoreHorizontal,
  Palette,
  Plus,
  Search,
  Settings,
  Shield,
  Star,
  Tag,
  Trash2,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";

interface BoardSettingsMenuProps {
  boardId: string;
  boardName: string;
  boardDescription: string;
  boardColor: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  visibility?: "private" | "team" | "public";
  onUpdateBoard: (updates: {
    name?: string;
    description?: string;
    color?: string;
    background?: string;
    isFavorite?: boolean;
    isArchived?: boolean;
    visibility?: "private" | "team" | "public";
  }) => void;
  onDeleteBoard: () => void;
  onDuplicateBoard: () => void;
  onExportBoard?: () => void;
  // New member management props
  boardMembers?: BoardMember[];
  currentUserId?: string;
  onGetBoardMembers?: (boardId: string) => Promise<BoardMember[]>;
  onAddBoardMember?: (
    boardId: string,
    userId: string,
    role?: "admin" | "member" | "observer"
  ) => Promise<BoardMember | null>;
  onRemoveBoardMember?: (memberId: string) => Promise<boolean>;
  onUpdateMemberRole?: (
    memberId: string,
    role: "admin" | "member" | "observer"
  ) => Promise<boolean>;
  onSearchUsers?: (
    query: string
  ) => Promise<{ id: string; username: string; avatar_url: string | null }[]>;
  serverId?: string | null;
  onGetServerMembers?: (
    serverId: string
  ) => Promise<{ id: string; username: string; avatar_url: string | null }[]>;
}

const SOLID_COLORS = [
  { name: "Blue", value: "bg-blue-500", preview: "#3b82f6" },
  { name: "Sky", value: "bg-sky-500", preview: "#0ea5e9" },
  { name: "Cyan", value: "bg-cyan-500", preview: "#06b6d4" },
  { name: "Teal", value: "bg-teal-500", preview: "#14b8a6" },
  { name: "Green", value: "bg-green-500", preview: "#22c55e" },
  { name: "Lime", value: "bg-lime-500", preview: "#84cc16" },
  { name: "Yellow", value: "bg-yellow-500", preview: "#eab308" },
  { name: "Amber", value: "bg-amber-500", preview: "#f59e0b" },
  { name: "Orange", value: "bg-orange-500", preview: "#f97316" },
  { name: "Red", value: "bg-red-500", preview: "#ef4444" },
  { name: "Pink", value: "bg-pink-500", preview: "#ec4899" },
  { name: "Rose", value: "bg-rose-500", preview: "#f43f5e" },
  { name: "Purple", value: "bg-purple-500", preview: "#a855f7" },
  { name: "Violet", value: "bg-violet-500", preview: "#8b5cf6" },
  { name: "Indigo", value: "bg-indigo-500", preview: "#6366f1" },
  { name: "Fuchsia", value: "bg-fuchsia-500", preview: "#d946ef" },
  { name: "Slate", value: "bg-slate-500", preview: "#64748b" },
  { name: "Gray", value: "bg-gray-500", preview: "#6b7280" },
];

const GRADIENT_BACKGROUNDS = [
  {
    name: "Ocean",
    value: "bg-gradient-to-br from-blue-400 via-blue-500 to-cyan-500",
  },
  {
    name: "Sunset",
    value: "bg-gradient-to-br from-orange-400 via-red-500 to-pink-500",
  },
  {
    name: "Forest",
    value: "bg-gradient-to-br from-green-400 via-teal-500 to-emerald-600",
  },
  {
    name: "Lavender",
    value: "bg-gradient-to-br from-purple-400 via-violet-500 to-indigo-500",
  },
  {
    name: "Fire",
    value: "bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600",
  },
  {
    name: "Aurora",
    value: "bg-gradient-to-br from-cyan-400 via-purple-400 to-pink-500",
  },
  {
    name: "Mint",
    value: "bg-gradient-to-br from-teal-300 via-green-400 to-lime-500",
  },
  {
    name: "Berry",
    value: "bg-gradient-to-br from-pink-400 via-rose-500 to-red-500",
  },
  {
    name: "Night",
    value: "bg-gradient-to-br from-slate-700 via-blue-900 to-indigo-900",
  },
  {
    name: "Peach",
    value: "bg-gradient-to-br from-orange-300 via-pink-400 to-rose-400",
  },
  {
    name: "Emerald",
    value: "bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700",
  },
  {
    name: "Royal",
    value: "bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600",
  },
];

const PATTERN_BACKGROUNDS = [
  {
    name: "Dots",
    value:
      "bg-blue-500 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.15)_1px,_transparent_1px)] bg-[length:20px_20px]",
  },
  {
    name: "Grid",
    value:
      "bg-purple-500 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[length:20px_20px]",
  },
  {
    name: "Diagonal",
    value:
      "bg-teal-500 bg-[repeating-linear-gradient(45deg,_transparent,_transparent_10px,_rgba(255,255,255,0.1)_10px,_rgba(255,255,255,0.1)_20px)]",
  },
  {
    name: "Waves",
    value:
      "bg-cyan-500 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.2),_transparent_50%)]",
  },
];

export function BoardSettingsMenu({
  boardId,
  boardName,
  boardDescription,
  boardColor,
  isFavorite = false,
  isArchived = false,
  visibility = "private",
  onUpdateBoard,
  onDeleteBoard,
  onDuplicateBoard,
  onExportBoard,
  // Member management props
  boardMembers: propBoardMembers,
  currentUserId,
  onGetBoardMembers,
  onAddBoardMember,
  onRemoveBoardMember,
  onUpdateMemberRole,
  onSearchUsers,
  serverId,
  onGetServerMembers,
}: BoardSettingsMenuProps) {
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showBackgroundDialog, setShowBackgroundDialog] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [settingsTab, setSettingsTab] = useState<
    "general" | "members" | "advanced"
  >("general");

  const [editName, setEditName] = useState(boardName);
  const [editDescription, setEditDescription] = useState(boardDescription);
  const [editVisibility, setEditVisibility] = useState(visibility);

  // Member management state
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>(
    propBoardMembers || []
  );
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; username: string; avatar_url: string | null }[]
  >([]);
  const [serverMembers, setServerMembers] = useState<
    { id: string; username: string; avatar_url: string | null }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [showAddMemberDropdown, setShowAddMemberDropdown] = useState(false);

  // Load board members when members tab is opened
  useEffect(() => {
    if (settingsTab === "members" && onGetBoardMembers) {
      setIsLoadingMembers(true);
      onGetBoardMembers(boardId)
        .then((members) => {
          setBoardMembers(members);
        })
        .finally(() => {
          setIsLoadingMembers(false);
        });
    }
  }, [settingsTab, boardId, onGetBoardMembers]);

  // Load server members if serverId is provided
  useEffect(() => {
    if (settingsTab === "members" && serverId && onGetServerMembers) {
      onGetServerMembers(serverId).then((members) => {
        setServerMembers(members);
      });
    }
  }, [settingsTab, serverId, onGetServerMembers]);

  // Search users with debounce
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (memberSearchQuery.trim() && onSearchUsers) {
        setIsSearching(true);
        const results = await onSearchUsers(memberSearchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [memberSearchQuery, onSearchUsers]);

  const handleAddMember = async (
    userId: string,
    role: "admin" | "member" | "observer" = "member"
  ) => {
    if (onAddBoardMember) {
      const newMember = await onAddBoardMember(boardId, userId, role);
      if (newMember) {
        setBoardMembers((prev) => [...prev, newMember]);
        setMemberSearchQuery("");
        setShowAddMemberDropdown(false);
        toast.success("Member added successfully");
      }
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (onRemoveBoardMember) {
      const success = await onRemoveBoardMember(memberId);
      if (success) {
        setBoardMembers((prev) => prev.filter((m) => m.id !== memberId));
        toast.success("Member removed");
      }
    }
  };

  const handleUpdateMemberRole = async (
    memberId: string,
    newRole: "admin" | "member" | "observer"
  ) => {
    if (onUpdateMemberRole) {
      const success = await onUpdateMemberRole(memberId, newRole);
      if (success) {
        setBoardMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
        );
        toast.success("Role updated");
      }
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-[#5865f2]/20 text-[#5865f2] border-[#5865f2]/30 text-xs">
            <Shield size={10} className="mr-1" />
            Admin
          </Badge>
        );
      case "observer":
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">
            <Eye size={10} className="mr-1" />
            Observer
          </Badge>
        );
      default:
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
            <Users size={10} className="mr-1" />
            Member
          </Badge>
        );
    }
  };

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
            className="text-gray-400 hover:text-white hover:bg-[#404249] h-8 px-2 border border-[#404249]"
            title="Board Menu - Change colors, settings, and more"
          >
            <MoreHorizontal size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-72 bg-[#2b2d31] border-[#1e1f22]"
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-[#1e1f22] bg-[#313338]">
            <div className="font-semibold text-gray-100">Board Menu</div>
            <div className="text-xs text-gray-400">
              Customize your board appearance and settings
            </div>
          </div>

          {/* Board Actions */}
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 mt-2">
            Board Actions
          </div>

          <DropdownMenuItem
            onClick={() => setShowSettingsDialog(true)}
            className="text-gray-200 focus:text-white focus:bg-[#404249]"
          >
            <Settings size={16} className="mr-2" />
            Board Settings
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setShowBackgroundDialog(true)}
            className="text-gray-200 focus:text-white focus:bg-[#404249]"
          >
            <Palette size={16} className="mr-2" />
            Change Background
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => onUpdateBoard({ isFavorite: !isFavorite })}
            className="text-gray-200 focus:text-white focus:bg-[#404249]"
          >
            <Star
              size={16}
              className={`mr-2 ${
                isFavorite ? "fill-yellow-500 text-yellow-500" : ""
              }`}
            />
            {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setShowActivityDialog(true)}
            className="text-gray-200 focus:text-white focus:bg-[#404249]"
          >
            <Activity size={16} className="mr-2" />
            Activity Log
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-[#404249]" />

          {/* Visibility */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-gray-200 focus:text-white focus:bg-[#404249]">
              <Eye size={16} className="mr-2" />
              Visibility: {visibility}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-[#2b2d31] border-[#1e1f22]">
              <DropdownMenuItem
                onClick={() => onUpdateBoard({ visibility: "private" })}
                className="text-gray-200 focus:text-white focus:bg-[#404249]"
              >
                <Lock size={14} className="mr-2" />
                Private
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onUpdateBoard({ visibility: "team" })}
                className="text-gray-200 focus:text-white focus:bg-[#404249]"
              >
                <Users size={14} className="mr-2" />
                Team
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onUpdateBoard({ visibility: "public" })}
                className="text-gray-200 focus:text-white focus:bg-[#404249]"
              >
                <Globe size={14} className="mr-2" />
                Public
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator className="bg-[#404249]" />

          {/* More Actions */}
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
            More Actions
          </div>

          <DropdownMenuItem
            onClick={onDuplicateBoard}
            className="text-gray-200 focus:text-white focus:bg-[#404249]"
          >
            <Copy size={16} className="mr-2" />
            Duplicate Board
          </DropdownMenuItem>

          {onExportBoard && (
            <DropdownMenuItem
              onClick={onExportBoard}
              className="text-gray-200 focus:text-white focus:bg-[#404249]"
            >
              <Download size={16} className="mr-2" />
              Export Board
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={() => onUpdateBoard({ isArchived: !isArchived })}
            className="text-gray-200 focus:text-white focus:bg-[#404249]"
          >
            <Archive size={16} className="mr-2" />
            {isArchived ? "Unarchive Board" : "Archive Board"}
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-[#404249]" />

          <DropdownMenuItem
            onClick={onDeleteBoard}
            className="text-[#ed4245] focus:text-[#ed4245] focus:bg-[#ed4245]/10"
          >
            <Trash2 size={16} className="mr-2" />
            Delete Board
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Board Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] bg-[#2b2d31] border-[#1e1f22]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Settings className="text-[#5865f2]" size={24} />
              Board Settings
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Configure your board settings and preferences.
            </DialogDescription>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-[#404249]">
            <button
              onClick={() => setSettingsTab("general")}
              className={`px-4 py-2 text-sm transition-colors ${
                settingsTab === "general"
                  ? "border-b-2 border-[#5865f2] text-[#5865f2] font-medium"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              General
            </button>
            <button
              onClick={() => setSettingsTab("members")}
              className={`px-4 py-2 text-sm transition-colors ${
                settingsTab === "members"
                  ? "border-b-2 border-[#5865f2] text-[#5865f2] font-medium"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Members
            </button>
            <button
              onClick={() => setSettingsTab("advanced")}
              className={`px-4 py-2 text-sm transition-colors ${
                settingsTab === "advanced"
                  ? "border-b-2 border-[#5865f2] text-[#5865f2] font-medium"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Advanced
            </button>
          </div>

          <ScrollArea className="max-h-[60vh]">
            {settingsTab === "general" && (
              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-gray-300">
                    Board Name
                  </Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-[#1e1f22] border-[#404249] text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description" className="text-gray-300">
                    Description
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={4}
                    className="bg-[#1e1f22] border-[#404249] text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Visibility</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setEditVisibility("private")}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        editVisibility === "private"
                          ? "border-[#5865f2] bg-[#5865f2]/10"
                          : "border-[#404249] hover:border-[#5865f2]/50 bg-[#1e1f22]"
                      }`}
                    >
                      <Lock size={20} className="mx-auto mb-1 text-gray-300" />
                      <div className="text-xs font-medium text-gray-300">
                        Private
                      </div>
                    </button>
                    <button
                      onClick={() => setEditVisibility("team")}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        editVisibility === "team"
                          ? "border-[#5865f2] bg-[#5865f2]/10"
                          : "border-[#404249] hover:border-[#5865f2]/50 bg-[#1e1f22]"
                      }`}
                    >
                      <Users size={20} className="mx-auto mb-1 text-gray-300" />
                      <div className="text-xs font-medium text-gray-300">
                        Team
                      </div>
                    </button>
                    <button
                      onClick={() => setEditVisibility("public")}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        editVisibility === "public"
                          ? "border-[#5865f2] bg-[#5865f2]/10"
                          : "border-[#404249] hover:border-[#5865f2]/50 bg-[#1e1f22]"
                      }`}
                    >
                      <Globe size={20} className="mx-auto mb-1 text-gray-300" />
                      <div className="text-xs font-medium text-gray-300">
                        Public
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {settingsTab === "members" && (
              <div className="p-4 space-y-4">
                {/* Add Member Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Add Members</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 h-8 bg-[#5865f2] hover:bg-[#4752c4] border-0 text-white"
                      onClick={() =>
                        setShowAddMemberDropdown(!showAddMemberDropdown)
                      }
                    >
                      <Plus size={14} />
                      Add
                    </Button>
                  </div>

                  {/* Add Member Dropdown */}
                  {showAddMemberDropdown && (
                    <div className="bg-[#1e1f22] rounded-lg p-3 space-y-3 border border-[#404249]">
                      <div className="relative">
                        <Search
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                        />
                        <Input
                          placeholder="Search users..."
                          value={memberSearchQuery}
                          onChange={(e) => setMemberSearchQuery(e.target.value)}
                          className="pl-9 bg-[#2b2d31] border-[#404249] text-white h-9"
                        />
                        {memberSearchQuery && (
                          <button
                            onClick={() => setMemberSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {/* Search Results */}
                      {memberSearchQuery.trim() && (
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {isSearching ? (
                            <p className="text-xs text-gray-500 py-2 text-center">
                              Searching...
                            </p>
                          ) : searchResults.length > 0 ? (
                            searchResults.map((user) => {
                              const isAlreadyMember = boardMembers.some(
                                (m) => m.user_id === user.id
                              );
                              return (
                                <div
                                  key={user.id}
                                  className="flex items-center justify-between p-2 rounded-lg hover:bg-[#2b2d31] transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-7 w-7">
                                      {user.avatar_url && (
                                        <AvatarImage src={user.avatar_url} />
                                      )}
                                      <AvatarFallback className="text-xs bg-[#5865f2] text-white">
                                        {user.username
                                          ?.slice(0, 2)
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm text-gray-200">
                                      {user.username}
                                    </span>
                                  </div>
                                  {isAlreadyMember ? (
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-gray-500"
                                    >
                                      Added
                                    </Badge>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs text-[#5865f2] hover:bg-[#5865f2]/10"
                                      onClick={() => handleAddMember(user.id)}
                                    >
                                      Add
                                    </Button>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs text-gray-500 py-2 text-center">
                              No users found
                            </p>
                          )}
                        </div>
                      )}

                      {/* Server Members (if available) */}
                      {!memberSearchQuery.trim() &&
                        serverMembers.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-500 uppercase tracking-wider">
                              Server Members
                            </p>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {serverMembers.map((user) => {
                                const isAlreadyMember = boardMembers.some(
                                  (m) => m.user_id === user.id
                                );
                                return (
                                  <div
                                    key={user.id}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[#2b2d31] transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-7 w-7">
                                        {user.avatar_url && (
                                          <AvatarImage src={user.avatar_url} />
                                        )}
                                        <AvatarFallback className="text-xs bg-[#5865f2] text-white">
                                          {user.username
                                            ?.slice(0, 2)
                                            .toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm text-gray-200">
                                        {user.username}
                                      </span>
                                    </div>
                                    {isAlreadyMember ? (
                                      <Badge
                                        variant="outline"
                                        className="text-xs text-gray-500"
                                      >
                                        Added
                                      </Badge>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs text-[#5865f2] hover:bg-[#5865f2]/10"
                                        onClick={() => handleAddMember(user.id)}
                                      >
                                        Add
                                      </Button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>

                <Separator className="bg-[#404249]" />

                {/* Current Members List */}
                <div className="space-y-3">
                  <Label className="text-gray-300">
                    Board Members ({boardMembers.length})
                  </Label>

                  {isLoadingMembers ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="animate-spin w-6 h-6 border-2 border-[#5865f2] border-t-transparent rounded-full mx-auto mb-2" />
                      <p className="text-sm">Loading members...</p>
                    </div>
                  ) : boardMembers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-[#1e1f22] rounded-lg">
                      <Users size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No members yet</p>
                      <p className="text-xs text-gray-600">
                        Add members to collaborate on this board
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {boardMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 bg-[#1e1f22] rounded-lg group hover:bg-[#252629] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              {member.user?.avatar_url && (
                                <AvatarImage src={member.user.avatar_url} />
                              )}
                              <AvatarFallback className="bg-[#5865f2] text-white text-sm">
                                {member.user?.username
                                  ?.slice(0, 2)
                                  .toUpperCase() || "??"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-200">
                                  {member.user?.username || "Unknown User"}
                                </span>
                                {member.user_id === currentUserId && (
                                  <Badge className="bg-[#5865f2]/20 text-[#5865f2] text-[10px] px-1.5">
                                    You
                                  </Badge>
                                )}
                              </div>
                              <div className="mt-0.5">
                                {getRoleBadge(member.role)}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Role Change Dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-gray-400 hover:text-white hover:bg-[#404249]"
                                >
                                  <ChevronDown size={14} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-40 bg-[#2b2d31] border-[#404249]"
                              >
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateMemberRole(member.id, "admin")
                                  }
                                  className={`text-gray-200 focus:bg-[#404249] ${
                                    member.role === "admin"
                                      ? "bg-[#5865f2]/10"
                                      : ""
                                  }`}
                                >
                                  <Shield
                                    size={14}
                                    className="mr-2 text-[#5865f2]"
                                  />
                                  Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateMemberRole(member.id, "member")
                                  }
                                  className={`text-gray-200 focus:bg-[#404249] ${
                                    member.role === "member"
                                      ? "bg-green-500/10"
                                      : ""
                                  }`}
                                >
                                  <Users
                                    size={14}
                                    className="mr-2 text-green-400"
                                  />
                                  Member
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateMemberRole(
                                      member.id,
                                      "observer"
                                    )
                                  }
                                  className={`text-gray-200 focus:bg-[#404249] ${
                                    member.role === "observer"
                                      ? "bg-gray-500/10"
                                      : ""
                                  }`}
                                >
                                  <Eye
                                    size={14}
                                    className="mr-2 text-gray-400"
                                  />
                                  Observer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Remove Member */}
                            {member.user_id !== currentUserId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                <UserMinus size={14} />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {settingsTab === "advanced" && (
              <div className="space-y-4 p-4">
                <div className="p-4 bg-[#faa61a]/10 border border-[#faa61a]/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Archive size={20} className="text-[#faa61a] mt-0.5" />
                    <div>
                      <div className="font-medium text-[#faa61a]">
                        Archive Board
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        Archived boards are hidden from view but can be restored
                        later.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 border-[#faa61a]/50 text-[#faa61a] hover:bg-[#faa61a]/10"
                        onClick={() => {
                          onUpdateBoard({ isArchived: !isArchived });
                          setShowSettingsDialog(false);
                        }}
                      >
                        {isArchived ? "Unarchive" : "Archive"} Board
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#ed4245]/10 border border-[#ed4245]/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Trash2 size={20} className="text-[#ed4245] mt-0.5" />
                    <div>
                      <div className="font-medium text-[#ed4245]">
                        Delete Board
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        Permanently delete this board and all its contents. This
                        action cannot be undone.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 text-[#ed4245] border-[#ed4245]/50 hover:bg-[#ed4245]/10"
                        onClick={() => {
                          if (
                            confirm(
                              `Delete "${boardName}"? This cannot be undone.`
                            )
                          ) {
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

          <div className="flex gap-3 pt-4 border-t border-[#404249]">
            <Button
              variant="outline"
              onClick={() => setShowSettingsDialog(false)}
              className="flex-1 bg-[#1e1f22] border-[#404249] text-gray-200 hover:bg-[#404249]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSettings}
              className="flex-1 bg-[#5865f2] hover:bg-[#4752c4]"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Background Picker Dialog */}
      <Dialog
        open={showBackgroundDialog}
        onOpenChange={setShowBackgroundDialog}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] bg-[#2b2d31] border-[#1e1f22]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Palette className="text-[#5865f2]" size={24} />
              Change Board Background
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose from solid colors, gradients, or patterns to customize your
              board.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6 p-2">
              {/* Solid Colors */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-200">
                  <div className="w-4 h-4 rounded bg-blue-500" />
                  Solid Colors
                </h3>
                <div className="grid grid-cols-6 gap-3">
                  {SOLID_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleChangeBackground(color.value)}
                      className={`relative h-20 rounded-lg transition-all ${
                        color.value
                      } ${
                        boardColor === color.value
                          ? "ring-4 ring-offset-2 ring-offset-[#2b2d31] ring-[#5865f2] scale-105"
                          : "hover:scale-105 hover:shadow-lg"
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

              <Separator className="bg-[#404249]" />

              {/* Gradient Backgrounds */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-200">
                  <div className="w-4 h-4 rounded bg-linear-to-r from-blue-500 to-purple-500" />
                  Gradients
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {GRADIENT_BACKGROUNDS.map((bg) => (
                    <button
                      key={bg.value}
                      onClick={() => handleChangeBackground(bg.value)}
                      className={`relative h-24 rounded-lg transition-all ${
                        bg.value
                      } ${
                        boardColor === bg.value
                          ? "ring-4 ring-offset-2 ring-offset-[#2b2d31] ring-[#5865f2] scale-105"
                          : "hover:scale-105 hover:shadow-lg"
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

              <Separator className="bg-[#404249]" />

              {/* Pattern Backgrounds */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-200">
                  <Grid3x3 size={16} />
                  Patterns
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {PATTERN_BACKGROUNDS.map((bg) => (
                    <button
                      key={bg.value}
                      onClick={() => handleChangeBackground(bg.value)}
                      className={`relative h-24 rounded-lg transition-all ${
                        bg.value
                      } ${
                        boardColor === bg.value
                          ? "ring-4 ring-offset-2 ring-offset-[#2b2d31] ring-[#5865f2] scale-105"
                          : "hover:scale-105 hover:shadow-lg"
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
        <DialogContent className="max-w-2xl max-h-[90vh] bg-[#2b2d31] border-[#1e1f22]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Activity className="text-[#5865f2]" size={24} />
              Board Activity
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Recent actions and changes on this board.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 p-4">
              {/* Activity items should be fetched from database */}
              <div className="flex gap-3 p-3 bg-[#1e1f22] rounded-lg">
                <div className="w-8 h-8 bg-[#5865f2]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Tag size={16} className="text-[#5865f2]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-200">
                    <strong className="text-white">You</strong> changed the
                    board color
                  </p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 bg-[#1e1f22] rounded-lg">
                <div className="w-8 h-8 bg-[#57f287]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Settings size={16} className="text-[#57f287]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-200">
                    <strong className="text-white">You</strong> updated board
                    settings
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
