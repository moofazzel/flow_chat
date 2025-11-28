"use client";

import { getFriends } from "@/lib/friendService";
import {
  canInviteMembers,
  createServerInvite,
  deleteInvite,
  getInviteUrl,
  getServerInvites,
  inviteFriendToServer,
  ServerInvite,
} from "@/lib/inviteService";
import { getServerMembers } from "@/lib/membershipService";
import { getCurrentUser, User } from "@/utils/auth";
import { copyToClipboard } from "@/utils/clipboard";
import { createClient } from "@/utils/supabase/client";
import {
  Check,
  Copy,
  Crown,
  Link as LinkIcon,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  Settings,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
  const [joinedFriends, setJoinedFriends] = useState<User[]>([]);
  const [invitingFriends, setInvitingFriends] = useState<Set<string>>(
    new Set()
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeInvites, setActiveInvites] = useState<ServerInvite[]>([]);
  const [currentInviteLink, setCurrentInviteLink] = useState<string>("");
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isDeletingInvite, setIsDeletingInvite] = useState<string | null>(null);
  const [hasInvitePermission, setHasInvitePermission] = useState<
    boolean | null
  >(null);
  const supabase = createClient();

  // Load active invites
  const loadInvites = useCallback(async () => {
    if (serverId) {
      try {
        const invites = await getServerInvites(serverId);
        setActiveInvites(invites);

        // Set the current invite link to the first active invite or empty
        if (invites.length > 0) {
          setCurrentInviteLink(getInviteUrl(invites[0].code));
        } else {
          setCurrentInviteLink("");
        }
      } catch (error) {
        // server_invites table might not exist yet
        console.error("Error loading invites (table may not exist):", error);
        setActiveInvites([]);
        setCurrentInviteLink("");
      }
    }
  }, [serverId]);

  // Load friends and filter out those already in the server
  useEffect(() => {
    async function loadFriends() {
      if (isOpen && serverId) {
        const user = await getCurrentUser();
        setCurrentUser(user);

        if (user) {
          // Check if user has permission to invite
          const canInvite = await canInviteMembers(serverId);
          console.log("Can invite members:", canInvite);
          setHasInvitePermission(canInvite);

          const friendsList = await getFriends(user.id);
          const serverMembers = await getServerMembers(serverId);

          console.log(
            "Friends list:",
            friendsList.map((f) => ({ id: f.id, username: f.username }))
          );
          console.log(
            "Server members:",
            serverMembers.map((m) => ({ user_id: m.user_id, role: m.role }))
          );

          const memberIds = new Set(serverMembers.map((m) => m.user_id));
          console.log("Member IDs set:", Array.from(memberIds));

          // Separate friends into joined and not joined
          const available: User[] = [];
          const joined: User[] = [];

          friendsList.forEach((friend) => {
            const isMember = memberIds.has(friend.id);
            console.log(
              `Friend ${friend.username} (${friend.id}) is member: ${isMember}`
            );
            if (isMember) {
              joined.push(friend);
            } else {
              available.push(friend);
            }
          });

          console.log(
            "Available to invite:",
            available.length,
            available.map((f) => f.username)
          );
          console.log(
            "Already joined:",
            joined.length,
            joined.map((f) => f.username)
          );

          setFriends(available);
          setJoinedFriends(joined);
        }

        // Load active invites
        await loadInvites();
      }
    }
    loadFriends();
  }, [isOpen, serverId, loadInvites]);

  // Subscribe to real-time server member changes
  useEffect(() => {
    if (!isOpen || !serverId) return;

    const channel = supabase
      .channel(`server-members-${serverId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "server_members",
          filter: `server_id=eq.${serverId}`,
        },
        async (payload) => {
          console.log("New member added to server:", payload);

          const newMemberId = payload.new.user_id;

          // Move the newly added member from friends to joinedFriends in real-time
          setFriends((prev) => {
            const friendToMove = prev.find((f) => f.id === newMemberId);
            if (friendToMove) {
              setJoinedFriends((joined) => [...joined, friendToMove]);
            }
            return prev.filter((f) => f.id !== newMemberId);
          });

          // If it's not the current user inviting, show a notification
          if (currentUser && newMemberId !== currentUser.id) {
            // Fetch the new member's info
            const { data: newMember } = await supabase
              .from("users")
              .select("username, full_name")
              .eq("id", newMemberId)
              .single();

            if (newMember) {
              toast.info(
                `${
                  newMember.username || newMember.full_name
                } joined the server`,
                { duration: 3000 }
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [isOpen, serverId, supabase, currentUser]);

  // Convert expiry setting to hours
  const getExpiryHours = (): number | undefined => {
    const expiryMap: Record<string, number | undefined> = {
      "30min": 0.5,
      "1hour": 1,
      "6hours": 6,
      "12hours": 12,
      "1day": 24,
      "7days": 168,
      never: undefined,
    };
    return expiryMap[inviteExpiry];
  };

  // Convert max uses setting to number
  const getMaxUses = (): number | undefined => {
    if (maxUses === "unlimited") return undefined;
    return parseInt(maxUses, 10);
  };

  // Generate a new invite link
  const handleGenerateLink = async () => {
    if (!serverId) {
      toast.error("No server selected");
      return;
    }

    // Check permission first
    if (!hasInvitePermission) {
      toast.error("You don't have permission to generate invite links");
      return;
    }

    setIsGeneratingLink(true);
    try {
      const invite = await createServerInvite(serverId, {
        expiresInHours: getExpiryHours(),
        maxUses: getMaxUses(),
      });

      const inviteUrl = getInviteUrl(invite.code);
      setCurrentInviteLink(inviteUrl);
      setActiveInvites((prev) => [invite, ...prev]);

      toast.success("Invite link generated!");
    } catch (error: unknown) {
      console.error("Error generating invite link:", error);
      // Check for permission error
      const errorObj = error as { code?: string; message?: string };
      if (errorObj?.code === "42501") {
        toast.error("You don't have permission to generate invite links");
        return;
      }
      // Check if it's a table not found error
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes("server_invites") ||
        errorMessage.includes("does not exist")
      ) {
        toast.error(
          "Invite system not set up. Please run migration 019_server_invites.sql"
        );
      } else {
        toast.error("Failed to generate invite link");
      }
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Delete an invite
  const handleDeleteInvite = async (inviteId: string) => {
    setIsDeletingInvite(inviteId);
    try {
      await deleteInvite(inviteId);
      setActiveInvites((prev) => prev.filter((i) => i.id !== inviteId));

      // Update current link if the deleted invite was the current one
      const remainingInvites = activeInvites.filter((i) => i.id !== inviteId);
      if (remainingInvites.length > 0) {
        setCurrentInviteLink(getInviteUrl(remainingInvites[0].code));
      } else {
        setCurrentInviteLink("");
      }

      toast.success("Invite revoked");
    } catch (error) {
      console.error("Error deleting invite:", error);
      toast.error("Failed to revoke invite");
    } finally {
      setIsDeletingInvite(null);
    }
  };

  const handleCopyLink = async () => {
    if (!currentInviteLink) {
      toast.error("Generate an invite link first");
      return;
    }

    const success = await copyToClipboard(currentInviteLink);
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
      // Email invites are not yet implemented - show info message
      toast.info("Email invites coming soon! Use an invite link instead.");
      setEmailInput("");
    }
  };

  const handleInviteFriend = async (friendId: string) => {
    if (!serverId) {
      toast.error("No server selected");
      return;
    }

    setInvitingFriends((prev) => new Set(prev).add(friendId));

    const result = await inviteFriendToServer(serverId, friendId);

    setInvitingFriends((prev) => {
      const next = new Set(prev);
      next.delete(friendId);
      return next;
    });

    if (result.success) {
      toast.success(result.message);
      // Remove from friends list after successful invite
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
    } else {
      toast.error(result.message);
    }
  };

  // Format invite date
  const formatInviteDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Format expiry
  const formatExpiry = (expiresAt: string | null): string => {
    if (!expiresAt) return "Never expires";
    const date = new Date(expiresAt);
    if (date < new Date()) return "Expired";
    return `Expires ${date.toLocaleDateString()}`;
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
            {hasInvitePermission === false ? (
              <div className="bg-[#2b2d31] rounded-lg p-8 border border-[#1e1f22] text-center">
                <Lock size={48} className="text-[#ed4245] mx-auto mb-3" />
                <p className="text-white text-lg font-semibold mb-2">
                  Permission Required
                </p>
                <p className="text-[#b5bac1] text-sm">
                  Only server owners and admins can invite members.
                </p>
                <p className="text-[#80848e] text-xs mt-2">
                  Contact a server admin if you need to invite someone.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Friends available to invite */}
                {friends.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-[#b5bac1] text-xs uppercase tracking-wider font-semibold">
                      Available to Invite ({friends.length})
                    </Label>
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                      {friends.map((friend) => (
                        <div
                          key={friend.id}
                          className="bg-[#2b2d31] rounded-lg p-3 border border-[#1e1f22] flex items-center justify-between hover:bg-[#32353b] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-[#5865f2] text-white font-semibold">
                                {friend.username?.slice(0, 2).toUpperCase() ||
                                  "U"}
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
                  </div>
                )}

                {/* Friends already joined */}
                {joinedFriends.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-[#b5bac1] text-xs uppercase tracking-wider font-semibold">
                      Already Members ({joinedFriends.length})
                    </Label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                      {joinedFriends.map((friend) => (
                        <div
                          key={friend.id}
                          className="bg-[#2b2d31] rounded-lg p-3 border border-[#1e1f22] flex items-center justify-between opacity-70"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-[#57f287] text-white font-semibold">
                                {friend.username?.slice(0, 2).toUpperCase() ||
                                  "U"}
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
                          <span className="bg-[#57f287]/20 text-[#57f287] px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1">
                            <Check size={12} />
                            Joined
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No friends at all */}
                {friends.length === 0 && joinedFriends.length === 0 && (
                  <div className="bg-[#2b2d31] rounded-lg p-8 border border-[#1e1f22] text-center">
                    <Users size={48} className="text-[#6d6f78] mx-auto mb-3" />
                    <p className="text-[#b5bac1] text-sm">No friends yet</p>
                    <p className="text-[#80848e] text-xs mt-1">
                      Add friends first to invite them to this server
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="link" className="px-6 py-5 space-y-5 mt-0">
            {hasInvitePermission === false ? (
              <div className="bg-[#2b2d31] rounded-lg p-8 border border-[#1e1f22] text-center">
                <Lock size={48} className="text-[#ed4245] mx-auto mb-3" />
                <p className="text-white text-lg font-semibold mb-2">
                  Permission Required
                </p>
                <p className="text-[#b5bac1] text-sm">
                  Only server owners and admins can create invite links.
                </p>
                <p className="text-[#80848e] text-xs mt-2">
                  Contact a server admin if you need an invite link.
                </p>
              </div>
            ) : (
              <>
                {/* Invite Link */}
                <div className="space-y-2">
                  <Label className="text-[#b5bac1] text-xs uppercase tracking-wider font-semibold">
                    Server Invite Link
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={
                        currentInviteLink ||
                        "Click Generate to create an invite link"
                      }
                      readOnly
                      className="bg-[#1e1f22] border-none text-white h-11 flex-1 cursor-pointer"
                      onClick={(e) =>
                        currentInviteLink &&
                        (e.target as HTMLInputElement).select()
                      }
                    />
                    <Button
                      onClick={handleCopyLink}
                      disabled={!currentInviteLink}
                      className="bg-[#5865f2] hover:bg-[#4752c4] h-11 px-4 gap-2 disabled:opacity-50"
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
                      <Select
                        value={inviteExpiry}
                        onValueChange={setInviteExpiry}
                      >
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

                    <Button
                      onClick={handleGenerateLink}
                      disabled={isGeneratingLink}
                      className="w-full bg-[#5865f2] hover:bg-[#4752c4] h-10 gap-2"
                    >
                      {isGeneratingLink ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={16} />
                          Generate New Link
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Active Invites */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[#b5bac1] text-xs uppercase tracking-wider font-semibold">
                      Active Invites ({activeInvites.length})
                    </Label>
                  </div>
                  {activeInvites.length === 0 ? (
                    <div className="bg-[#2b2d31] rounded-lg p-6 border border-[#1e1f22] text-center">
                      <LinkIcon
                        size={32}
                        className="text-[#6d6f78] mx-auto mb-2"
                      />
                      <p className="text-[#b5bac1] text-sm">
                        No active invites
                      </p>
                      <p className="text-[#80848e] text-xs mt-1">
                        Generate a link to invite people
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {activeInvites.map((invite) => (
                        <div
                          key={invite.id}
                          className="bg-[#2b2d31] rounded-lg p-3 border border-[#1e1f22]"
                        >
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center">
                                <Crown size={18} className="text-white" />
                              </div>
                              <div>
                                <div className="text-white font-medium font-mono text-xs">
                                  {invite.code}
                                </div>
                                <div className="text-[#b5bac1] text-xs">
                                  {formatInviteDate(invite.created_at)} •{" "}
                                  {invite.uses} use
                                  {invite.uses !== 1 ? "s" : ""}
                                  {invite.max_uses &&
                                    ` / ${invite.max_uses} max`}
                                </div>
                                <div className="text-[#80848e] text-xs">
                                  {formatExpiry(invite.expires_at)}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              onClick={() => handleDeleteInvite(invite.id)}
                              disabled={isDeletingInvite === invite.id}
                              className="text-[#ed4245] hover:text-white hover:bg-[#ed4245] h-8 px-3 text-xs"
                            >
                              {isDeletingInvite === invite.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <>
                                  <Trash2 size={14} className="mr-1" />
                                  Revoke
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
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
                  You&apos;re invited to join Workspace!
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
