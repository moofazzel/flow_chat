"use client";

import { createClient } from "@/utils/supabase/client";
import {
  AtSign,
  Calendar,
  Crown,
  Mail,
  MessageSquare,
  MoreVertical,
  Phone,
  Search,
  Settings as SettingsIcon,
  Shield,
  Star,
  UserMinus,
  UserPlus,
  Users,
  Video,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  avatar_url?: string;
  status: "online" | "idle" | "dnd" | "offline";
  role: "owner" | "admin" | "moderator" | "member";
  customStatus?: string;
  joinedDate: string;
  lastActive?: string;
}

interface TeamMembersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  channelId?: string;
}

const getRoleIcon = (role: TeamMember["role"]) => {
  switch (role) {
    case "owner":
      return <Crown size={12} className="text-yellow-400" />;
    case "admin":
      return <Shield size={12} className="text-red-400" />;
    case "moderator":
      return <Star size={12} className="text-blue-400" />;
    default:
      return null;
  }
};

const getRoleBadgeStyle = (role: TeamMember["role"]) => {
  switch (role) {
    case "owner":
      return "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/30";
    case "admin":
      return "bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border-red-500/30";
    case "moderator":
      return "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30";
    default:
      return "bg-[#404249]/50 text-gray-400 border-gray-600/30";
  }
};

