"use client";

import { getFriends } from "@/lib/friendService";
import { addServerMember } from "@/lib/serverService";
import { getCurrentUser, User } from "@/utils/auth";
import { copyToClipboard } from "@/utils/clipboard";
import {
  Check,
  Copy,
  Crown,
  Link as LinkIcon,
  Mail,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface InvitePeopleModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverId?: string;
}

export function InvitePeopleModal({
  isOpen,
  onClose,
  serverId,
}: InvitePeopleModalProps) {
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [inviteExpiry, setInviteExpiry] = useState("7days");
  const [maxUses, setMaxUses] = useState("unlimited");
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [invitingFriends, setInvitingFriends] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    async function loadFriends() {
      if (isOpen) {
        const user = await getCurrentUser();
        if (user) {
          const friendsList = await getFriends(user.id);
          setFriends(friendsList);
        }
      }
    }
    loadFriends();
  }, [isOpen]);

  const inviteLink = "https://Flow Chat.com/invite/abc123xyz";

  const handleCopyLink = async () => {
    const success = await copyToClipboard(inviteLink);
    if (success) {
      setCopied(true);
      toast.success("Invite link copied to clipboard!");
    } else {
      toast.error("Failed to copy link");
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = () => {
    if (emailInput.trim()) {
      toast.success(`Invite sent to ${emailInput}!`);
      setEmailInput("");
    }
  };

  const handleInviteFriend = async (friendId: string) => {
    if (!serverId) {
      toast.error("No server selected");
      return;
    }

    setInvitingFriends((prev) => new Set(prev).add(friendId));

    const { success, error } = await addServerMember(serverId, friendId);

    setInvitingFriends((prev) => {
      const next = new Set(prev);
      next.delete(friendId);
      return next;
    });

    if (success) {
      toast.success("Friend invited to server!");
      // Remove from friends list after successful invite
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
    } else {
      toast.error(error || "Failed to invite friend");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[500px] bg-[#313338] border-none text-white p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-b from-[#313338] to-[#2b2d31]">
          <DialogTitle className="text-white text-2xl flex items-center gap-2">
            <UserPlus className="text-[#5865f2]" size={24} />
            Invite people to Workspace
          </DialogTitle>
          <DialogDescription className="text-[#b5bac1] text-[15px] mt-2">
            Share this link with others to grant access to this server
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="w-full bg-[#2b2d31] border-b border-[#1e1f22] rounded-none h-12 p-0">
            <TabsTrigger
              value="friends"
              className="flex-1 data-[state=active]:bg-[#313338] data-[state=active]:text-white data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-[#5865f2] h-full"
            >
              <Users size={16} className="mr-2" />
              Friends
            </TabsTrigger>
            <TabsTrigger
              value="link"
              className="flex-1 data-[state=active]:bg-[#313338] data-[state=active]:text-white data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-[#5865f2] h-full"
            >
              <LinkIcon size={16} className="mr-2" />
              Invite Link
            </TabsTrigger>
            <TabsTrigger
              value="email"
              className="flex-1 data-[state=active]:bg-[#313338] data-[state=active]:text-white data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-[#5865f2] h-full"
            >
              <Mail size={16} className="mr-2" />
              Send Email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="px-6 py-5 space-y-4 mt-0">
            <div className="space-y-2">
              <Label className="text-[#b5bac1] text-xs uppercase tracking-wider font-semibold">
                Your Friends ({friends.length})
              </Label>
              {friends.length === 0 ? (
                <div className="bg-[#2b2d31] rounded-lg p-8 border border-[#1e1f22] text-center">
                  <Users size={48} className="text-[#6d6f78] mx-auto mb-3" />
                  <p className="text-[#b5bac1] text-sm">No friends to invite</p>
                  <p className="text-[#80848e] text-xs mt-1">
                    Add friends first to invite them to this server
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="bg-[#2b2d31] rounded-lg p-3 border border-[#1e1f22] flex items-center justify-between hover:bg-[#32353b] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-[#5865f2] text-white font-semibold">
                            {friend.username?.slice(0, 2).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-white font-medium">
                            {friend.username || "Unknown User"}
                          </div>
                          <div className="text-[#b5bac1] text-xs">
                            {friend.email}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleInviteFriend(friend.id)}
                        disabled={invitingFriends.has(friend.id)}
                        className="bg-[#5865f2] hover:bg-[#4752c4] h-9 px-4 text-sm disabled:opacity-50"
                      >
                        {invitingFriends.has(friend.id) ? (
                          "Inviting..."
                        ) : (
                          <>
                            <UserPlus size={14} className="mr-2" />
                            Invite
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="link" className="px-6 py-5 space-y-5 mt-0">
            {/* Invite Link */}
            <div className="space-y-2">
              <Label className="text-[#b5bac1] text-xs uppercase tracking-wider font-semibold">
                Server Invite Link
              </Label>
              <div className="flex gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="bg-[#1e1f22] border-none text-white h-11 flex-1 cursor-pointer"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  onClick={handleCopyLink}
                  className="bg-[#5865f2] hover:bg-[#4752c4] h-11 px-4 gap-2"
                >
                  {copied ? (
                    <>
                      <Check size={18} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Invite Settings */}
            <div className="space-y-4 p-4 bg-[#2b2d31] rounded-lg border border-[#1e1f22]">
              <div className="flex items-center gap-2 text-[#b5bac1]">
                <Settings size={16} />
                <span className="font-semibold text-sm uppercase tracking-wider">
                  Link Settings
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-[#b5bac1] text-xs uppercase tracking-wider mb-2 block">
                    Expire After
                  </Label>
                  <Select value={inviteExpiry} onValueChange={setInviteExpiry}>
                    <SelectTrigger className="bg-[#1e1f22] border-none text-white h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111214] border-none text-white">
                      <SelectItem value="30min">30 minutes</SelectItem>
                      <SelectItem value="1hour">1 hour</SelectItem>
                      <SelectItem value="6hours">6 hours</SelectItem>
                      <SelectItem value="12hours">12 hours</SelectItem>
                      <SelectItem value="1day">1 day</SelectItem>
                      <SelectItem value="7days">7 days</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[#b5bac1] text-xs uppercase tracking-wider mb-2 block">
                    Max Number of Uses
                  </Label>
                  <Select value={maxUses} onValueChange={setMaxUses}>
                    <SelectTrigger className="bg-[#1e1f22] border-none text-white h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111214] border-none text-white">
                      <SelectItem value="1">1 use</SelectItem>
                      <SelectItem value="5">5 uses</SelectItem>
                      <SelectItem value="10">10 uses</SelectItem>
                      <SelectItem value="25">25 uses</SelectItem>
                      <SelectItem value="50">50 uses</SelectItem>
                      <SelectItem value="100">100 uses</SelectItem>
                      <SelectItem value="unlimited">No limit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Active Invites */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[#b5bac1] text-xs uppercase tracking-wider font-semibold">
                  Active Invites
                </Label>
                <Button
                  variant="ghost"
                  className="text-[#5865f2] hover:text-[#4752c4] h-auto p-0 text-xs"
                >
                  Manage Invites
                </Button>
              </div>
              <div className="bg-[#2b2d31] rounded-lg p-4 border border-[#1e1f22]">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center">
                      <Crown size={18} className="text-white" />
                    </div>
                    <div>
                      <div className="text-white font-medium">You</div>
                      <div className="text-[#b5bac1] text-xs">
                        Created 2 days ago • 5 uses
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="text-[#ed4245] hover:text-white hover:bg-[#ed4245] h-8 px-3 text-xs"
                  >
                    Revoke
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="email" className="px-6 py-5 space-y-5 mt-0">
            <div className="space-y-2">
              <Label className="text-[#b5bac1] text-xs uppercase tracking-wider font-semibold">
                Email Address
              </Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="friend@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="bg-[#1e1f22] border-none text-white h-11 flex-1 placeholder:text-[#6d6f78]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSendInvite();
                    }
                  }}
                />
                <Button
                  onClick={handleSendInvite}
                  disabled={!emailInput.trim()}
                  className="bg-[#5865f2] hover:bg-[#4752c4] h-11 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Invite
                </Button>
              </div>
            </div>

            {/* Email Template Preview */}
            <div className="space-y-2">
              <Label className="text-[#b5bac1] text-xs uppercase tracking-wider font-semibold">
                Preview
              </Label>
              <div className="bg-[#2b2d31] rounded-lg p-4 border border-[#1e1f22] space-y-3">
                <div className="text-white font-semibold">
                  You're invited to join Workspace!
                </div>
                <p className="text-[#b5bac1] text-sm leading-relaxed">
                  John Doe has invited you to join their server on Flow Chat.
                  Click the button below to accept the invitation and start
                  collaborating.
                </p>
                <Button className="bg-[#5865f2] hover:bg-[#4752c4] h-10 w-full">
                  Accept Invite
                </Button>
                <p className="text-[#80848e] text-xs text-center">
                  This invite expires in{" "}
                  {inviteExpiry === "never" ? "never" : inviteExpiry}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="px-6 py-4 bg-[#2b2d31] border-t border-[#1e1f22] flex justify-end">
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-white hover:text-white hover:bg-[#4e5058] h-10 px-4"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
