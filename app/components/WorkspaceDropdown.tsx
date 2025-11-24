"use client";

import {
  Bell,
  EyeOff,
  Folder,
  Hash,
  LogOut,
  Settings,
  UserPlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "./ui/dropdown-menu";

interface WorkspaceDropdownProps {
  children: React.ReactNode;
  serverName?: string;
  onCreateChannel?: () => void;
  onCreateCategory?: () => void;
  onServerSettings?: () => void;
  onInvitePeople?: () => void;
  onNotificationChange?: (setting: "all" | "mentions" | "nothing") => void;
  onMuteServer?: () => void;
  onHideMutedChannels?: () => void;
  onLeaveServer?: () => void;
  currentNotificationSetting?: "all" | "mentions" | "nothing";
  isMuted?: boolean;
  hideMutedChannels?: boolean;
}

export function WorkspaceDropdown({
  children,
  serverName = "Workspace",
  onCreateChannel,
  onCreateCategory,
  onServerSettings,
  onInvitePeople,
  onNotificationChange,
  onMuteServer,
  onHideMutedChannels,
  onLeaveServer,
  currentNotificationSetting = "all",
  isMuted = false,
  hideMutedChannels = false,
}: WorkspaceDropdownProps) {
  return (
    <DropdownMenu>
      {children}
      <DropdownMenuContent
        className="w-60 bg-[#111214] border-none text-white shadow-xl p-1.5"
        align="start"
        sideOffset={8}
      >
        {/* Server Name Header */}
        <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold text-white border-b border-[#3f4147] mb-1">
          {serverName}
        </DropdownMenuLabel>

        {/* Quick Actions Section */}
        <div className="space-y-0.5">
          <DropdownMenuItem
            className="px-3 py-2.5 rounded cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors text-[#b5bac1] group"
            onClick={onInvitePeople}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="p-1.5 rounded bg-[#5865f2] group-hover:bg-white/10">
                <UserPlus size={16} className="text-white" />
              </div>
              <span className="font-medium">Invite People</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="px-3 py-2 rounded cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors text-[#b5bac1]"
            onClick={onServerSettings}
          >
            <Settings size={16} className="mr-3" />
            <span>Server Settings</span>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="bg-[#3f4147] my-1.5" />

        {/* Channel Management Section */}
        <div className="px-2 py-1">
          <div className="text-[#80848e] text-xs uppercase tracking-wider font-semibold px-1 mb-1">
            Manage Channels
          </div>
          <DropdownMenuItem
            className="px-3 py-2 rounded cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors text-[#b5bac1]"
            onClick={onCreateChannel}
          >
            <Hash size={16} className="mr-3" />
            <span>Create Channel</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="px-3 py-2 rounded cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors text-[#b5bac1]"
            onClick={onCreateCategory}
          >
            <Folder size={16} className="mr-3" />
            <span>Create Category</span>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="bg-[#3f4147] my-1.5" />

        {/* Preferences Section */}
        <div className="px-2 py-1">
          <div className="text-[#80848e] text-xs uppercase tracking-wider font-semibold px-1 mb-1">
            Preferences
          </div>

          {/* Notification Settings */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="px-3 py-2 rounded cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors text-[#b5bac1] focus:bg-[#5865f2] focus:text-white">
              <Bell size={16} className="mr-3" />
              <span>Notifications</span>
              {isMuted && (
                <span className="ml-auto mr-2 text-xs bg-[#ed4245] px-1.5 py-0.5 rounded">
                  Muted
                </span>
              )}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-52 bg-[#111214] border-none text-white shadow-xl p-1.5 ml-1">
              <div className="px-2 py-1 mb-1">
                <div className="text-[#80848e] text-xs uppercase tracking-wider font-semibold">
                  Notify Me For
                </div>
              </div>
              <DropdownMenuItem
                className={`px-3 py-2 rounded cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors ${
                  currentNotificationSetting === "all"
                    ? "bg-[#5865f2] text-white"
                    : "text-[#b5bac1]"
                }`}
                onClick={() => onNotificationChange?.("all")}
              >
                <div className="flex items-center gap-2">
                  {currentNotificationSetting === "all" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                  <span
                    className={
                      currentNotificationSetting === "all" ? "font-medium" : ""
                    }
                  >
                    All Messages
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                className={`px-3 py-2 rounded cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors ${
                  currentNotificationSetting === "mentions"
                    ? "bg-[#5865f2] text-white"
                    : "text-[#b5bac1]"
                }`}
                onClick={() => onNotificationChange?.("mentions")}
              >
                <div className="flex items-center gap-2">
                  {currentNotificationSetting === "mentions" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                  <span
                    className={
                      currentNotificationSetting === "mentions"
                        ? "font-medium"
                        : ""
                    }
                  >
                    Only @mentions
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                className={`px-3 py-2 rounded cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors ${
                  currentNotificationSetting === "nothing"
                    ? "bg-[#5865f2] text-white"
                    : "text-[#b5bac1]"
                }`}
                onClick={() => onNotificationChange?.("nothing")}
              >
                <div className="flex items-center gap-2">
                  {currentNotificationSetting === "nothing" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                  <span
                    className={
                      currentNotificationSetting === "nothing"
                        ? "font-medium"
                        : ""
                    }
                  >
                    Nothing
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#3f4147] my-1.5" />
              <DropdownMenuItem
                className={`px-3 py-2 rounded cursor-pointer transition-colors ${
                  isMuted
                    ? "text-[#23a559] hover:bg-[#23a559] hover:text-white"
                    : "text-[#ed4245] hover:bg-[#ed4245] hover:text-white"
                }`}
                onClick={onMuteServer}
              >
                <Bell size={16} className="mr-3" />
                {isMuted ? "Unmute Server" : "Mute Server"}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Hide Muted Channels */}
          <DropdownMenuItem
            className={`px-3 py-2 rounded cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors ${
              hideMutedChannels ? "text-white bg-[#404249]" : "text-[#b5bac1]"
            }`}
            onClick={onHideMutedChannels}
          >
            <EyeOff size={16} className="mr-3" />
            <span>Hide Muted Channels</span>
            {hideMutedChannels && (
              <span className="ml-auto text-[#23a559]">✓</span>
            )}
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="bg-[#3f4147] my-1.5" />

        {/* Danger Zone */}
        <DropdownMenuItem
          className="px-3 py-2 rounded cursor-pointer hover:bg-[#ed4245] hover:text-white transition-colors text-[#ed4245] font-medium"
          onClick={onLeaveServer}
        >
          <LogOut size={16} className="mr-3" />
          <span>Leave Server</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
