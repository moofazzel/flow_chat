"use client";

import { createClient } from "@/utils/supabase/client";
import {
  Calendar,
  Crown,
  MessageSquare,
  MoreVertical,
  Search,
  Settings as SettingsIcon,
  Shield,
  Star,
  UserMinus,
  Users,
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
  username?: string;
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
  serverId?: string;
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
    username: string;
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
      className={`group relative flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-[#2b2d31] rounded-lg sm:rounded-xl hover:bg-[#35373c] transition-all duration-200 border border-transparent hover:border-[#404249]/50 ${
        isCompact ? "py-2" : ""
      }`}
    >
      {/* Avatar with status indicator */}
      <div className="relative shrink-0">
        <Avatar
          className={`${
            isCompact ? "h-8 w-8 sm:h-10 sm:w-10" : "h-10 w-10 sm:h-12 sm:w-12"
          } ring-2 ring-[#1e1f22] ring-offset-1 sm:ring-offset-2 ring-offset-[#2b2d31]`}
        >
          {member.avatar_url ? (
            <AvatarImage
              src={member.avatar_url}
              alt={member.name}
              className="object-cover"
            />
          ) : null}
          <AvatarFallback className="bg-linear-to-br from-[#5865f2] to-[#7289da] text-white font-semibold text-xs sm:text-sm">
            {member.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 sm:border-[3px] border-[#2b2d31] ${getStatusColor(
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
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          <span className="text-white font-medium text-sm sm:text-base truncate max-w-[100px] sm:max-w-none">
            {member.name}
          </span>
          {member.username && (
            <span className="text-gray-500 text-xs sm:text-sm hidden xs:inline">
              @{member.username}
            </span>
          )}
          {getRoleIcon(member.role)}
          <Badge
            variant="outline"
            className={`text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0 h-4 sm:h-5 font-medium capitalize ${getRoleBadgeStyle(
              member.role
            )}`}
          >
            {member.role}
          </Badge>
        </div>
        <div className="text-gray-400 text-xs sm:text-sm truncate">
          {member.email}
        </div>
        {!isCompact && (
          <div className="hidden sm:flex items-center gap-1 text-gray-500 text-xs mt-1">
            <Calendar size={10} />
            <span>Joined {formattedDate}</span>
          </div>
        )}
      </div>

      {/* Quick Actions - Show on hover for desktop, always visible on mobile */}
      <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
        {/* Send Message Button */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex text-gray-400 hover:text-white hover:bg-[#404249] p-2 h-8 w-8 rounded-lg"
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

        {/* More Options Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-[#404249] p-1.5 sm:p-2 h-7 w-7 sm:h-8 sm:w-8 rounded-lg"
            >
              <MoreVertical size={14} className="sm:hidden" />
              <MoreVertical size={16} className="hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 sm:w-52 bg-[#1e1f22] border-[#3f4147] shadow-xl"
          >
            {/* Send Message option for mobile */}
            <DropdownMenuItem className="sm:hidden text-gray-300 hover:bg-[#5865f2] hover:text-white focus:bg-[#5865f2] focus:text-white cursor-pointer">
              <MessageSquare size={14} className="mr-2" />
              Send Message
            </DropdownMenuItem>
            {member.role !== "owner" && (
              <>
                <DropdownMenuSeparator className="sm:hidden bg-[#3f4147]" />
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
    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-[#2b2d31] rounded-lg sm:rounded-xl animate-pulse">
      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[#404249] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 sm:h-4 w-24 sm:w-32 bg-[#404249] rounded" />
        <div className="h-2 sm:h-3 w-32 sm:w-48 bg-[#404249] rounded" />
      </div>
    </div>
  );
}

// Empty State
function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center px-4">
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#404249]/50 flex items-center justify-center mb-3 sm:mb-4">
        <Users size={24} className="text-gray-500 sm:hidden" />
        <Users size={32} className="text-gray-500 hidden sm:block" />
      </div>
      <h3 className="text-white font-medium text-sm sm:text-base mb-1">
        {searchQuery ? "No members found" : "No team members yet"}
      </h3>
      <p className="text-gray-400 text-xs sm:text-sm max-w-xs">
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
  serverId: propServerId,
}: TeamMembersPanelProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [currentServerId, setCurrentServerId] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch members when panel opens
  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        let targetServerId = propServerId;

        // If no serverId provided but channelId is, get the server from channel
        if (!targetServerId && channelId) {
          const { data: channel, error: channelError } = await supabase
            .from("channels")
            .select("server_id")
            .eq("id", channelId)
            .single();

          if (channelError) throw channelError;
          targetServerId = channel?.server_id;
        }

        if (!targetServerId) {
          setLoading(false);
          return;
        }

        setCurrentServerId(targetServerId);

        // Fetch server members with user details
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
              username,
              full_name,
              avatar_url
            )
          `
          )
          .eq("server_id", targetServerId);

        if (membersError) throw membersError;

        if (serverMembers) {
          const formattedMembers: TeamMember[] = (
            serverMembers as unknown as ServerMemberWithUser[]
          ).map((member) => ({
            id: member.users?.id || member.user_id,
            name:
              member.users?.full_name ||
              member.users?.username ||
              member.users?.email?.split("@")[0] ||
              "Unknown",
            username: member.users?.username,
            email: member.users?.email || "",
            avatar: member.users?.avatar_url || "",
            avatar_url: member.users?.avatar_url || undefined,
            status: "online" as const,
            role: (member.role || "member") as TeamMember["role"],
            joinedDate: member.joined_at || new Date().toISOString(),
          }));
          setMembers(formattedMembers);
        }
      } catch (error) {
        console.error("Error fetching members:", error);
        toast.error("Failed to load team members");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && (channelId || propServerId)) {
      fetchMembers();
    }
  }, [isOpen, channelId, propServerId, supabase]);

  // Real-time subscription for member changes
  useEffect(() => {
    if (!isOpen || !currentServerId) return;

    const channel = supabase
      .channel(`server-members-panel-${currentServerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "server_members",
          filter: `server_id=eq.${currentServerId}`,
        },
        async (payload) => {
          console.log("New member joined:", payload);
          const newMemberId = payload.new.user_id;

          // Fetch the new member's details
          const { data: userData } = await supabase
            .from("users")
            .select("id, email, username, full_name, avatar_url")
            .eq("id", newMemberId)
            .single();

          if (userData) {
            const newMember: TeamMember = {
              id: userData.id,
              name:
                userData.full_name ||
                userData.username ||
                userData.email?.split("@")[0] ||
                "Unknown",
              username: userData.username,
              email: userData.email || "",
              avatar: userData.avatar_url || "",
              avatar_url: userData.avatar_url || undefined,
              status: "online" as const,
              role: (payload.new.role || "member") as TeamMember["role"],
              joinedDate: payload.new.joined_at || new Date().toISOString(),
            };

            setMembers((prev) => {
              // Check if member already exists
              if (prev.some((m) => m.id === newMember.id)) return prev;
              return [...prev, newMember];
            });

            toast.info(`${newMember.name} joined the server`);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "server_members",
          filter: `server_id=eq.${currentServerId}`,
        },
        (payload) => {
          console.log("Member left:", payload);
          const removedUserId = payload.old.user_id;
          setMembers((prev) => prev.filter((m) => m.id !== removedUserId));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "server_members",
          filter: `server_id=eq.${currentServerId}`,
        },
        (payload) => {
          console.log("Member updated:", payload);
          const updatedUserId = payload.new.user_id;
          const newRole = payload.new.role as TeamMember["role"];
          setMembers((prev) =>
            prev.map((m) =>
              m.id === updatedUserId ? { ...m, role: newRole } : m
            )
          );
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [isOpen, currentServerId, supabase]);

  // Filter members
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.username?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false);
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

  const handleRemoveMember = async (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member || !currentServerId) return;

    try {
      const { error } = await supabase
        .from("server_members")
        .delete()
        .eq("server_id", currentServerId)
        .eq("user_id", memberId);

      if (error) throw error;

      setMembers(members.filter((m) => m.id !== memberId));
      setMemberToRemove(null);
      toast.success(`${member.name} has been removed from the team`);
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
      setMemberToRemove(null);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: TeamMember["role"]) => {
    const member = members.find((m) => m.id === memberId);
    if (!member || !currentServerId) return;

    try {
      const { error } = await supabase
        .from("server_members")
        .update({ role: newRole })
        .eq("server_id", currentServerId)
        .eq("user_id", memberId);

      if (error) throw error;

      setMembers(
        members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
      setSelectedMember(null);
      toast.success(`${member.name}'s role has been changed to ${newRole}`);
    } catch (error) {
      console.error("Error changing role:", error);
      toast.error("Failed to change role");
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="w-[95vw] max-w-2xl max-h-[90vh] sm:max-h-[85vh] bg-[#313338] border-[#1e1f22] p-0 gap-0 overflow-hidden"
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#1e1f22] bg-linear-to-r from-[#313338] to-[#2b2d31]">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#5865f2]/20 flex items-center justify-center shrink-0">
                <Users size={18} className="text-[#5865f2] sm:hidden" />
                <Users size={20} className="text-[#5865f2] hidden sm:block" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-white text-base sm:text-lg font-semibold">
                  Team Members
                </DialogTitle>
                <p className="text-gray-400 text-xs sm:text-sm truncate">
                  {members.length} {members.length === 1 ? "member" : "members"}{" "}
                  in this channel
                </p>
              </div>
            </div>

            {/* Role Stats */}
            <div className="flex items-center gap-2 sm:gap-3 mt-3 sm:mt-4 flex-wrap">
              {roleStats.owner > 0 && (
                <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-yellow-500/10">
                  <Crown size={10} className="text-yellow-400 sm:hidden" />
                  <Crown
                    size={12}
                    className="text-yellow-400 hidden sm:block"
                  />
                  <span className="text-yellow-400 text-[10px] sm:text-xs font-medium">
                    {roleStats.owner}
                  </span>
                </div>
              )}
              {roleStats.admin > 0 && (
                <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-red-500/10">
                  <Shield size={10} className="text-red-400 sm:hidden" />
                  <Shield size={12} className="text-red-400 hidden sm:block" />
                  <span className="text-red-400 text-[10px] sm:text-xs font-medium">
                    {roleStats.admin}
                  </span>
                </div>
              )}
              {roleStats.moderator > 0 && (
                <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-blue-500/10">
                  <Star size={10} className="text-blue-400 sm:hidden" />
                  <Star size={12} className="text-blue-400 hidden sm:block" />
                  <span className="text-blue-400 text-[10px] sm:text-xs font-medium">
                    {roleStats.moderator}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-gray-500/10">
                <Users size={10} className="text-gray-400 sm:hidden" />
                <Users size={12} className="text-gray-400 hidden sm:block" />
                <span className="text-gray-400 text-[10px] sm:text-xs font-medium">
                  {roleStats.member}
                </span>
              </div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="px-4 sm:px-6 py-2 sm:py-3 border-b border-[#1e1f22] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 sm:hidden"
              />
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hidden sm:block"
              />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#1e1f22] border-[#3f4147] text-white text-sm pl-9 sm:pl-10 placeholder:text-gray-500 focus:border-[#5865f2] transition-colors h-9 sm:h-10"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-32 bg-[#1e1f22] border-[#3f4147] text-white text-sm focus:border-[#5865f2] h-9 sm:h-10">
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
          <ScrollArea className="flex-1 max-h-[50vh] sm:max-h-[45vh]">
            <div className="p-3 sm:p-4 space-y-2">
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
          <div className="px-4 sm:px-6 py-2 sm:py-3 border-t border-[#1e1f22] bg-[#2b2d31]">
            <p className="text-gray-500 text-[10px] sm:text-xs text-center">
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
          <DialogContent className="w-[95vw] max-w-md bg-[#313338] border-[#1e1f22] p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                  {selectedMember.avatar_url ? (
                    <AvatarImage src={selectedMember.avatar_url} />
                  ) : null}
                  <AvatarFallback className="bg-[#5865f2] text-white text-xs sm:text-sm">
                    {selectedMember.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">
                  Change Role for {selectedMember.name}
                </span>
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-xs sm:text-sm">
                Select a new role for this team member.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
              <Select
                value={selectedMember.role}
                onValueChange={(value) =>
                  handleChangeRole(
                    selectedMember.id,
                    value as TeamMember["role"]
                  )
                }
              >
                <SelectTrigger className="bg-[#1e1f22] border-[#3f4147] text-white text-sm">
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

              <div className="space-y-2 p-2 sm:p-3 bg-[#1e1f22] rounded-lg">
                <div className="flex items-start gap-2">
                  <Users size={12} className="text-gray-400 mt-0.5 sm:hidden" />
                  <Users
                    size={14}
                    className="text-gray-400 mt-0.5 hidden sm:block"
                  />
                  <div>
                    <p className="text-white text-xs sm:text-sm font-medium">
                      Member
                    </p>
                    <p className="text-gray-400 text-[10px] sm:text-xs">
                      Can view and participate in channels
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Star size={12} className="text-blue-400 mt-0.5 sm:hidden" />
                  <Star
                    size={14}
                    className="text-blue-400 mt-0.5 hidden sm:block"
                  />
                  <div>
                    <p className="text-white text-xs sm:text-sm font-medium">
                      Moderator
                    </p>
                    <p className="text-gray-400 text-[10px] sm:text-xs">
                      Can manage messages and moderate content
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield size={12} className="text-red-400 mt-0.5 sm:hidden" />
                  <Shield
                    size={14}
                    className="text-red-400 mt-0.5 hidden sm:block"
                  />
                  <div>
                    <p className="text-white text-xs sm:text-sm font-medium">
                      Admin
                    </p>
                    <p className="text-gray-400 text-[10px] sm:text-xs">
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
        <AlertDialogContent className="w-[95vw] max-w-md bg-[#313338] border-[#1e1f22] p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-base sm:text-lg">
              Remove Team Member
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 text-xs sm:text-sm">
              Are you sure you want to remove this member from the team? They
              will lose access to all channels and content in this server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="bg-transparent border-[#3f4147] text-white hover:bg-[#404249] hover:text-white text-sm">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                memberToRemove && handleRemoveMember(memberToRemove)
              }
              className="bg-red-500 hover:bg-red-600 text-white text-sm"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
