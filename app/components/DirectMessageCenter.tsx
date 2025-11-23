"use client";

import { Ban, Inbox, MessageCircle, MoreVertical, Phone, Search, UserPlus, Users, Video } from "lucide-react";
import { Resizable } from "re-resizable";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { chatService } from "@/lib/chatService";
import { getCurrentUser } from "@/utils/auth";
import { AddFriendModal } from "./AddFriendModal";
import { EnhancedDirectMessageChat } from "./EnhancedDirectMessageChat";
import { FriendRequestsPanel } from "./FriendRequestsPanel";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { UserProfile } from "./UserProfile";

interface Friend {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: "online" | "idle" | "dnd" | "offline";
  customStatus?: string;
}

interface DMConversation {
  id: string;
  friend: Friend;
  lastMessage: string;
  timestamp: string;
  unread: number;
  isTyping?: boolean;
}

interface FriendRequest {
  id: string;
  from: Friend;
  timestamp: string;
  type: "incoming" | "outgoing";
}

const mockFriends: Friend[] = [
  { id: "f1", name: "Sarah Chen", email: "sarah@company.com", avatar: "SC", status: "online", customStatus: "Working on new features" },
  { id: "f2", name: "Mike Johnson", email: "mike@company.com", avatar: "MJ", status: "online", customStatus: "In a meeting" },
  { id: "f3", name: "Alex Kim", email: "alex@company.com", avatar: "AK", status: "idle", customStatus: "Away for lunch" },
  { id: "f4", name: "Emily Davis", email: "emily@company.com", avatar: "ED", status: "online" },
];

const mockFriendRequests: FriendRequest[] = [
  {
    id: "fr1",
    from: { id: "new1", name: "John Smith", email: "john@company.com", avatar: "JS", status: "online" },
    timestamp: "2 days ago",
    type: "incoming",
  },
];

