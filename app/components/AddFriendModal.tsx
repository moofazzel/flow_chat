import { addFriendByInvitation, searchUsers } from "@/lib/userService";
import { sendFriendRequest } from "@/lib/friendService";
import { User } from "@/utils/auth";
import {
  Hash,
  Key,
  Loader2,
  Mail,
  MessageCircle,
  Search,
  User as UserIcon,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface AddFriendModalProps {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
  onAddFriend: (user: User) => void;
  onStartDM?: (user: User) => void;
  existingFriendIds: string[]; // Array of friend IDs
}

export function AddFriendModal({
  open,
  onClose,
  currentUserId,
  onAddFriend,
  onStartDM,
  existingFriendIds,
}: AddFriendModalProps) {
  const [activeTab, setActiveTab] = useState<"search" | "invite">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Invitation ID state
  const [invitationId, setInvitationId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Realtime search with debouncing
  useEffect(() => {
    // Don't search if query is too short or empty
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Set loading state
    setIsSearching(true);

    // Debounce: wait 500ms after user stops typing
    const debounceTimer = setTimeout(async () => {
      try {
        const results = await searchUsers(searchQuery, currentUserId);
        setSearchResults(results);
      } catch {
        toast.error("Failed to search users");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    // Cleanup: cancel the timer if user keeps typing
    return () => {
      clearTimeout(debounceTimer);
    };
  }, [searchQuery, currentUserId]);

  const handleAddFriend = async (user: User, startDm: boolean = false) => {
    if (existingFriendIds.includes(user.id)) {
      toast.error("Already friends with this user");
      return;
    }

    if (user.id === currentUserId) {
      toast.error("You cannot add yourself as a friend");
      return;
    }

    setIsProcessing(true);

    try {
      // Send friend request to database
      const result = await sendFriendRequest(currentUserId, user.id);

      if (result.success) {
        // Call parent component to update UI state
        onAddFriend(user);

        toast.success(`Friend request sent to ${user.full_name}!`, {
          description: "They'll be notified of your request",
          duration: 2000,
        });

        if (startDm && onStartDM) {
          setTimeout(() => {
            onStartDM(user);
            onClose();
          }, 500);
        } else {
          setSearchQuery("");
          setSearchResults([]);
        }
      } else {
        toast.error(result.error || "Failed to send friend request");
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Failed to send friend request");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddByInvitation = async () => {
    if (!invitationId.trim()) {
      toast.error("Please enter an invitation ID");
      return;
    }

    setIsProcessing(true);

    try {
      const result = await addFriendByInvitation(
        currentUserId,
        invitationId,
        apiKey
      );

      if (result.success && result.user) {
        onAddFriend(result.user);
        toast.success(`Added ${result.user.full_name} as a friend!`, {
          description: "You can now start messaging",
          action: {
            label: "Message",
            onClick: () => {
              if (onStartDM && result.user) {
                onStartDM(result.user);
                onClose();
              }
            },
          },
        });
        setInvitationId("");
        setApiKey("");
      } else {
        toast.error(result.error || "Failed to add friend");
      }
    } catch {
      toast.error("An error occurred while adding friend");
    } finally {
      setIsProcessing(false);
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

  const renderUserCard = (user: User, showMessageButton: boolean = false) => (
    <div
      key={user.id}
      className="flex items-center justify-between p-3 rounded-lg bg-[#1e1f22] hover:bg-[#35363c] transition-colors"
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          {user.avatar_url && (
            <AvatarImage src={user.avatar_url} alt={user.full_name} />
          )}
          <AvatarFallback className="bg-[#5865f2] text-white">
            {getInitials(user.full_name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="text-white font-medium">{user.full_name}</div>
          <div className="text-gray-400 text-sm flex items-center gap-1">
            <Mail size={12} />@{user.username}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        {showMessageButton && !existingFriendIds.includes(user.id) && (
          <Button
            onClick={() => handleAddFriend(user, true)}
            size="sm"
            variant="outline"
            disabled={isProcessing}
            className="bg-transparent border-[#5865f2] text-[#5865f2] hover:bg-[#5865f2] hover:text-white disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 size={14} className="mr-1 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <MessageCircle size={14} className="mr-1" />
                Add & Message
              </>
            )}
          </Button>
        )}
        <Button
          onClick={() => handleAddFriend(user, false)}
          size="sm"
          disabled={existingFriendIds.includes(user.id) || isProcessing}
          className={`${
            existingFriendIds.includes(user.id)
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-[#5865f2] hover:bg-[#4752c4]"
          } text-white`}
        >
          {isProcessing ? (
            <>
              <Loader2 size={14} className="mr-1 animate-spin" />
              Sending...
            </>
          ) : existingFriendIds.includes(user.id) ? (
            "Friends"
          ) : (
            <>
              <UserPlus size={14} className="mr-1" />
              Add
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#2b2d31] border-[#1e1f22] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="text-[#5865f2]" size={24} />
            Add Friend
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Search for friends or add them by invitation ID
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "search" | "invite")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-[#1e1f22]">
            <TabsTrigger
              value="search"
              className="data-[state=active]:bg-[#5865f2]"
            >
              <Search size={16} className="mr-2" />
              Search
            </TabsTrigger>
            <TabsTrigger
              value="invite"
              className="data-[state=active]:bg-[#5865f2]"
            >
              <Hash size={16} className="mr-2" />
              Invitation ID
            </TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-4 mt-4">
            {/* Search Input */}
            <div className="relative">
              <div className="flex-1 relative">
                <UserIcon
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to search by username, email, or name..."
                  className="pl-9 pr-10 bg-[#1e1f22] border-[#1e1f22] text-white placeholder:text-gray-500"
                  autoFocus
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 size={16} className="text-gray-400 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Hint text */}
            {!searchQuery && (
              <div className="text-gray-500 text-sm text-center py-4">
                Start typing to search for users...
              </div>
            )}

            {/* Minimum character hint */}
            {searchQuery && searchQuery.trim().length < 2 && (
              <div className="text-gray-500 text-sm text-center py-4">
                Type at least 2 characters to search...
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <div className="text-gray-400 text-sm font-medium px-1">
                  Found {searchResults.length} user
                  {searchResults.length > 1 ? "s" : ""}
                </div>
                {searchResults.map((user) => renderUserCard(user, true))}
              </div>
            )}

            {/* No Results */}
            {!isSearching &&
              searchQuery.trim().length >= 2 &&
              searchResults.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No users found. Try a different search term.
                </div>
              )}

            {/* Info Box */}
            <div className="bg-[#5865f2]/10 border border-[#5865f2]/20 rounded-lg p-3">
              <div className="text-[#5865f2] text-sm">
                💡 <span className="font-medium">Tip:</span> Search
                automatically as you type (searches username, email, and full
                name)
              </div>
            </div>
          </TabsContent>

          {/* Invitation ID Tab */}
          <TabsContent value="invite" className="space-y-4 mt-4">
            <div className="space-y-3">
              {/* Invitation ID Input */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">
                  User ID or Username
                </label>
                <div className="relative">
                  <Hash
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <Input
                    value={invitationId}
                    onChange={(e) => setInvitationId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAddByInvitation();
                      }
                    }}
                    placeholder="Enter user ID or username..."
                    className="pl-9 bg-[#1e1f22] border-[#1e1f22] text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* API Key Input (Optional) */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">
                  API Key (Optional)
                </label>
                <div className="relative">
                  <Key
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter API key if required..."
                    className="pl-9 bg-[#1e1f22] border-[#1e1f22] text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleAddByInvitation}
                disabled={isProcessing || !invitationId.trim()}
                className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} className="mr-2" />
                    Add by Invitation
                  </>
                )}
              </Button>
            </div>

            {/* Info Box */}
            <div className="bg-[#5865f2]/10 border border-[#5865f2]/20 rounded-lg p-3">
              <div className="text-[#5865f2] text-sm">
                💡 <span className="font-medium">Tip:</span> Ask your friend for
                their username or user ID to connect directly
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
