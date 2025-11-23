"use client";

import {
  AtSign,
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
  Video,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: "online" | "idle" | "dnd" | "offline";
  role: "owner" | "admin" | "moderator" | "member";
  customStatus?: string;
  joinedDate: string;
  lastActive?: string;
}

interface TeamMembersPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockMembers: TeamMember[] = [
  {
    id: "1",
    name: "Sarah Chen",
    email: "sarah.chen@company.com",
    avatar: "SC",
    status: "online",
    role: "owner",
    customStatus: "Building amazing things 🚀",
    joinedDate: "2024-01-15",
    lastActive: "now",
  },
  {
    id: "2",
    name: "Mike Johnson",
    email: "mike.j@company.com",
    avatar: "MJ",
    status: "online",
    role: "admin",
    customStatus: "In a meeting",
    joinedDate: "2024-02-01",
    lastActive: "5 min ago",
  },
  {
    id: "3",
    name: "Alex Kim",
    email: "alex.kim@company.com",
    avatar: "AK",
    status: "idle",
    role: "moderator",
    customStatus: "Away for lunch",
    joinedDate: "2024-02-10",
    lastActive: "15 min ago",
  },
  {
    id: "4",
    name: "John Doe",
    email: "john.doe@company.com",
    avatar: "JD",
    status: "dnd",
    role: "member",
    joinedDate: "2024-03-01",
    lastActive: "1 hour ago",
  },
  {
    id: "5",
    name: "Emily Davis",
    email: "emily.d@company.com",
    avatar: "ED",
    status: "online",
    role: "member",
    customStatus: "Coding 💻",
    joinedDate: "2024-03-15",
    lastActive: "now",
  },
  {
    id: "6",
    name: "Tom Wilson",
    email: "tom.w@company.com",
    avatar: "TW",
    status: "offline",
    role: "member",
    joinedDate: "2024-04-01",
    lastActive: "2 days ago",
  },
  {
    id: "7",
    name: "Lisa Anderson",
    email: "lisa.a@company.com",
    avatar: "LA",
    status: "online",
    role: "member",
    customStatus: "Available for tasks",
    joinedDate: "2024-04-10",
    lastActive: "now",
  },
  {
    id: "8",
    name: "David Brown",
    email: "david.b@company.com",
    avatar: "DB",
    status: "idle",
    role: "member",
    joinedDate: "2024-05-01",
    lastActive: "30 min ago",
  },
];

const getRoleIcon = (role: TeamMember["role"]) => {
  switch (role) {
    case "owner":
      return <Crown size={14} className="text-yellow-500" />;
    case "admin":
      return <Shield size={14} className="text-red-500" />;
    case "moderator":
      return <Star size={14} className="text-blue-500" />;
    default:
      return null;
  }
};