const getStatusColor = (status: Friend["status"]) => {
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

export function DirectMessageCenter() {
  const [activeView, setActiveView] = useState<"friends" | "dms">("dms");
  const [friendsTab, setFriendsTab] = useState<"online" | "all" | "pending" | "blocked" | "add">("online");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDM, setSelectedDM] = useState<DMConversation | null>(null);
  const [friends, setFriends] = useState<Friend[]>(mockFriends);
  const [dms, setDms] = useState<DMConversation[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(mockFriendRequests);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [threads, setThreads] = useState<Record<string, string>>({});
  const currentUserId = getCurrentUser()?.id || "anon";

  useEffect(() => {
    const savedDMId = typeof window !== "undefined" ? localStorage.getItem("lastSelectedDM") : null;
    if (savedDMId) {
      const dm = dms.find((d) => d.id === savedDMId);
      if (dm) {
        setSelectedDM(dm);
        setActiveView("dms");
      }
    }
  }, [dms]);

  useEffect(() => {
    if (selectedDM && typeof window !== "undefined") {
      localStorage.setItem("lastSelectedDM", selectedDM.id);
    }
  }, [selectedDM]);

  const filteredFriends = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredDMs = dms.filter((dm) => dm.friend.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleStartDM = (friend: Friend) => {
    const existingDM = dms.find((dm) => dm.friend.id === friend.id);
    const dmToUse =
      existingDM ||
      (() => {
        const newDM: DMConversation = {
          id: `dm-${friend.id}`,
          friend,
          lastMessage: "",
          timestamp: "Now",
          unread: 0,
        };
        setDms((prev) => [newDM, ...prev]);
        return newDM;
      })();

    chatService.createDmThread(currentUserId, friend.id).then((thread) => {
      setThreads((prev) => ({ ...prev, [friend.id]: thread.id }));
      setSelectedDM(dmToUse);
      setActiveView("dms");
    });
  };

  const handleAcceptFriendRequest = (requestId: string) => {
    const request = friendRequests.find((r) => r.id === requestId);
    if (request) {
      setFriends((prev) => [...prev, request.from]);
      setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
    }
  };

  const handleDeclineFriendRequest = (requestId: string) => {
    setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  return (
    <div className="flex-1 flex">
      <Resizable
        defaultSize={{ width: 240, height: "100%" }}
        minWidth={180}
        maxWidth={400}
        enable={{ right: true }}
        handleStyles={{ right: { width: "4px", right: "0", cursor: "ew-resize" } }}
        handleClasses={{ right: "hover:bg-[#5865f2] transition-colors" }}
      >
        <div className="h-full bg-[#2b2d31] flex flex-col border-r border-[#1e1f22]">
          <div className="p-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
                activeView === "friends" ? "bg-[#404249] text-white" : "text-gray-300 hover:bg-[#35363c] hover:text-white"
              }`}
            >
              <Users size={20} className={activeView === "friends" ? "text-[#5865f2]" : "text-gray-400"} />
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
            <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Direct Messages</span>
            <Button variant="ghost" size="sm" className="h-auto p-1 text-gray-400 hover:text-white hover:bg-transparent" onClick={() => setShowAddFriendModal(true)}>
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
                      <AvatarFallback className="bg-[#5865f2] text-white text-xs">{dm.friend.avatar}</AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#2b2d31] ${getStatusColor(dm.friend.status)}`} />
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-gray-300 text-sm truncate">{dm.friend.name}</span>
                    </div>
                    <div className="text-gray-500 text-xs truncate">{dm.lastMessage || "No messages yet"}</div>
                  </div>

                  {dm.unread > 0 && <div className="w-2 h-2 bg-[#f23f43] rounded-full flex-shrink-0" />}
                </button>
              ))}

              {filteredDMs.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">No conversations found</div>
              )}
            </div>
          </ScrollArea>

          <UserProfile userName="John Doe" userAvatar="JD" userStatus="online" customStatus="Available" />
        </div>
      </Resizable>

      <div className="flex-1 flex flex-col bg-[#313338]">
        {selectedDM && activeView === "dms" ? (
          <EnhancedDirectMessageChat
            selectedDM={{
              userId: selectedDM.friend.id,
              userName: selectedDM.friend.name,
              userAvatar: selectedDM.friend.avatar,
              userStatus: selectedDM.friend.status,
              threadId: threads[selectedDM.friend.id] || selectedDM.id,
            }}
            currentUserId={currentUserId}
            currentUserName={getCurrentUser()?.fullName || "You"}
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
                <button onClick={() => setFriendsTab("online")} className={`text-sm transition-colors ${friendsTab === "online" ? "text-white" : "text-gray-400 hover:text-gray-200"}`}>
                  Online
                </button>
                <button onClick={() => setFriendsTab("all")} className={`text-sm transition-colors ${friendsTab === "all" ? "text-white" : "text-gray-400 hover:text-gray-200"}`}>
                  All
                </button>
                <button
                  onClick={() => setFriendsTab("pending")}
                  className={`text-sm transition-colors flex items-center gap-1 ${friendsTab === "pending" ? "text-white" : "text-gray-400 hover:text-gray-200"}`}
                >
                  Pending
                  {friendRequests.length > 0 && <Badge className="bg-[#f23f43] text-white text-xs h-4 px-1.5">{friendRequests.length}</Badge>}
                </button>
                <button onClick={() => setFriendsTab("blocked")} className={`text-sm transition-colors ${friendsTab === "blocked" ? "text-white" : "text-gray-400 hover:text-gray-200"}`}>
                  Blocked
                </button>
                <button
                  onClick={() => setFriendsTab("add")}
                  className={`text-sm px-2 py-0.5 rounded transition-colors ${friendsTab === "add" ? "bg-[#3ba55d] text-white" : "bg-[#3ba55d] text-white hover:bg-[#2d7d46]"}`}
                >
                  Add Friend
                </button>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2 h-auto">
                  <Inbox size={20} />
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2 h-auto">
                  <MoreVertical size={20} />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              {friendsTab === "add" && (
                <AddFriendModal
                  open={true}
                  onClose={() => setFriendsTab("online")}
                  existingFriends={friends.map((f) => f.id)}
                  onAddFriend={(email) => {
                    setShowAddFriendModal(false);
                    toast.success(`Friend request sent to ${email}`);
                  }}
                />
              )}

              {friendsTab === "pending" && (
                <FriendRequestsPanel friendRequests={friendRequests} onAccept={handleAcceptFriendRequest} onDecline={handleDeclineFriendRequest} />
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
                    {friendsTab === "online" ? `Online - ${friends.filter((f) => f.status === "online").length}` : `All Friends - ${friends.length}`}
                  </h3>
                  <div className="space-y-2">
                    {(friendsTab === "online" ? friends.filter((f) => f.status === "online") : filteredFriends).map((friend) => (
                      <div
                        key={friend.id}
                        className="flex items-center gap-4 p-4 bg-[#2b2d31] rounded-lg hover:bg-[#35363c] transition-colors border-t border-[#3f4147] group"
                      >
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-[#5865f2] text-white">{friend.avatar}</AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#2b2d31] ${getStatusColor(friend.status)}`} />
                        </div>

                        <div className="flex-1">
                          <div className="text-white">{friend.name}</div>
                          <div className="text-gray-400 text-sm">{friend.customStatus || friend.email}</div>
                        </div>

                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button onClick={() => handleStartDM(friend)} className="bg-[#2b2d31] hover:bg-[#1e1f22] text-white p-2 h-auto" title="Message">
                            <MessageCircle size={20} />
                          </Button>
                          <Button variant="ghost" className="text-gray-400 hover:text-white p-2 h-auto" title="Voice Call">
                            <Phone size={20} />
                          </Button>
                          <Button variant="ghost" className="text-gray-400 hover:text-white p-2 h-auto" title="Video Call">
                            <Video size={20} />
                          </Button>
                          <Button variant="ghost" className="text-gray-400 hover:text-white p-2 h-auto" title="More">
                            <MoreVertical size={20} />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {(friendsTab === "online" ? friends.filter((f) => f.status === "online") : filteredFriends).length === 0 && (
                      <div className="text-center py-12">
                        <Users size={48} className="text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">{friendsTab === "online" ? "No friends online" : "No friends found"}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-[#5865f2] rounded-full flex items-center justify-center mb-4">
              <MessageCircle size={32} className="text-white" />
            </div>
            <h2 className="text-white text-xl mb-2">No conversation selected</h2>
            <p className="text-gray-400 mb-6 max-w-md">Choose a conversation from the list on the left or start a new one by clicking on a friend.</p>
            <Button onClick={() => { setActiveView("friends"); setFriendsTab("online"); }} className="bg-[#5865f2] hover:bg-[#4752c4] text-white gap-2">
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
          existingFriends={friends.map((f) => f.id)}
          onAddFriend={(email, apiKey) => {
            toast.success(`Friend request sent to ${email}`);
            setShowAddFriendModal(false);
            chatService.addFriend(currentUserId, email, apiKey);
          }}
        />
      )}
    </div>
  );
}

