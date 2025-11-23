"use client";

import {
  Bell,
  ChevronRight,
  Edit,
  Folder,
  Hash,
  LogOut,
  Settings,
  Shield,
  UserPlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "./ui/dropdown-menu";

interface WorkspaceDropdownProps {
  children: React.ReactNode;
  onCreateChannel?: () => void;
  onCreateCategory?: () => void;
  onServerSettings?: () => void;
  onInvitePeople?: () => void;
  onEditServerProfile?: () => void;
}

export function WorkspaceDropdown({
  children,
  onCreateChannel,
  onCreateCategory,
  onServerSettings,
  onInvitePeople,
  onEditServerProfile,
}: WorkspaceDropdownProps) {
  return (
    <DropdownMenu>
      {children}
      <DropdownMenuContent
        className="w-56 bg-[#111214] border-none text-white shadow-xl p-1.5"
        align="start"
        sideOffset={8}
      >
        {/* Invite People */}
        <DropdownMenuItem
          className="px-2 py-2 rounded cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors text-[#b5bac1] group"
          onClick={onInvitePeople}
        >
          <div className="flex items-center gap-3 w-full">
            <div className="p-1.5 rounded bg-[#5865f2] group-hover:bg-white/10">
              <UserPlus size={16} className="text-white" />
            </div>
            <span className="font-medium">Invite People</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-[#3f4147] my-1.5" />

        {/* Server Settings */}
        <DropdownMenuItem
          className="px-2 py-2 rounded cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors text-[#b5bac1]"
          onClick={onServerSettings}
        >
          <Settings size={16} className="mr-3" />
          <span>Server Settings</span>
        </DropdownMenuItem>

        {/* Create Channel */}
        <DropdownMenuItem
          className="px-2 py-2 rounded cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors text-[#b5bac1]"
          onClick={onCreateChannel}
        >
          <Hash size={16} className="mr-3" />
          <span>Create Channel</span>
        </DropdownMenuItem>

        {/* Create Category */}
        <DropdownMenuItem
          className="px-2 py-2 rounded cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors text-[#b5bac1]"
          onClick={onCreateCategory}
        >
          <Folder size={16} className="mr-3" />
          <span>Create Category</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-[#3f4147] my-1.5" />

        {/* Notification Settings */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="px-2 py-2 rounded cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors text-[#b5bac1] focus:bg-[#5865f2] focus:text-white">
            <Bell size={16} className="mr-3" />
            <span>Notification Settings</span>
            <ChevronRight size={16} className="ml-auto" />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-[#111214] border-none text-white shadow-xl p-1.5 ml-1">
            <DropdownMenuItem className="px-2 py-2 rounded cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors text-[#b5bac1]">
              All Messages
            </DropdownMenuItem>
            <DropdownMenuItem className="px-2 py-2 rounded cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors text-[#b5bac1]">
              Only @mentions
            </DropdownMenuItem>
            <DropdownMenuItem className="px-2 py-2 rounded cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors text-[#b5bac1]">
              Nothing
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#3f4147] my-1.5" />
            <DropdownMenuItem className="px-2 py-2 rounded cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors text-[#b5bac1]">
              <Bell size={14} className="mr-2" />
              Mute Server
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Privacy Settings */}
        <DropdownMenuItem className="px-2 py-2 rounded cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors text-[#b5bac1]">
          <Shield size={16} className="mr-3" />
          <span>Privacy Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-[#3f4147] my-1.5" />

        {/* Edit Server Profile */}
        <DropdownMenuItem
          className="px-2 py-2 rounded cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors text-[#b5bac1]"
          onClick={onEditServerProfile}
        >
          <Edit size={16} className="mr-3" />
          <span>Edit Server Profile</span>
        </DropdownMenuItem>

        {/* Hide Muted Channels */}
        <DropdownMenuItem className="px-2 py-2 rounded cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors text-[#b5bac1]">
          <span className="ml-9 text-sm">Hide Muted Channels</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-[#3f4147] my-1.5" />

        {/* Leave Server */}
        <DropdownMenuItem className="px-2 py-2 rounded cursor-pointer hover:bg-[#ed4245] hover:text-white transition-colors text-[#ed4245]">
          <LogOut size={16} className="mr-3" />
          <span>Leave Server</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
