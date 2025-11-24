"use client";

import { useDmNotifications } from "@/hooks/useDmNotifications";
import { useFriendRequests } from "@/hooks/useFriendRequests";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  getDmConversations,
  getDmThread,
  getFriends,
  getPendingFriendRequests,
  sendFriendRequest,
} from "@/lib/friendService";
import { getCurrentUser, User } from "@/utils/auth";
import {
  Ban,
  Inbox,
  MessageCircle,
  MoreVertical,
  Phone,
  Search,
  UserPlus,
  Users,
  Video,
} from "lucide-react";
import { Resizable } from "re-resizable";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AddFriendModal } from "./AddFriendModal";
import { EnhancedDirectMessageChat } from "./EnhancedDirectMessageChat";
import { FriendRequestsPanel } from "./FriendRequestsPanel";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { UserProfile } from "./UserProfile";

interface DMConversation {
  id: string;
  friend: User;
  lastMessage: string;
  timestamp: string;
  unread: number;
  isTyping?: boolean;
}

interface FriendRequestData {
  id: string;
  user: User;
  timestamp: string;
  type: "incoming" | "outgoing";
}

const getStatusColor = (status: User["status"]) => {
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

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function DirectMessageCenter() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<"friends" | "dms">("dms");
  const [friendsTab, setFriendsTab] = useState<
    "online" | "all" | "pending" | "blocked" | "add"
  >("online");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDM, setSelectedDM] = useState<DMConversation | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [dms, setDms] = useState<DMConversation[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequestData[]>([]);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load current user
  useEffect(() => {
    const loadCurrentUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };
    loadCurrentUser();
  }, []);

  // Enable real-time friend request notifications
  const {
    incomingRequests,
    outgoingRequests,
    totalCount: realtimeRequestCount,
  } = useFriendRequests(currentUser?.id || null);

  // Enable real-time DM notifications
  const { notifications: dmNotifications } = useDmNotifications(
    currentUser?.id || null,
    selectedDM?.id || null
  );

  // Refresh DM list when new messages arrive to update unread badges
  useEffect(() => {
    if (!currentUser || dmNotifications.length === 0) return;

    const refreshDmList = async () => {
      try {
        const conversations = await getDmConversations(currentUser.id);
        const dmConversations: DMConversation[] = conversations.map((conv) => ({
          id: conv.id,
          friend: conv.otherUser,
          lastMessage: conv.lastMessage,
          timestamp: conv.lastMessageTime,
          unread: conv.unreadCount,
        }));
        setDms(dmConversations);
      } catch (error) {
        console.error("Failed to refresh DM conversations:", error);
      }
    };

    refreshDmList();
  }, [dmNotifications, currentUser]);

  // Update friend requests list when realtime data changes
  useEffect(() => {
    if (!currentUser) return;

    // Refresh when realtime data changes (request added or accepted/declined)
    const refreshData = async () => {
      try {
        // Refresh friend requests
        const requests = await getPendingFriendRequests(currentUser.id);

        const formattedRequests: FriendRequestData[] = [
          ...requests.incoming.map((user) => ({
            id: user.id,
            user: user,
            timestamp: new Date().toISOString(),
            type: "incoming" as const,
          })),
          ...requests.outgoing.map((user) => ({
            id: user.id,
            user: user,
            timestamp: new Date().toISOString(),
            type: "outgoing" as const,
          })),
        ];
        setFriendRequests(formattedRequests);

        // Refresh friends list to show newly accepted friends
        const friendsList = await getFriends(currentUser.id);
        setFriends(friendsList);

        // Refresh DM conversations to show new chats
        const conversations = await getDmConversations(currentUser.id);
        const dmConversations: DMConversation[] = conversations.map((conv) => ({
          id: conv.id,
          friend: conv.otherUser,
          lastMessage: conv.lastMessage,
          timestamp: conv.lastMessageTime,
          unread: conv.unreadCount,
        }));
        setDms(dmConversations);
      } catch (error) {
        console.error("Failed to refresh data:", error);
      }
    };

    refreshData();
  }, [incomingRequests, outgoingRequests, currentUser]);

  // Load friends and requests when user is available (initial load)
  useEffect(() => {
    if (!currentUser) return;

    const loadFriendsAndRequests = async () => {
      setIsLoading(true);
      try {
        // Load friends
        const friendsList = await getFriends(currentUser.id);
        setFriends(friendsList);

        // Load friend requests
        const requests = await getPendingFriendRequests(currentUser.id);

        // Format requests for the UI
        const formattedRequests: FriendRequestData[] = [
          ...requests.incoming.map((user) => ({
            id: user.id,
            user: user,
            timestamp: new Date().toISOString(),
            type: "incoming" as const,
          })),
          ...requests.outgoing.map((user) => ({
            id: user.id,
            user: user,
            timestamp: new Date().toISOString(),
            type: "outgoing" as const,
          })),
        ];
        setFriendRequests(formattedRequests);

        // Load DM conversations
        const conversations = await getDmConversations(currentUser.id);
        const dmConversations: DMConversation[] = conversations.map((conv) => ({
          id: conv.id,
          friend: conv.otherUser,
          lastMessage: conv.lastMessage,
          timestamp: conv.lastMessageTime,
          unread: conv.unreadCount,
        }));
        setDms(dmConversations);

        // Restore last selected DM from localStorage after loading
        const savedDMId =
          typeof window !== "undefined"
            ? localStorage.getItem("lastSelectedDM")
            : null;
        if (savedDMId) {
          const savedDM = dmConversations.find((conv) => conv.id === savedDMId);
          if (savedDM) {
            setSelectedDM(savedDM);
            setActiveView("dms");
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        toast.error("Failed to load friends and conversations");
      }
      setIsLoading(false);
    };

    loadFriendsAndRequests();
  }, [currentUser]);

  // Save selected DM to localStorage
  useEffect(() => {
    if (selectedDM && typeof window !== "undefined") {
      localStorage.setItem("lastSelectedDM", selectedDM.id);
    }
  }, [selectedDM]);

  const filteredFriends = friends.filter(
    (f) =>
      f.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredDMs = dms.filter((dm) =>
    dm.friend.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Friend request handlers
  const handleAcceptFriendRequest = async (requesterId: string) => {
    if (!currentUser) return;

    try {
      const result = await acceptFriendRequest(currentUser.id, requesterId);
      if (result.success) {
        toast.success("Friend request accepted!");

        // Refresh friends and requests
        const friendsList = await getFriends(currentUser.id);
        setFriends(friendsList);

        const requests = await getPendingFriendRequests(currentUser.id);

        const formattedRequests: FriendRequestData[] = [
          ...requests.incoming.map((user) => ({
            id: user.id,
            user: user,
            timestamp: new Date().toISOString(),
            type: "incoming" as const,
          })),
          ...requests.outgoing.map((user) => ({
            id: user.id,
            user: user,
            timestamp: new Date().toISOString(),
            type: "outgoing" as const,
          })),
        ];
        setFriendRequests(formattedRequests);

        // Update DM conversations
        const conversations = await getDmConversations(currentUser.id);
        const dmConversations: DMConversation[] = conversations.map((conv) => ({
          id: conv.id,
          friend: conv.otherUser,
          lastMessage: conv.lastMessage,
          timestamp: conv.lastMessageTime,
          unread: conv.unreadCount,
        }));
        setDms(dmConversations);
      } else {
        toast.error(result.error || "Failed to accept friend request");
      }
    } catch (error) {
      console.error("Failed to accept friend request:", error);
      toast.error("Failed to accept friend request");
    }
  };

  const handleDeclineFriendRequest = async (requesterId: string) => {
    if (!currentUser) return;

    try {
      const result = await declineFriendRequest(currentUser.id, requesterId);
      if (result.success) {
        toast.success("Friend request declined");

        // Refresh requests
        const requests = await getPendingFriendRequests(currentUser.id);

        const formattedRequests: FriendRequestData[] = [
          ...requests.incoming.map((user) => ({
            id: user.id,
            user: user,
            timestamp: new Date().toISOString(),
            type: "incoming" as const,
          })),
          ...requests.outgoing.map((user) => ({
            id: user.id,
            user: user,
            timestamp: new Date().toISOString(),
            type: "outgoing" as const,
          })),
        ];
        setFriendRequests(formattedRequests);
      } else {
        toast.error(result.error || "Failed to decline friend request");
      }
    } catch (error) {
      console.error("Failed to decline friend request:", error);
      toast.error("Failed to decline friend request");
    }
  };

  const handleCancelFriendRequest = async (addresseeId: string) => {
    if (!currentUser) return;

    try {
      const result = await cancelFriendRequest(currentUser.id, addresseeId);
      if (result.success) {
        toast.success("Friend request cancelled");

        // Refresh requests
        const requests = await getPendingFriendRequests(currentUser.id);

        const formattedRequests: FriendRequestData[] = [
          ...requests.incoming.map((user) => ({
            id: user.id,
            user: user,
            timestamp: new Date().toISOString(),
            type: "incoming" as const,
          })),
          ...requests.outgoing.map((user) => ({
            id: user.id,
            user: user,
            timestamp: new Date().toISOString(),
            type: "outgoing" as const,
          })),
        ];
        setFriendRequests(formattedRequests);
      } else {
        toast.error(result.error || "Failed to cancel friend request");
      }
    } catch (error) {
      console.error("Failed to cancel friend request:", error);
      toast.error("Failed to cancel friend request");
    }
  };

  const handleAddFriend = async (user: User) => {
    if (!currentUser) return;

    try {
      const result = await sendFriendRequest(currentUser.id, user.id);
      if (result.success) {
        toast.success(`Friend request sent to ${user.full_name}!`);

        // Refresh requests to show the new outgoing request
        const requests = await getPendingFriendRequests(currentUser.id);

        const formattedRequests: FriendRequestData[] = [
          ...requests.incoming.map((user) => ({
            id: user.id,
            user: user,
            timestamp: new Date().toISOString(),
            type: "incoming" as const,
          })),
          ...requests.outgoing.map((user) => ({
            id: user.id,
            user: user,
            timestamp: new Date().toISOString(),
            type: "outgoing" as const,
          })),
        ];
        setFriendRequests(formattedRequests);
      } else {
        toast.error(result.error || "Failed to send friend request");
      }
    } catch (error) {
      console.error("Failed to send friend request:", error);
      toast.error("Failed to send friend request");
    }
  };

  const handleStartDM = async (friend: User) => {
    if (!currentUser) return;

    try {
      // Get or create DM thread
      const { thread, error } = await getDmThread(currentUser.id, friend.id);

      if (error || !thread) {
        toast.error("Failed to create conversation");
        return;
      }

      // Create DM conversation object
      const conversation: DMConversation = {
        id: thread.id,
        friend,
        lastMessage: "Start chatting...",
        timestamp: new Date().toISOString(),
        unread: 0,
      };

      // Add to DMs list if not already there
      setDms((prevDMs) => {
        const exists = prevDMs.find((dm) => dm.friend.id === friend.id);
        if (!exists) {
          return [conversation, ...prevDMs];
        }
        return prevDMs;
      });

      // Select the DM
      setSelectedDM(conversation);
      setActiveView("dms");

      // Save to localStorage
      localStorage.setItem("lastSelectedDM", thread.id);
    } catch (error) {
      console.error("Failed to start DM:", error);
      toast.error("Failed to start conversation");
    }
  };

  if (!currentUser || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#313338]">
        <div className="text-center">
          <div className="text-white text-lg mb-2">Loading...</div>
          <div className="text-gray-400 text-sm">
            Getting your conversations ready
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex">
      <Resizable
        defaultSize={{ width: 240, height: "100%" }}
        minWidth={180}
        maxWidth={400}
        enable={{ right: true }}
        handleStyles={{
          right: { width: "4px", right: "0", cursor: "ew-resize" },
        }}
        handleClasses={{ right: "hover:bg-[#5865f2] transition-colors" }}
      >
        <div className="h-full bg-[#2b2d31] flex flex-col border-r border-[#1e1f22]">
          <div className="p-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                placeholder="Find or start a conversation"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#1e1f22] border-none text-white text-sm pl-10 h-9 placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-[#5865f2]"
              />
            </div>
          </div>

          <Separator className="bg-[#1e1f22]" />

          <div className="p-2 space-y-0.5">
            <button
              onClick={() => {
                setActiveView("friends");
                setFriendsTab("online");
                setSelectedDM(null);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                activeView === "friends"
                  ? "bg-[#404249] text-white"
                  : "text-gray-300 hover:bg-[#35363c] hover:text-white"
              }`}
            >
              <Users
                size={20}
                className={
                  activeView === "friends" ? "text-[#5865f2]" : "text-gray-400"
                }
              />
              <span className="text-[15px] font-medium">Friends</span>
            </button>
            <button
              onClick={() => {
                setActiveView("friends");
                setFriendsTab("add");
                setSelectedDM(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-gray-300 hover:bg-[#35363c] hover:text-white transition-all"
            >
              <UserPlus size={20} className="text-gray-400" />
              <span className="text-[15px] font-medium">Add Friend</span>
            </button>
          </div>

          <Separator className="bg-[#1e1f22] my-2" />

          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
              Direct Messages
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-gray-400 hover:text-white hover:bg-transparent"
              onClick={() => setShowAddFriendModal(true)}
            >
              <UserPlus size={18} />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-2 pb-2 space-y-0.5">
              {filteredDMs.map((dm) => (
                <button
                  key={dm.id}
                  onClick={() => setSelectedDM(dm)}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-[#35363c] transition-colors group ${
                    selectedDM?.id === dm.id ? "bg-[#35363c]" : ""
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-8 w-8">
                      {dm.friend.avatar_url && (
                        <AvatarImage
                          src={dm.friend.avatar_url}
                          alt={dm.friend.full_name}
                        />
                      )}
                      <AvatarFallback className="bg-[#5865f2] text-white text-xs">
                        {getInitials(dm.friend.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#2b2d31] ${getStatusColor(
                        dm.friend.status
                      )}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-gray-300 text-sm truncate">
                        {dm.friend.full_name}
                      </span>
                    </div>
                    <div className="text-gray-500 text-xs truncate">
                      {dm.lastMessage || "No messages yet"}
                    </div>
                  </div>

                  {dm.unread > 0 && (
                    <div className="w-2 h-2 bg-[#f23f43] rounded-full flex-shrink-0" />
                  )}
                </button>
              ))}

              {filteredDMs.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No conversations found
                </div>
              )}
            </div>
          </ScrollArea>

          <UserProfile
            userName={currentUser.full_name}
            userAvatar={getInitials(currentUser.full_name)}
            userStatus={currentUser.status}
            userId={currentUser.id}
            username={currentUser.username}
          />
        </div>
      </Resizable>

      <div className="flex-1 flex flex-col bg-[#313338]">
        {selectedDM && activeView === "dms" ? (
          <EnhancedDirectMessageChat
            selectedDM={{
              userId: selectedDM.friend.id,
              userName: selectedDM.friend.full_name,
              userAvatar: getInitials(selectedDM.friend.full_name),
              userStatus: selectedDM.friend.status,
              threadId: selectedDM.id,
            }}
            currentUserId={currentUser.id}
            currentUserName={currentUser.full_name}
          />
        ) : activeView === "friends" ? (
          <>
            <div className="h-12 px-4 flex items-center border-b border-[#1e1f22] gap-4">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-gray-400" />
                <span className="text-white">Friends</span>
              </div>

              <Separator orientation="vertical" className="h-6 bg-[#3f4147]" />

              <div className="flex gap-4">
                <button
                  onClick={() => setFriendsTab("online")}
                  className={`text-sm transition-colors ${
                    friendsTab === "online"
                      ? "text-white"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Online
                </button>
                <button
                  onClick={() => setFriendsTab("all")}
                  className={`text-sm transition-colors ${
                    friendsTab === "all"
                      ? "text-white"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFriendsTab("pending")}
                  className={`text-sm transition-colors flex items-center gap-1 ${
                    friendsTab === "pending"
                      ? "text-white"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Pending
                  {(realtimeRequestCount > 0 || friendRequests.length > 0) && (
                    <Badge className="bg-[#f23f43] text-white text-xs h-4 px-1.5 animate-pulse">
                      {realtimeRequestCount || friendRequests.length}
                    </Badge>
                  )}
                </button>
                <button
                  onClick={() => setFriendsTab("blocked")}
                  className={`text-sm transition-colors ${
                    friendsTab === "blocked"
                      ? "text-white"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Blocked
                </button>
                <button
                  onClick={() => setFriendsTab("add")}
                  className={`text-sm px-2 py-0.5 rounded transition-colors ${
                    friendsTab === "add"
                      ? "bg-[#3ba55d] text-white"
                      : "bg-[#3ba55d] text-white hover:bg-[#2d7d46]"
                  }`}
                >
                  Add Friend
                </button>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white p-2 h-auto"
                >
                  <Inbox size={20} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white p-2 h-auto"
                >
                  <MoreVertical size={20} />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              {friendsTab === "add" && (
                <AddFriendModal
                  open={true}
                  onClose={() => setFriendsTab("online")}
                  currentUserId={currentUser.id}
                  existingFriendIds={friends.map((f) => f.id)}
                  onAddFriend={handleAddFriend}
                  onStartDM={(user) => {
                    handleAddFriend(user);
                    handleStartDM(user);
                  }}
                />
              )}

              {friendsTab === "pending" && (
                <FriendRequestsPanel
                  requests={friendRequests.map((req) => ({
                    id: req.id,
                    userId: req.user.id,
                    userName: req.user.full_name,
                    userEmail: req.user.email || "",
                    userAvatar: getInitials(req.user.full_name),
                    timestamp: req.timestamp,
                    type: req.type,
                  }))}
                  onAccept={handleAcceptFriendRequest}
                  onDecline={handleDeclineFriendRequest}
                  onCancel={handleCancelFriendRequest}
                />
              )}

              {friendsTab === "blocked" && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <Ban size={48} className="text-gray-600 mb-4" />
                  <p className="text-gray-400">No blocked users</p>
                </div>
              )}

              {(friendsTab === "online" || friendsTab === "all") && (
                <div className="p-6">
                  <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-4">
                    {friendsTab === "online"
                      ? `Online - ${
                          friends.filter((f) => f.status === "online").length
                        }`
                      : `All Friends - ${friends.length}`}
                  </h3>
                  {isLoading ? (
                    <div className="text-center py-8 text-gray-500">
                      Loading friends...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(friendsTab === "online"
                        ? friends.filter((f) => f.status === "online")
                        : filteredFriends
                      ).map((friend) => (
                        <div
                          key={friend.id}
                          className="flex items-center gap-4 p-4 bg-[#2b2d31] rounded-lg hover:bg-[#35363c] transition-colors border-t border-[#3f4147] group"
                        >
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              {friend.avatar_url && (
                                <AvatarImage
                                  src={friend.avatar_url}
                                  alt={friend.full_name}
                                />
                              )}
                              <AvatarFallback className="bg-[#5865f2] text-white">
                                {getInitials(friend.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#2b2d31] ${getStatusColor(
                                friend.status
                              )}`}
                            />
                          </div>

                          <div className="flex-1">
                            <div className="text-white">{friend.full_name}</div>
                            <div className="text-gray-400 text-sm">
                              @{friend.username}
                            </div>
                          </div>

                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              onClick={() => handleStartDM(friend)}
                              className="bg-[#2b2d31] hover:bg-[#1e1f22] text-white p-2 h-auto"
                              title="Message"
                            >
                              <MessageCircle size={20} />
                            </Button>
                            <Button
                              variant="ghost"
                              className="text-gray-400 hover:text-white p-2 h-auto"
                              title="Voice Call"
                            >
                              <Phone size={20} />
                            </Button>
                            <Button
                              variant="ghost"
                              className="text-gray-400 hover:text-white p-2 h-auto"
                              title="Video Call"
                            >
                              <Video size={20} />
                            </Button>
                            <Button
                              variant="ghost"
                              className="text-gray-400 hover:text-white p-2 h-auto"
                              title="More"
                            >
                              <MoreVertical size={20} />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {(friendsTab === "online"
                        ? friends.filter((f) => f.status === "online")
                        : filteredFriends
                      ).length === 0 && (
                        <div className="text-center py-12">
                          <Users
                            size={48}
                            className="text-gray-600 mx-auto mb-4"
                          />
                          <p className="text-gray-400">
                            {friendsTab === "online"
                              ? "No friends online"
                              : "No friends found"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-[#5865f2] rounded-full flex items-center justify-center mb-4">
              <MessageCircle size={32} className="text-white" />
            </div>
            <h2 className="text-white text-xl mb-2">
              No conversation selected
            </h2>
            <p className="text-gray-400 mb-6 max-w-md">
              Choose a conversation from the list on the left or start a new one
              by clicking on a friend.
            </p>
            <Button
              onClick={() => {
                setActiveView("friends");
                setFriendsTab("online");
              }}
              className="bg-[#5865f2] hover:bg-[#4752c4] text-white gap-2"
            >
              <UserPlus size={18} />
              Find Friends
            </Button>
          </div>
        )}
      </div>

      {showAddFriendModal && (
        <AddFriendModal
          open={showAddFriendModal}
          onClose={() => setShowAddFriendModal(false)}
          currentUserId={currentUser.id}
          existingFriendIds={friends.map((f) => f.id)}
          onAddFriend={handleAddFriend}
          onStartDM={(user) => {
            handleAddFriend(user);
            handleStartDM(user);
            setShowAddFriendModal(false);
          }}
        />
      )}
    </div>
  );
}
