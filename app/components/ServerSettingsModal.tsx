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
      <DialogContent className="max-w-[800px] max-h-[85vh] bg-[#313338] border-none text-white p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-b from-[#313338] to-[#2b2d31] border-b border-[#1e1f22]">
          <DialogTitle className="text-white text-2xl flex items-center gap-2">
            <Settings className="text-[#5865f2]" size={24} />
            Server Settings
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[600px]">
          {/* Sidebar Navigation */}
          <div className="w-[220px] bg-[#2b2d31] border-r border-[#1e1f22] p-3">
            <ScrollArea className="h-full">
              <div className="space-y-1">
                <div className="text-[#b5bac1] text-xs uppercase tracking-wider font-semibold px-2 py-2">
                  Server Settings
                </div>
                <Tabs
                  defaultValue="overview"
                  orientation="vertical"
                  className="w-full"
                >
                  <TabsList className="flex flex-col h-auto bg-transparent p-0 gap-0.5">
                    <TabsTrigger
                      value="overview"
                      className="w-full justify-start px-3 py-2 rounded text-[#b5bac1] data-[state=active]:bg-[#404249] data-[state=active]:text-white hover:bg-[#35363c] hover:text-white transition-colors"
                    >
                      <Info size={16} className="mr-2" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="roles"
                      className="w-full justify-start px-3 py-2 rounded text-[#b5bac1] data-[state=active]:bg-[#404249] data-[state=active]:text-white hover:bg-[#35363c] hover:text-white transition-colors"
                    >
                      <Shield size={16} className="mr-2" />
                      Roles
                    </TabsTrigger>
                    <TabsTrigger
                      value="members"
                      className="w-full justify-start px-3 py-2 rounded text-[#b5bac1] data-[state=active]:bg-[#404249] data-[state=active]:text-white hover:bg-[#35363c] hover:text-white transition-colors"
                    >
                      <Users size={16} className="mr-2" />
                      Members
                    </TabsTrigger>

                    <Separator className="bg-[#3f4147] my-2" />

                    <div className="text-[#b5bac1] text-xs uppercase tracking-wider font-semibold px-2 py-2">
                      User Settings
                    </div>

                    <TabsTrigger
                      value="notifications"
                      className="w-full justify-start px-3 py-2 rounded text-[#b5bac1] data-[state=active]:bg-[#404249] data-[state=active]:text-white hover:bg-[#35363c] hover:text-white transition-colors"
                    >
                      <Bell size={16} className="mr-2" />
                      Notifications
                    </TabsTrigger>
                    <TabsTrigger
                      value="privacy"
                      className="w-full justify-start px-3 py-2 rounded text-[#b5bac1] data-[state=active]:bg-[#404249] data-[state=active]:text-white hover:bg-[#35363c] hover:text-white transition-colors"
                    >
                      <Shield size={16} className="mr-2" />
                      Privacy
                    </TabsTrigger>
                  </TabsList>

                  {/* Content Area */}
                  <div className="hidden">
                    <TabsContent value="overview" />
                    <TabsContent value="roles" />
                    <TabsContent value="members" />
                    <TabsContent value="notifications" />
                    <TabsContent value="privacy" />
                  </div>
                </Tabs>
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <Tabs defaultValue="overview" className="flex-1 flex flex-col">
              <TabsContent
                value="overview"
                className="flex-1 m-0 data-[state=active]:flex flex-col"
              >
                <ScrollArea className="flex-1 px-6 py-5">
                  <div className="max-w-[600px] space-y-6">
                    <div>
                      <h3 className="text-white text-lg font-semibold mb-4">
                        Server Overview
                      </h3>

                      {/* Server Icon */}
                      <div className="flex items-center gap-6 mb-6">
                        <div className="relative group">
                          <div
                            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl cursor-pointer transition-opacity"
                            style={{ backgroundColor: serverColor }}
                          >
                            {serverIcon}
                          </div>
                          <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <Upload className="text-white" size={24} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <Label className="text-white font-medium mb-2 block">
                            Server Icon
                          </Label>
                          <p className="text-[#b5bac1] text-sm mb-3">
                            Recommended size: 512x512px
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="bg-transparent border-[#4e5058] text-white hover:bg-[#4e5058] h-9 px-4 text-sm"
                            >
                              Upload Image
                            </Button>
                            <Button
                              variant="ghost"
                              className="text-[#ed4245] hover:text-white hover:bg-[#ed4245] h-9 px-4 text-sm"
                            >
                              Remove
                            </Button>
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
                      <div className="space-y-2">
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
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent
                value="roles"
                className="flex-1 m-0 data-[state=active]:flex flex-col"
              >
                <ScrollArea className="flex-1 px-6 py-5">
                  <div className="max-w-[600px] space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white text-lg font-semibold">
                        Roles
                      </h3>
                      <Button className="bg-[#5865f2] hover:bg-[#4752c4] h-9 px-4">
                        Create Role
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {["Admin", "Moderator", "Member"].map((role, idx) => (
                        <div
                          key={role}
                          className="flex items-center justify-between p-4 bg-[#2b2d31] rounded-lg border border-[#1e1f22] hover:border-[#404249] transition-colors"
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
                            className="text-[#b5bac1] hover:text-white hover:bg-[#35363c] h-8 px-3"
                          >
                            Edit
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
                <ScrollArea className="flex-1 px-6 py-5">
                  <div className="max-w-[600px] space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white text-lg font-semibold">
                        Members (24)
                      </h3>
                      <Input
                        placeholder="Search members..."
                        className="bg-[#1e1f22] border-none text-white h-9 w-64"
                      />
                    </div>

                    <div className="space-y-2">
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
                          className="flex items-center justify-between p-3 bg-[#2b2d31] rounded-lg border border-[#1e1f22] hover:border-[#404249] transition-colors"
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
                            className="text-[#b5bac1] hover:text-white hover:bg-[#35363c] h-8 px-3"
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
                <ScrollArea className="flex-1 px-6 py-5">
                  <div className="max-w-[600px] space-y-6">
                    <h3 className="text-white text-lg font-semibold">
                      Notification Settings
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-start justify-between p-4 bg-[#2b2d31] rounded-lg border border-[#1e1f22]">
                        <div className="flex-1">
                          <div className="text-white font-medium mb-1">
                            All Messages
                          </div>
                          <div className="text-[#b5bac1] text-sm">
                            Get notified for every new message
                          </div>
                        </div>
                        <Switch
                          checked={notifyAllMessages}
                          onCheckedChange={setNotifyAllMessages}
                        />
                      </div>

                      <div className="flex items-start justify-between p-4 bg-[#2b2d31] rounded-lg border border-[#1e1f22]">
                        <div className="flex-1">
                          <div className="text-white font-medium mb-1">
                            Mentions Only
                          </div>
                          <div className="text-[#b5bac1] text-sm">
                            Only get notified when someone mentions you
                          </div>
                        </div>
                        <Switch
                          checked={notifyMentions}
                          onCheckedChange={setNotifyMentions}
                        />
                      </div>

                      <div className="flex items-start justify-between p-4 bg-[#2b2d31] rounded-lg border border-[#1e1f22]">
                        <div className="flex-1">
                          <div className="text-white font-medium mb-1">
                            Mobile Push Notifications
                          </div>
                          <div className="text-[#b5bac1] text-sm">
                            Receive push notifications on mobile devices
                          </div>
                        </div>
                        <Switch
                          checked={mobilePushEnabled}
                          onCheckedChange={setMobilePushEnabled}
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
                <ScrollArea className="flex-1 px-6 py-5">
                  <div className="max-w-[600px] space-y-6">
                    <h3 className="text-white text-lg font-semibold">
                      Privacy & Safety
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-start justify-between p-4 bg-[#2b2d31] rounded-lg border border-[#1e1f22]">
                        <div className="flex-1">
                          <div className="text-white font-medium mb-1">
                            Allow Invites
                          </div>
                          <div className="text-[#b5bac1] text-sm">
                            Let members invite new people to the server
                          </div>
                        </div>
                        <Switch
                          checked={allowInvites}
                          onCheckedChange={setAllowInvites}
                        />
                      </div>

                      <div className="flex items-start justify-between p-4 bg-[#2b2d31] rounded-lg border border-[#1e1f22]">
                        <div className="flex-1">
                          <div className="text-white font-medium mb-1">
                            Require Approval
                          </div>
                          <div className="text-[#b5bac1] text-sm">
                            New members must be approved by admins
                          </div>
                        </div>
                        <Switch
                          checked={requireApproval}
                          onCheckedChange={setRequireApproval}
                        />
                      </div>

                      <div className="flex items-start justify-between p-4 bg-[#2b2d31] rounded-lg border border-[#1e1f22]">
                        <div className="flex-1">
                          <div className="text-white font-medium mb-1">
                            Show Online Members
                          </div>
                          <div className="text-[#b5bac1] text-sm">
                            Display who's currently online in the sidebar
                          </div>
                        </div>
                        <Switch
                          checked={showOnlineMembers}
                          onCheckedChange={setShowOnlineMembers}
                        />
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="px-6 py-4 bg-[#2b2d31] border-t border-[#1e1f22] flex justify-between items-center">
              <div className="text-[#b5bac1] text-sm">
                Remember to save your changes
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="ghost"
                  className="text-white hover:text-white hover:bg-[#4e5058] h-10 px-4"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-[#5865f2] hover:bg-[#4752c4] text-white h-10 px-6"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
