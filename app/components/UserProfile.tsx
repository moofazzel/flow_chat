"use client";

import { Settings } from "lucide-react";
import { memo, useState } from "react";
import { AudioControlsPopover } from "./AudioControlsPopover";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { UserSettingsModal } from "./UserSettingsModal";

interface UserProfileProps {
  userName?: string;
  userAvatar?: string;
  userStatus?: "online" | "idle" | "dnd" | "offline";
  customStatus?: string;
  userId?: string;
  username?: string;
}

const getStatusColor = (status: UserProfileProps["userStatus"]) => {
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

export const UserProfile = memo(function UserProfile({
  userName = "John Doe",
  userAvatar = "JD",
  userStatus = "online",
  customStatus,
  userId,
  username,
}: UserProfileProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  const handleCopyUserId = () => {
    if (userId) {
      navigator.clipboard.writeText(userId);
      // Using a simple toast would be better, but for now this works
      const button = document.activeElement as HTMLElement;
      const originalText = button.textContent;
      button.textContent = "Copied!";
      setTimeout(() => {
        button.textContent = originalText;
      }, 1000);
    }
  };

  return (
    <>
      <div className="mt-auto bg-[#232428] p-2 flex items-center gap-2">
        <div className="relative">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-[#5865f2] text-white text-xs">
              {userAvatar}
            </AvatarFallback>
          </Avatar>
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#232428] ${getStatusColor(
              userStatus
            )}`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-white text-sm truncate">{userName}</div>
          <button
            onClick={handleCopyUserId}
            className="text-gray-400 hover:text-gray-300 text-xs truncate transition-colors cursor-pointer text-left w-full"
            title="Click to copy User ID"
          >
            {username ? `@${username}` : customStatus || "Set status"}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <AudioControlsPopover
            type="mic"
            isMuted={isMicMuted}
            onToggle={() => setIsMicMuted(!isMicMuted)}
          />
          <AudioControlsPopover
            type="headphones"
            isMuted={isDeafened}
            onToggle={() => setIsDeafened(!isDeafened)}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-[#35363c]"
            title="User Settings"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings size={18} />
          </Button>
        </div>
      </div>

      {/* Settings Modal */}
      <UserSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userName={userName}
        userAvatar={userAvatar}
        userStatus={userStatus}
      />
    </>
  );
});