const getStatusColor = (status: TeamMember["status"]) => {
  switch (status) {
    case "online":
      return "bg-green-500";
    case "idle":
      return "bg-yellow-500";
    case "dnd":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

const getStatusLabel = (status: TeamMember["status"]) => {
  switch (status) {
    case "online":
      return "Online";
    case "idle":
      return "Idle";
    case "dnd":
      return "Do Not Disturb";
    default:
      return "Offline";
  }
};

interface ServerMemberWithUser {
  role: string;
  joined_at: string;
  user_id: string;
  users: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
  } | null;
}

// Member Card Component
function MemberCard({
  member,
  onChangeRole,
  onRemove,
  isCompact = false,
}: {
  member: TeamMember;
  onChangeRole: (member: TeamMember) => void;
  onRemove: (memberId: string) => void;
  isCompact?: boolean;
}) {
  const formattedDate = new Date(member.joinedDate).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  return (
    <div
      className={`group relative flex items-center gap-3 p-3 bg-[#2b2d31] rounded-xl hover:bg-[#35373c] transition-all duration-200 border border-transparent hover:border-[#404249]/50 ${
        isCompact ? "py-2" : ""
      }`}
    >
      {/* Avatar with status indicator */}
      <div className="relative shrink-0">
        <Avatar
          className={`${
            isCompact ? "h-10 w-10" : "h-12 w-12"
          } ring-2 ring-[#1e1f22] ring-offset-2 ring-offset-[#2b2d31]`}
        >
          {member.avatar_url ? (
            <AvatarImage
              src={member.avatar_url}
              alt={member.name}
              className="object-cover"
            />
          ) : null}
          <AvatarFallback className="bg-linear-to-br from-[#5865f2] to-[#7289da] text-white font-semibold">
            {member.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-[3px] border-[#2b2d31] ${getStatusColor(
                  member.status
                )} cursor-pointer`}
              />
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-[#1e1f22] border-[#3f4147] text-white"
            >
              {getStatusLabel(member.status)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Member Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-medium truncate">{member.name}</span>
          {getRoleIcon(member.role)}
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 h-5 font-medium capitalize ${getRoleBadgeStyle(
              member.role
            )}`}
          >
            {member.role}
          </Badge>
        </div>
        <div className="text-gray-400 text-sm truncate">{member.email}</div>
        {!isCompact && (
          <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
            <Calendar size={10} />
            <span>Joined {formattedDate}</span>
          </div>
        )}
      </div>

      {/* Quick Actions - Show on hover */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-[#404249] p-2 h-8 w-8 rounded-lg"
              >
                <MessageSquare size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-[#1e1f22] border-[#3f4147] text-white"
            >
              Send Message
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-green-400 hover:bg-green-500/10 p-2 h-8 w-8 rounded-lg"
              >
                <Phone size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-[#1e1f22] border-[#3f4147] text-white"
            >
              Voice Call
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 p-2 h-8 w-8 rounded-lg"
              >
                <Video size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-[#1e1f22] border-[#3f4147] text-white"
            >
              Video Call
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* More Options Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-[#404249] p-2 h-8 w-8 rounded-lg"
            >
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-52 bg-[#1e1f22] border-[#3f4147] shadow-xl"
          >
            <DropdownMenuItem className="text-gray-300 hover:bg-[#5865f2] hover:text-white focus:bg-[#5865f2] focus:text-white cursor-pointer">
              <AtSign size={14} className="mr-2" />
              Mention in Chat
            </DropdownMenuItem>
            <DropdownMenuItem className="text-gray-300 hover:bg-[#5865f2] hover:text-white focus:bg-[#5865f2] focus:text-white cursor-pointer">
              <Mail size={14} className="mr-2" />
              Send Email
            </DropdownMenuItem>
            {member.role !== "owner" && (
              <>
                <DropdownMenuSeparator className="bg-[#3f4147]" />
                <DropdownMenuItem
                  onClick={() => onChangeRole(member)}
                  className="text-gray-300 hover:bg-[#5865f2] hover:text-white focus:bg-[#5865f2] focus:text-white cursor-pointer"
                >
                  <SettingsIcon size={14} className="mr-2" />
                  Change Role
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onRemove(member.id)}
                  className="text-red-400 hover:bg-red-500/20 hover:text-red-300 focus:bg-red-500/20 focus:text-red-300 cursor-pointer"
                >
                  <UserMinus size={14} className="mr-2" />
                  Remove Member
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Loading Skeleton
function MemberSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 bg-[#2b2d31] rounded-xl animate-pulse">
      <div className="h-12 w-12 rounded-full bg-[#404249]" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-[#404249] rounded" />
        <div className="h-3 w-48 bg-[#404249] rounded" />
      </div>
    </div>
  );
}

// Empty State
function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-[#404249]/50 flex items-center justify-center mb-4">
        <Users size={32} className="text-gray-500" />
      </div>
      <h3 className="text-white font-medium mb-1">
        {searchQuery ? "No members found" : "No team members yet"}
      </h3>
      <p className="text-gray-400 text-sm max-w-xs">
        {searchQuery
          ? `No members match "${searchQuery}". Try a different search.`
          : "Invite team members to collaborate on this channel."}
      </p>
    </div>
  );
}

export function TeamMembersPanel({
  isOpen,
  onClose,
  channelId,
}: TeamMembersPanelProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] =
    useState<TeamMember["role"]>("member");
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>("all");
  const supabase = createClient();

  // Fetch members when panel opens
  useEffect(() => {
    const fetchChannelMembers = async () => {
      if (!channelId) return;

      setLoading(true);
      try {
        const { data: channel, error: channelError } = await supabase
          .from("channels")
          .select("server_id")
          .eq("id", channelId)
          .single();

        if (channelError) throw channelError;

        if (channel?.server_id) {
          const { data: serverMembers, error: membersError } = await supabase
            .from("server_members")
            .select(
              `
              role,
              joined_at,
              user_id,
              users:user_id (
                id,
                email,
                full_name,
                avatar_url
              )
            `
            )
            .eq("server_id", channel.server_id);

          if (membersError) throw membersError;

          if (serverMembers) {
            const formattedMembers: TeamMember[] = (
              serverMembers as unknown as ServerMemberWithUser[]
            ).map((member) => ({
              id: member.users?.id || member.user_id,
              name:
                member.users?.full_name ||
                member.users?.email?.split("@")[0] ||
                "Unknown",
              email: member.users?.email || "",
              avatar: member.users?.avatar_url || "",
              avatar_url: member.users?.avatar_url || undefined,
              status: "online" as const,
              role: (member.role || "member") as TeamMember["role"],
              joinedDate: member.joined_at || new Date().toISOString(),
            }));
            setMembers(formattedMembers);
          }
        }
      } catch (error) {
        console.error("Error fetching channel members:", error);
        toast.error("Failed to load team members");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && channelId) {
      fetchChannelMembers();
    }
  }, [isOpen, channelId, supabase]);

  // Filter members
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || member.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Group by role for stats
  const roleStats = {
    owner: members.filter((m) => m.role === "owner").length,
    admin: members.filter((m) => m.role === "admin").length,
    moderator: members.filter((m) => m.role === "moderator").length,
    member: members.filter((m) => m.role === "member").length,
  };

  const handleAddMember = () => {
    if (!newMemberEmail) return;

    const newMember: TeamMember = {
      id: `${members.length + 1}`,
      name: newMemberEmail.split("@")[0].replace(".", " "),
      email: newMemberEmail,
      avatar: newMemberEmail.substring(0, 2).toUpperCase(),
      status: "offline",
      role: newMemberRole,
      joinedDate: new Date().toISOString(),
    };

    setMembers([...members, newMember]);
    setNewMemberEmail("");
    setNewMemberRole("member");
    setShowAddMember(false);
    toast.success(`${newMember.name} has been added to the team`);
  };

  const handleRemoveMember = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    setMembers(members.filter((m) => m.id !== memberId));
    setMemberToRemove(null);
    if (member) {
      toast.success(`${member.name} has been removed from the team`);
    }
  };

  const handleChangeRole = (memberId: string, newRole: TeamMember["role"]) => {
    const member = members.find((m) => m.id === memberId);
    setMembers(
      members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
    setSelectedMember(null);
    if (member) {
      toast.success(`${member.name}'s role has been changed to ${newRole}`);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="max-w-2xl max-h-[85vh] bg-[#313338] border-[#1e1f22] p-0 gap-0 overflow-hidden"
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#1e1f22] bg-linear-to-r from-[#313338] to-[#2b2d31]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#5865f2]/20 flex items-center justify-center">
                  <Users size={20} className="text-[#5865f2]" />
                </div>
                <div>
                  <DialogTitle className="text-white text-lg font-semibold">
                    Team Members
                  </DialogTitle>
                  <p className="text-gray-400 text-sm">
                    {members.length}{" "}
                    {members.length === 1 ? "member" : "members"} in this
                    channel
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowAddMember(true)}
                className="bg-[#5865f2] hover:bg-[#4752c4] text-white gap-2 shadow-lg shadow-[#5865f2]/20"
              >
                <UserPlus size={16} />
                Invite
              </Button>
            </div>

            {/* Role Stats */}
            <div className="flex items-center gap-3 mt-4">
              {roleStats.owner > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-yellow-500/10">
                  <Crown size={12} className="text-yellow-400" />
                  <span className="text-yellow-400 text-xs font-medium">
                    {roleStats.owner}
                  </span>
                </div>
              )}
              {roleStats.admin > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/10">
                  <Shield size={12} className="text-red-400" />
                  <span className="text-red-400 text-xs font-medium">
                    {roleStats.admin}
                  </span>
                </div>
              )}
              {roleStats.moderator > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10">
                  <Star size={12} className="text-blue-400" />
                  <span className="text-blue-400 text-xs font-medium">
                    {roleStats.moderator}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-500/10">
                <Users size={12} className="text-gray-400" />
                <span className="text-gray-400 text-xs font-medium">
                  {roleStats.member}
                </span>
              </div>
            </div>
          </div>

          {/* Add Member Form */}
          {showAddMember && (
            <div className="px-6 py-4 bg-[#2b2d31] border-b border-[#1e1f22] animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">Invite New Member</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddMember(false);
                    setNewMemberEmail("");
                  }}
                  className="text-gray-400 hover:text-white h-8 w-8 p-0"
                >
                  <X size={16} />
                </Button>
              </div>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-gray-400 text-xs mb-1.5 block font-medium">
                    Email Address
                  </label>
                  <Input
                    placeholder="name@company.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="bg-[#1e1f22] border-[#3f4147] text-white placeholder:text-gray-500 focus:border-[#5865f2] transition-colors"
                  />
                </div>
                <div className="w-36">
                  <label className="text-gray-400 text-xs mb-1.5 block font-medium">
                    Role
                  </label>
                  <Select
                    value={newMemberRole}
                    onValueChange={(value) =>
                      setNewMemberRole(value as TeamMember["role"])
                    }
                  >
                    <SelectTrigger className="bg-[#1e1f22] border-[#3f4147] text-white focus:border-[#5865f2]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1f22] border-[#3f4147]">
                      <SelectItem
                        value="member"
                        className="text-gray-300 focus:bg-[#5865f2] focus:text-white"
                      >
                        Member
                      </SelectItem>
                      <SelectItem
                        value="moderator"
                        className="text-gray-300 focus:bg-[#5865f2] focus:text-white"
                      >
                        Moderator
                      </SelectItem>
                      <SelectItem
                        value="admin"
                        className="text-gray-300 focus:bg-[#5865f2] focus:text-white"
                      >
                        Admin
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddMember}
                  disabled={!newMemberEmail}
                  className="bg-[#3ba55d] hover:bg-[#2d7d46] text-white disabled:opacity-50"
                >
                  Send Invite
                </Button>
              </div>
            </div>
          )}

          {/* Search & Filter */}
          <div className="px-6 py-3 border-b border-[#1e1f22] flex items-center gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#1e1f22] border-[#3f4147] text-white pl-10 placeholder:text-gray-500 focus:border-[#5865f2] transition-colors"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-32 bg-[#1e1f22] border-[#3f4147] text-white focus:border-[#5865f2]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent className="bg-[#1e1f22] border-[#3f4147]">
                <SelectItem
                  value="all"
                  className="text-gray-300 focus:bg-[#5865f2] focus:text-white"
                >
                  All Roles
                </SelectItem>
                <SelectItem
                  value="owner"
                  className="text-gray-300 focus:bg-[#5865f2] focus:text-white"
                >
                  Owner
                </SelectItem>
                <SelectItem
                  value="admin"
                  className="text-gray-300 focus:bg-[#5865f2] focus:text-white"
                >
                  Admin
                </SelectItem>
                <SelectItem
                  value="moderator"
                  className="text-gray-300 focus:bg-[#5865f2] focus:text-white"
                >
                  Moderator
                </SelectItem>
                <SelectItem
                  value="member"
                  className="text-gray-300 focus:bg-[#5865f2] focus:text-white"
                >
                  Member
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Members List */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {loading ? (
                <>
                  <MemberSkeleton />
                  <MemberSkeleton />
                  <MemberSkeleton />
                </>
              ) : filteredMembers.length === 0 ? (
                <EmptyState searchQuery={searchQuery} />
              ) : (
                filteredMembers.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    onChangeRole={setSelectedMember}
                    onRemove={setMemberToRemove}
                  />
                ))
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-[#1e1f22] bg-[#2b2d31]">
            <p className="text-gray-500 text-xs text-center">
              Manage team permissions and roles from server settings
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      {selectedMember && (
        <Dialog
          open={!!selectedMember}
          onOpenChange={() => setSelectedMember(null)}
        >
          <DialogContent className="bg-[#313338] border-[#1e1f22] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {selectedMember.avatar_url ? (
                    <AvatarImage src={selectedMember.avatar_url} />
                  ) : null}
                  <AvatarFallback className="bg-[#5865f2] text-white">
                    {selectedMember.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                Change Role for {selectedMember.name}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Select a new role for this team member.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Select
                value={selectedMember.role}
                onValueChange={(value) =>
                  handleChangeRole(
                    selectedMember.id,
                    value as TeamMember["role"]
                  )
                }
              >
                <SelectTrigger className="bg-[#1e1f22] border-[#3f4147] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1e1f22] border-[#3f4147]">
                  <SelectItem
                    value="member"
                    className="text-gray-300 focus:bg-[#5865f2] focus:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <Users size={14} />
                      Member
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="moderator"
                    className="text-gray-300 focus:bg-[#5865f2] focus:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <Star size={14} className="text-blue-400" />
                      Moderator
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="admin"
                    className="text-gray-300 focus:bg-[#5865f2] focus:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <Shield size={14} className="text-red-400" />
                      Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="space-y-2 p-3 bg-[#1e1f22] rounded-lg">
                <div className="flex items-start gap-2">
                  <Users size={14} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-white text-sm font-medium">Member</p>
                    <p className="text-gray-400 text-xs">
                      Can view and participate in channels
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Star size={14} className="text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-white text-sm font-medium">Moderator</p>
                    <p className="text-gray-400 text-xs">
                      Can manage messages and moderate content
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield size={14} className="text-red-400 mt-0.5" />
                  <div>
                    <p className="text-white text-sm font-medium">Admin</p>
                    <p className="text-gray-400 text-xs">
                      Can manage members and server settings
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Remove Member Confirmation */}
      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={() => setMemberToRemove(null)}
      >
        <AlertDialogContent className="bg-[#313338] border-[#1e1f22]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Remove Team Member
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to remove this member from the team? They
              will lose access to all channels and content in this server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[#3f4147] text-white hover:bg-[#404249] hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                memberToRemove && handleRemoveMember(memberToRemove)
              }
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