const getRoleBadgeColor = (role: TeamMember["role"]) => {
  switch (role) {
    case "owner":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "admin":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    case "moderator":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    default:
      return "bg-gray-500/10 text-gray-400 border-gray-500/20";
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

export function TeamMembersPanel({ isOpen, onClose }: TeamMembersPanelProps) {
  const [members, setMembers] = useState<TeamMember[]>(mockMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] =
    useState<TeamMember["role"]>("member");
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedMembers = {
    online: filteredMembers.filter((m) => m.status === "online"),
    idle: filteredMembers.filter((m) => m.status === "idle"),
    dnd: filteredMembers.filter((m) => m.status === "dnd"),
    offline: filteredMembers.filter((m) => m.status === "offline"),
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
      joinedDate: new Date().toISOString().split("T")[0],
    };

    setMembers([...members, newMember]);
    setNewMemberEmail("");
    setNewMemberRole("member");
    setShowAddMember(false);
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm("Are you sure you want to remove this member?")) {
      setMembers(members.filter((m) => m.id !== memberId));
      setSelectedMember(null);
    }
  };

  const handleChangeRole = (memberId: string, newRole: TeamMember["role"]) => {
    setMembers(
      members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl h-[80vh] bg-[#313338] border-[#1e1f22] p-0"
        aria-describedby={undefined}
      >
        <DialogHeader className="px-6 py-4 border-b border-[#1e1f22]">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-white text-xl">
                Team Members
              </DialogTitle>
              <p className="text-gray-400 text-sm mt-1">
                {members.length} {members.length === 1 ? "member" : "members"}
              </p>
            </div>
            <Button
              onClick={() => setShowAddMember(true)}
              className="bg-[#5865f2] hover:bg-[#4752c4] text-white"
            >
              <UserPlus size={16} className="mr-2" />
              Add Member
            </Button>
          </div>
        </DialogHeader>

        {/* Add Member Form */}
        {showAddMember && (
          <div className="px-6 py-4 bg-[#2b2d31] border-b border-[#1e1f22]">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-gray-400 text-xs mb-1 block">
                  Email Address
                </label>
                <Input
                  placeholder="name@company.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="bg-[#1e1f22] border-[#3f4147] text-white"
                />
              </div>
              <div className="w-40">
                <label className="text-gray-400 text-xs mb-1 block">Role</label>
                <Select
                  value={newMemberRole}
                  onValueChange={(value) =>
                    setNewMemberRole(value as TeamMember["role"])
                  }
                >
                  <SelectTrigger className="bg-[#1e1f22] border-[#3f4147] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1f22] border-[#3f4147]">
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAddMember}
                className="bg-[#3ba55d] hover:bg-[#2d7d46] text-white"
              >
                Add
              </Button>
              <Button
                onClick={() => {
                  setShowAddMember(false);
                  setNewMemberEmail("");
                }}
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="px-6 py-3 border-b border-[#1e1f22]">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#1e1f22] border-[#3f4147] text-white pl-10"
            />
          </div>
        </div>

        {/* Members List */}
        <ScrollArea className="flex-1 px-6 py-4">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-[#1e1f22] border-[#3f4147] mb-4">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-[#5865f2]"
              >
                All ({filteredMembers.length})
              </TabsTrigger>
              <TabsTrigger
                value="online"
                className="data-[state=active]:bg-[#5865f2]"
              >
                Online ({groupedMembers.online.length})
              </TabsTrigger>
              <TabsTrigger
                value="offline"
                className="data-[state=active]:bg-[#5865f2]"
              >
                Offline (
                {groupedMembers.offline.length +
                  groupedMembers.idle.length +
                  groupedMembers.dnd.length}
                )
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              <div className="space-y-2">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 bg-[#2b2d31] rounded-lg hover:bg-[#35363c] transition-colors group"
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-[#5865f2] text-white">
                          {member.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#2b2d31] ${getStatusColor(
                          member.status
                        )}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white">{member.name}</span>
                        {getRoleIcon(member.role)}
                        <Badge
                          variant="outline"
                          className={`text-xs ${getRoleBadgeColor(
                            member.role
                          )}`}
                        >
                          {member.role}
                        </Badge>
                      </div>
                      <div className="text-gray-400 text-sm">
                        {member.email}
                      </div>
                      {member.customStatus && (
                        <div className="text-gray-500 text-xs mt-0.5">
                          {member.customStatus}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white p-2 h-auto"
                        title="Send Message"
                      >
                        <MessageSquare size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white p-2 h-auto"
                        title="Voice Call"
                      >
                        <Phone size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white p-2 h-auto"
                        title="Video Call"
                      >
                        <Video size={16} />
                      </Button>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white p-2 h-auto"
                          >
                            <MoreVertical size={16} />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-1 bg-[#1e1f22] border-[#3f4147]">
                          <button className="w-full px-3 py-2 text-left text-gray-300 hover:bg-[#5865f2] hover:text-white rounded flex items-center gap-2 text-sm">
                            <AtSign size={14} />
                            Mention
                          </button>
                          <button className="w-full px-3 py-2 text-left text-gray-300 hover:bg-[#5865f2] hover:text-white rounded flex items-center gap-2 text-sm">
                            <Mail size={14} />
                            Send Email
                          </button>
                          <Separator className="my-1 bg-[#3f4147]" />
                          {member.role !== "owner" && (
                            <>
                              <button
                                onClick={() => setSelectedMember(member)}
                                className="w-full px-3 py-2 text-left text-gray-300 hover:bg-[#5865f2] hover:text-white rounded flex items-center gap-2 text-sm"
                              >
                                <SettingsIcon size={14} />
                                Change Role
                              </button>
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="w-full px-3 py-2 text-left text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded flex items-center gap-2 text-sm"
                              >
                                <UserMinus size={14} />
                                Remove Member
                              </button>
                            </>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="online" className="mt-0">
              <div className="space-y-2">
                {groupedMembers.online.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 bg-[#2b2d31] rounded-lg hover:bg-[#35363c] transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-[#5865f2] text-white">
                          {member.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#2b2d31] bg-green-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white">{member.name}</span>
                        {getRoleIcon(member.role)}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {member.customStatus || "Online"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="offline" className="mt-0">
              <div className="space-y-2">
                {[
                  ...groupedMembers.offline,
                  ...groupedMembers.idle,
                  ...groupedMembers.dnd,
                ].map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 bg-[#2b2d31] rounded-lg hover:bg-[#35363c] transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12 opacity-60">
                        <AvatarFallback className="bg-[#5865f2] text-white">
                          {member.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#2b2d31] ${getStatusColor(
                          member.status
                        )}`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white">{member.name}</span>
                        {getRoleIcon(member.role)}
                      </div>
                      <div className="text-gray-500 text-sm">
                        Last active: {member.lastActive}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        {/* Change Role Dialog */}
        {selectedMember && (
          <Dialog
            open={!!selectedMember}
            onOpenChange={() => setSelectedMember(null)}
          >
            <DialogContent className="bg-[#313338] border-[#1e1f22]">
              <DialogHeader>
                <DialogTitle className="text-white">
                  Change Role for {selectedMember.name}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Select a new role for {selectedMember.name}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    Select Role
                  </label>
                  <Select
                    value={selectedMember.role}
                    onValueChange={(value) => {
                      handleChangeRole(
                        selectedMember.id,
                        value as TeamMember["role"]
                      );
                      setSelectedMember(null);
                    }}
                  >
                    <SelectTrigger className="bg-[#1e1f22] border-[#3f4147] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1f22] border-[#3f4147]">
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-gray-400 text-sm space-y-2">
                  <p>
                    <strong className="text-white">Member:</strong> Can view and
                    participate in channels
                  </p>
                  <p>
                    <strong className="text-white">Moderator:</strong> Can
                    manage messages and help moderate
                  </p>
                  <p>
                    <strong className="text-white">Admin:</strong> Can manage
                    members and server settings
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
