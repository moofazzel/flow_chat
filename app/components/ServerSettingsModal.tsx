"use client";

import {
  Bell,
  Crown,
  Info,
  Settings,
  Shield,
  Upload,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";

interface ServerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ServerSettingsModal({
  isOpen,
  onClose,
}: ServerSettingsModalProps) {
  const [serverName, setServerName] = useState("Workspace");
  const [serverDescription, setServerDescription] = useState(
    "A productive workspace for our team"
  );
  const [serverIcon, setServerIcon] = useState("WS");
  const [serverColor, setServerColor] = useState("#5865f2");

  const availableEmojis = [
    "🎯",
    "🚀",
    "⚡",
    "💼",
    "🎨",
    "🔥",
    "💡",
    "🌟",
    "🎮",
    "📱",
    "🏆",
    "💻",
    "📊",
    "🎪",
    "🌈",
    "⭐",
  ];

  const presetColors = [
    "#5865f2",
    "#3ba55d",
    "#f0b232",
    "#ed4245",
    "#9b59b6",
    "#e91e63",
  ];

  // Notification settings
  const [notifyAllMessages, setNotifyAllMessages] = useState(true);
  const [notifyMentions, setNotifyMentions] = useState(true);
  const [mobilePushEnabled, setMobilePushEnabled] = useState(true);

  // Privacy settings
  const [allowInvites, setAllowInvites] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);
  const [showOnlineMembers, setShowOnlineMembers] = useState(true);

  const handleSave = () => {
    toast.success("Server settings saved successfully!");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[900px] max-h-[90vh] bg-[#313338] border-none text-white p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-[#313338] via-[#2f3136] to-[#313338] border-b border-[#1e1f22] relative overflow-hidden">
          <div className="absolute inset-0 bg-[#5865f2] opacity-5" />
          <div className="relative">
            <DialogTitle className="text-white text-2xl flex items-center gap-3">
              <div className="p-2 bg-[#5865f2] rounded-lg">
                <Settings className="text-white" size={22} />
              </div>
              <div>
                <div className="font-bold">Server Settings</div>
                <div className="text-[#b5bac1] text-sm font-normal mt-0.5">
                  Manage your server configuration
                </div>
              </div>
            </DialogTitle>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview">
          <div className="flex h-[650px]">
            {/* Sidebar Navigation */}
            <div className="w-60 bg-[#2b2d31] border-r border-[#1e1f22] p-4">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  <div className="text-[#80848e] text-xs uppercase tracking-wider font-semibold px-2 py-1.5 flex items-center gap-2">
                    <Settings size={12} />
                    Server Management
                  </div>
                  <TabsList className="flex flex-col h-auto bg-transparent p-0 gap-1">
                    <TabsTrigger
                      value="overview"
                      className="w-full justify-start px-3 py-2.5 rounded-lg text-[#b5bac1] data-[state=active]:bg-[#5865f2] data-[state=active]:text-white hover:bg-[#35363c] hover:text-white transition-all group"
                    >
                      <Info
                        size={17}
                        className="mr-3 group-data-[state=active]:scale-110 transition-transform"
                      />
                      <span className="font-medium">Overview</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="roles"
                      className="w-full justify-start px-3 py-2.5 rounded-lg text-[#b5bac1] data-[state=active]:bg-[#5865f2] data-[state=active]:text-white hover:bg-[#35363c] hover:text-white transition-all group"
                    >
                      <Shield
                        size={17}
                        className="mr-3 group-data-[state=active]:scale-110 transition-transform"
                      />
                      <span className="font-medium">Roles</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="members"
                      className="w-full justify-start px-3 py-2.5 rounded-lg text-[#b5bac1] data-[state=active]:bg-[#5865f2] data-[state=active]:text-white hover:bg-[#35363c] hover:text-white transition-all group"
                    >
                      <Users
                        size={17}
                        className="mr-3 group-data-[state=active]:scale-110 transition-transform"
                      />
                      <span className="font-medium">Members</span>
                    </TabsTrigger>
                    <Separator className="bg-[#3f4147] my-3" />
                    <div className="text-[#80848e] text-xs uppercase tracking-wider font-semibold px-2 py-1.5 flex items-center gap-2">
                      <Bell size={12} />
                      Personal Settings
                    </div>
                    <TabsTrigger
                      value="notifications"
                      className="w-full justify-start px-3 py-2.5 rounded-lg text-[#b5bac1] data-[state=active]:bg-[#5865f2] data-[state=active]:text-white hover:bg-[#35363c] hover:text-white transition-all group"
                    >
                      <Bell
                        size={17}
                        className="mr-3 group-data-[state=active]:scale-110 transition-transform"
                      />
                      <span className="font-medium">Notifications</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="privacy"
                      className="w-full justify-start px-3 py-2.5 rounded-lg text-[#b5bac1] data-[state=active]:bg-[#5865f2] data-[state=active]:text-white hover:bg-[#35363c] hover:text-white transition-all group"
                    >
                      <Shield
                        size={17}
                        className="mr-3 group-data-[state=active]:scale-110 transition-transform"
                      />
                      <span className="font-medium">Privacy & Safety</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </ScrollArea>
            </div>
            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              <TabsContent
                value="overview"
                className="flex-1 m-0 data-[state=active]:flex flex-col"
              >
                <ScrollArea className="flex-1 px-8 py-6">
                  <div className="max-w-[650px] space-y-8">
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-[#5865f2]/10 rounded-lg">
                          <Info className="text-[#5865f2]" size={20} />
                        </div>
                        <div>
                          <h3 className="text-white text-xl font-bold">
                            Server Overview
                          </h3>
                          <p className="text-[#b5bac1] text-sm">
                            Customize your server&apos;s appearance and details
                          </p>
                        </div>
                      </div>
                      {/* Server Icon */}
                      <div className="p-5 bg-[#2b2d31] rounded-xl border border-[#1e1f22] mb-6 hover:border-[#5865f2] transition-all">
                        <Label className="text-white font-semibold text-base mb-4 block">
                          Server Icon
                        </Label>
                        <div className="flex items-start gap-6">
                          <div
                            className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-semibold shadow-lg flex-shrink-0"
                            style={{ backgroundColor: serverColor }}
                          >
                            {serverIcon}
                          </div>
                          <div className="flex-1 space-y-4">
                            <div>
                              <p className="text-[#b5bac1] text-sm mb-3">
                                Choose an emoji for your server
                              </p>
                              <div className="flex gap-2 flex-wrap mb-2">
                                {availableEmojis.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => setServerIcon(emoji)}
                                    className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl transition-all hover:scale-110 ${
                                      serverIcon === emoji
                                        ? "bg-[#5865f2] ring-2 ring-[#5865f2] ring-offset-2 ring-offset-[#2b2d31]"
                                        : "bg-[#1e1f22] hover:bg-[#404249]"
                                    }`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                              <Button
                                variant="ghost"
                                className="text-[#5865f2] hover:text-[#4752c4] hover:bg-[#5865f2]/10 h-auto p-2 text-sm"
                                onClick={() => {
                                  const randomEmoji =
                                    availableEmojis[
                                      Math.floor(
                                        Math.random() * availableEmojis.length
                                      )
                                    ];
                                  setServerIcon(randomEmoji);
                                }}
                              >
                                🎲 Random emoji
                              </Button>
                            </div>
                            <Separator className="bg-[#3f4147]" />
                            <div>
                              <p className="text-[#b5bac1] text-sm mb-3">
                                Or upload a custom image
                              </p>
                              <div className="flex gap-3">
                                <Button
                                  variant="outline"
                                  className="bg-[#5865f2] border-none text-white hover:bg-[#4752c4] h-10 px-5 text-sm font-medium"
                                >
                                  <Upload size={16} className="mr-2" />
                                  Upload Image
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="text-[#ed4245] hover:text-white hover:bg-[#ed4245] h-10 px-5 text-sm font-medium"
                                >
                                  Remove
                                </Button>
                              </div>
                              <p className="text-[#80848e] text-xs mt-2">
                                Minimum size: 512x512px • PNG, JPG, or GIF
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Server Name */}
                      <div className="space-y-2 mb-4">
                        <Label className="text-[#b5bac1] text-xs uppercase tracking-wider font-semibold">
                          Server Name
                        </Label>
                        <Input
                          value={serverName}
                          onChange={(e) => setServerName(e.target.value)}
                          className="bg-[#1e1f22] border-none text-white h-11"
                        />
                      </div>
                      {/* Server Description */}
                      <div className="space-y-2 mb-4">
                        <Label className="text-[#b5bac1] text-xs uppercase tracking-wider font-semibold">
                          Server Description
                        </Label>
                        <Textarea
                          value={serverDescription}
                          onChange={(e) => setServerDescription(e.target.value)}
                          className="bg-[#1e1f22] border-none text-white min-h-[100px]"
                          placeholder="What's your server about?"
                        />
                      </div>
                      {/* Server Color */}
                      <div className="space-y-3">
                        <Label className="text-[#b5bac1] text-xs uppercase tracking-wider font-semibold">
                          Server Color
                        </Label>
                        <div className="flex gap-3">
                          <Input
                            type="color"
                            value={serverColor}
                            onChange={(e) => setServerColor(e.target.value)}
                            className="w-20 h-11 bg-[#1e1f22] border-none cursor-pointer"
                          />
                          <Input
                            value={serverColor}
                            onChange={(e) => setServerColor(e.target.value)}
                            className="bg-[#1e1f22] border-none text-white h-11 flex-1"
                            placeholder="#5865f2"
                          />
                        </div>
                        <div className="flex gap-2">
                          {presetColors.map((color) => (
                            <button
                              key={color}
                              onClick={() => setServerColor(color)}
                              className={`w-10 h-10 rounded-full transition-all hover:scale-110 ${
                                serverColor === color
                                  ? "ring-2 ring-white ring-offset-2 ring-offset-[#2b2d31]"
                                  : ""
                              }`}
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Preview */}
                      <div className="p-5 bg-[#2b2d31] rounded-xl border border-[#1e1f22]">
                        <Label className="text-[#b5bac1] text-xs uppercase tracking-wider font-semibold mb-4 block">
                          Preview
                        </Label>
                        <div className="flex items-center gap-4">
                          <div
                            className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-semibold shadow-lg"
                            style={{ backgroundColor: serverColor }}
                          >
                            {serverIcon}
                          </div>
                          <div>
                            <div className="text-white font-semibold text-lg">
                              {serverName || "Workspace"}
                            </div>
                            <div className="text-[#b5bac1] text-sm">
                              Your personalized server
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent
                value="roles"
                className="flex-1 m-0 data-[state=active]:flex flex-col"
              >
                <ScrollArea className="flex-1 px-8 py-6">
                  <div className="max-w-[650px] space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#5865f2]/10 rounded-lg">
                          <Shield className="text-[#5865f2]" size={20} />
                        </div>
                        <div>
                          <h3 className="text-white text-xl font-bold">
                            Roles
                          </h3>
                          <p className="text-[#b5bac1] text-sm">
                            Manage permissions and hierarchies
                          </p>
                        </div>
                      </div>
                      <Button className="bg-[#5865f2] hover:bg-[#4752c4] h-10 px-5 font-medium shadow-lg">
                        Create Role
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {["Admin", "Moderator", "Member"].map((role, idx) => (
                        <div
                          key={role}
                          className="flex items-center justify-between p-4 bg-[#2b2d31] rounded-xl border border-[#1e1f22] hover:border-[#5865f2] hover:shadow-lg transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                idx === 0
                                  ? "bg-[#ed4245]"
                                  : idx === 1
                                  ? "bg-[#5865f2]"
                                  : "bg-[#99aab5]"
                              }`}
                            />
                            <div>
                              <div className="text-white font-medium flex items-center gap-2">
                                {role}
                                {idx === 0 && (
                                  <Crown size={14} className="text-[#f0b232]" />
                                )}
                              </div>
                              <div className="text-[#b5bac1] text-sm">
                                {idx === 0
                                  ? "Full access"
                                  : idx === 1
                                  ? "Can manage channels"
                                  : "Default permissions"}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            className="text-[#b5bac1] group-hover:text-white group-hover:bg-[#5865f2] h-9 px-4 font-medium transition-all"
                          >
                            Edit Role
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent
                value="members"
                className="flex-1 m-0 data-[state=active]:flex flex-col"
              >
                <ScrollArea className="flex-1 px-8 py-6">
                  <div className="max-w-[650px] space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#5865f2]/10 rounded-lg">
                          <Users className="text-[#5865f2]" size={20} />
                        </div>
                        <div>
                          <h3 className="text-white text-xl font-bold">
                            Members
                          </h3>
                          <p className="text-[#b5bac1] text-sm">
                            24 members • 12 online
                          </p>
                        </div>
                      </div>
                      <Input
                        placeholder="Search members..."
                        className="bg-[#1e1f22] border border-[#1e1f22] focus:border-[#5865f2] text-white h-10 w-72 rounded-lg transition-colors"
                      />
                    </div>
                    <div className="space-y-3">
                      {[
                        {
                          name: "John Doe",
                          role: "Admin",
                          status: "online",
                          avatar: "JD",
                        },
                        {
                          name: "Sarah Chen",
                          role: "Moderator",
                          status: "online",
                          avatar: "SC",
                        },
                        {
                          name: "Mike Johnson",
                          role: "Member",
                          status: "idle",
                          avatar: "MJ",
                        },
                        {
                          name: "Alex Kim",
                          role: "Member",
                          status: "dnd",
                          avatar: "AK",
                        },
                      ].map((member) => (
                        <div
                          key={member.name}
                          className="flex items-center justify-between p-4 bg-[#2b2d31] rounded-xl border border-[#1e1f22] hover:border-[#5865f2] hover:shadow-lg transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="text-sm bg-[#5865f2]">
                                  {member.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <div
                                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#2b2d31] ${
                                  member.status === "online"
                                    ? "bg-[#3ba55d]"
                                    : member.status === "idle"
                                    ? "bg-[#f0b232]"
                                    : "bg-[#ed4245]"
                                }`}
                              />
                            </div>
                            <div>
                              <div className="text-white font-medium">
                                {member.name}
                              </div>
                              <div className="text-[#b5bac1] text-sm">
                                {member.role}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            className="text-[#b5bac1] group-hover:text-white group-hover:bg-[#5865f2] h-9 px-4 font-medium transition-all"
                          >
                            Manage
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent
                value="notifications"
                className="flex-1 m-0 data-[state=active]:flex flex-col"
              >
                <ScrollArea className="flex-1 px-8 py-6">
                  <div className="max-w-[650px] space-y-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-[#5865f2]/10 rounded-lg">
                        <Bell className="text-[#5865f2]" size={20} />
                      </div>
                      <div>
                        <h3 className="text-white text-xl font-bold">
                          Notification Settings
                        </h3>
                        <p className="text-[#b5bac1] text-sm">
                          Control how you receive notifications
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between p-5 bg-[#2b2d31] rounded-xl border border-[#1e1f22] hover:border-[#5865f2] transition-all group">
                        <div className="flex-1">
                          <div className="text-white font-semibold text-base mb-1.5 group-hover:text-[#5865f2] transition-colors">
                            All Messages
                          </div>
                          <div className="text-[#b5bac1] text-sm leading-relaxed">
                            Get notified for every new message in this server
                          </div>
                        </div>
                        <Switch
                          checked={notifyAllMessages}
                          onCheckedChange={setNotifyAllMessages}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-start justify-between p-5 bg-[#2b2d31] rounded-xl border border-[#1e1f22] hover:border-[#5865f2] transition-all group">
                        <div className="flex-1">
                          <div className="text-white font-semibold text-base mb-1.5 group-hover:text-[#5865f2] transition-colors">
                            Mentions Only
                          </div>
                          <div className="text-[#b5bac1] text-sm leading-relaxed">
                            Only get notified when someone @mentions you
                          </div>
                        </div>
                        <Switch
                          checked={notifyMentions}
                          onCheckedChange={setNotifyMentions}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-start justify-between p-5 bg-[#2b2d31] rounded-xl border border-[#1e1f22] hover:border-[#5865f2] transition-all group">
                        <div className="flex-1">
                          <div className="text-white font-semibold text-base mb-1.5 group-hover:text-[#5865f2] transition-colors">
                            Mobile Push Notifications
                          </div>
                          <div className="text-[#b5bac1] text-sm leading-relaxed">
                            Receive push notifications on your mobile devices
                          </div>
                        </div>
                        <Switch
                          checked={mobilePushEnabled}
                          onCheckedChange={setMobilePushEnabled}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent
                value="privacy"
                className="flex-1 m-0 data-[state=active]:flex flex-col"
              >
                <ScrollArea className="flex-1 px-8 py-6">
                  <div className="max-w-[650px] space-y-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-[#5865f2]/10 rounded-lg">
                        <Shield className="text-[#5865f2]" size={20} />
                      </div>
                      <div>
                        <h3 className="text-white text-xl font-bold">
                          Privacy & Safety
                        </h3>
                        <p className="text-[#b5bac1] text-sm">
                          Manage access and security settings
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between p-5 bg-[#2b2d31] rounded-xl border border-[#1e1f22] hover:border-[#5865f2] transition-all group">
                        <div className="flex-1">
                          <div className="text-white font-semibold text-base mb-1.5 group-hover:text-[#5865f2] transition-colors">
                            Allow Invites
                          </div>
                          <div className="text-[#b5bac1] text-sm leading-relaxed">
                            Let members invite new people to the server
                          </div>
                        </div>
                        <Switch
                          checked={allowInvites}
                          onCheckedChange={setAllowInvites}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-start justify-between p-5 bg-[#2b2d31] rounded-xl border border-[#1e1f22] hover:border-[#5865f2] transition-all group">
                        <div className="flex-1">
                          <div className="text-white font-semibold text-base mb-1.5 group-hover:text-[#5865f2] transition-colors">
                            Require Approval
                          </div>
                          <div className="text-[#b5bac1] text-sm leading-relaxed">
                            New members must be approved by admins before
                            joining
                          </div>
                        </div>
                        <Switch
                          checked={requireApproval}
                          onCheckedChange={setRequireApproval}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-start justify-between p-5 bg-[#2b2d31] rounded-xl border border-[#1e1f22] hover:border-[#5865f2] transition-all group">
                        <div className="flex-1">
                          <div className="text-white font-semibold text-base mb-1.5 group-hover:text-[#5865f2] transition-colors">
                            Show Online Members
                          </div>
                          <div className="text-[#b5bac1] text-sm leading-relaxed">
                            Display who&apos;s currently online in the sidebar
                          </div>
                        </div>
                        <Switch
                          checked={showOnlineMembers}
                          onCheckedChange={setShowOnlineMembers}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
              {/* Footer */}
              <div className="px-8 py-5 bg-gradient-to-t from-[#2b2d31] to-[#313338] border-t border-[#1e1f22] flex justify-between items-center">
                <div className="flex items-center gap-2 text-[#80848e] text-sm">
                  <div className="w-2 h-2 rounded-full bg-[#23a559] animate-pulse" />
                  <span>All changes are auto-saved</span>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    className="text-white hover:text-white hover:bg-[#4e5058] h-11 px-6 font-medium"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="bg-[#5865f2] hover:bg-[#4752c4] text-white h-11 px-8 font-medium shadow-lg"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
