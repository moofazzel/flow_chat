"use client";

import {
  createChannel,
  createServer,
  deleteChannel,
  getServerChannels,
  getUserServers,
  removeServerMember,
  renameChannel,
  updateServerMuteStatus,
  updateServerNotificationSettings,
} from "@/lib/serverService";
import { getCurrentUser } from "@/utils/auth";
import { motion } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Hash,
  LayoutGrid,
  MessageSquare,
  MoreVertical,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Volume2,
} from "lucide-react";
import { Resizable } from "re-resizable";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CreateCategoryModal } from "./CreateCategoryModal";
import { CreateChannelModal } from "./CreateChannelModal";
import { CreateServerModal, type ServerData } from "./CreateServerModal";
import { InvitePeopleModal } from "./InvitePeopleModal";
import { ManageChannelModal } from "./ManageChannelModal";
import { ServerSettingsModal } from "./ServerSettingsModal";
import { Badge } from "./ui/badge";
import { DropdownMenuTrigger } from "./ui/dropdown-menu";
import { ScrollArea } from "./ui/scroll-area";
import { UserProfile } from "./UserProfile";
import { WorkspaceDropdown } from "./WorkspaceDropdown";

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  selectedChannel: string;
  onChannelSelect: (channelId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelectDM?: (
    dmId: string,
    userName: string,
    userAvatar: string,
    userStatus: "online" | "idle" | "dnd" | "offline"
  ) => void;
  onServerChange?: (serverId: string | null) => void;
}

// Add local types for Sidebar
type ViewType = "chat" | "board" | "dm";

interface Channel {
  id: string;
  name: string;
  type: "text" | "voice" | "announcement";
  category: string;
  unread?: number;
}

interface DirectMessage {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "idle" | "dnd" | "offline";
}

// Server notification data
const serverNotifications = {
  home: { chat: 3, board: 0 },
  workspace: { chat: 15, board: 1 },
};

// Notification Badge Component
function NotificationBadges({
  chat,
  board,
}: {
  chat?: number;
  board?: number;
}) {
  if (!chat && !board) return null;

  return (
    <div className="absolute -top-1 -right-1 flex flex-col gap-0.5 pointer-events-none">
      {chat && chat > 0 && (
        <div className="bg-[#f23f43] text-white text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg">
          {chat > 99 ? "99+" : chat}
        </div>
      )}
      {board && board > 0 && (
        <div className="bg-[#f0b232] text-white text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg">
          {board > 99 ? "99+" : board}
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  currentView,
  onViewChange,
  selectedChannel,
  onChannelSelect,
  collapsed,
  onToggleCollapse,
  onServerChange,
}: SidebarProps) {
  const [textChannelsOpen, setTextChannelsOpen] = useState(true);
  const [voiceChannelsOpen, setVoiceChannelsOpen] = useState(true);
  const [directMessagesOpen, setDirectMessagesOpen] = useState(true);
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showInvitePeople, setShowInvitePeople] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [showEditServerProfile, setShowEditServerProfile] = useState(false);
  const [currentServerId, setCurrentServerId] = useState<string | null>(null);
  const [servers, setServers] = useState<{ id: string; name: string }[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [voiceChannels, setVoiceChannels] = useState<Channel[]>([]);
  const [manageChannelTarget, setManageChannelTarget] =
    useState<Channel | null>(null);
  const [showManageChannel, setShowManageChannel] = useState(false);
  const [notificationSetting, setNotificationSetting] = useState<
    "all" | "mentions" | "nothing"
  >("all");
  const [isServerMuted, setIsServerMuted] = useState(false);
  const [hideMutedChannels, setHideMutedChannels] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    async function init() {
      const user = await getCurrentUser();
      if (!user) return;

      setCurrentUser({ id: user.id });
      const serversList = await getUserServers(user.id);
      setServers(serversList.map((s) => ({ id: s.id, name: s.name })));
      const defaultServerId = serversList[0]?.id || null;
      if (defaultServerId) {
        setCurrentServerId(defaultServerId);
      }
    }
    init();
  }, []);

  useEffect(() => {
    async function load() {
      if (!currentServerId) {
        console.log("⚠️ No server selected, skipping channel load");
        return;
      }
      console.log("📡 Loading channels for server:", currentServerId);
      const serverChannels = await getServerChannels(currentServerId);
      console.log("📋 Channels loaded:", serverChannels);
      const mapped = serverChannels.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        category: c.category || "TEXT CHANNELS",
      }));
      const textChannels = mapped.filter((c) => c.type === "text");
      setChannels(textChannels);
      setVoiceChannels(mapped.filter((c) => c.type === "voice"));
      console.log(
        "✅ Set channels - Text:",
        textChannels.length,
        "Voice:",
        mapped.filter((c) => c.type === "voice").length
      );

      // Auto-select first text channel if available
      if (
        textChannels.length > 0 &&
        (!selectedChannel || currentView === "chat")
      ) {
        const firstChannel = textChannels[0];
        console.log("🎯 Auto-selecting first channel:", firstChannel.name);
        onChannelSelect(firstChannel.id);
      }
    }
    load();
  }, [currentServerId]);

  // Notify parent component when server changes
  useEffect(() => {
    onServerChange?.(currentServerId);
  }, [currentServerId, onServerChange]);

  const handleCreateServer = async (serverData: ServerData) => {
    const user = await getCurrentUser();
    if (!user) {
      toast.error("Please log in to create a server");
      return;
    }

    const { success, server, error } = await createServer(
      serverData.name,
      user.id,
      serverData.description,
      serverData.icon
    );

    if (!success || !server) {
      toast.error(error || "Failed to create server");
      return;
    }

    console.log("✅ Server created successfully:", server.id);

    // Create channels from modal data OR default channels
    const channelsToCreate =
      serverData.channels.length > 0
        ? serverData.channels
        : [
            { name: "general", type: "text", category: "TEXT CHANNELS" },
            { name: "announcements", type: "text", category: "TEXT CHANNELS" },
            { name: "General", type: "voice", category: "VOICE CHANNELS" },
          ];

    console.log("📝 Creating", channelsToCreate.length, "channels...");
    for (const ch of channelsToCreate) {
      const result = await createChannel(
        server.id,
        ch.name,
        ch.type === "text" ? "text" : "voice",
        ch.category
      );
      if (result.success) {
        console.log("✅ Created channel:", ch.name);
      } else {
        console.error("❌ Failed to create channel:", ch.name, result.error);
      }
    }

    // Refresh servers list and select the new server
    const serversList = await getUserServers(user.id);
    setServers(serversList.map((s) => ({ id: s.id, name: s.name })));
    setCurrentServerId(server.id);

    toast.success("Server created successfully!");
    setShowCreateServer(false);
  };

  const handleCreateChannel = async (channelData: {
    name: string;
    type: "text" | "voice";
    isPrivate?: boolean; // passed from modal but currently unused
  }) => {
    if (!currentServerId) {
      toast.error("Create or select a server first");
      return;
    }

    const { success, error } = await createChannel(
      currentServerId,
      channelData.name,
      channelData.type,
      channelData.type === "voice" ? "VOICE CHANNELS" : "TEXT CHANNELS"
    );

    if (!success) {
      toast.error(error || "Failed to create channel");
      return;
    }

    // Refresh channels list
    const serverChannels = await getServerChannels(currentServerId);
    const mapped = serverChannels.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      category: c.category || "TEXT CHANNELS",
    }));
    setChannels(mapped.filter((c) => c.type === "text"));
    setVoiceChannels(mapped.filter((c) => c.type === "voice"));

    toast.success("Channel created successfully!");
    setShowCreateChannel(false);
  };

  const handleCreateCategory = (categoryData: { name: string }) => {
    console.log("Creating category:", categoryData);
    // In a real app, you would create the category here
    toast.success("Category created successfully!");
  };

  const handleNotificationChange = async (
    setting: "all" | "mentions" | "nothing"
  ) => {
    if (!currentServerId || !currentUser) return;

    const { success, error } = await updateServerNotificationSettings(
      currentServerId,
      currentUser.id,
      setting
    );

    if (success) {
      setNotificationSetting(setting);
      toast.success(`Notifications set to ${setting}`);
    } else {
      toast.error(error || "Failed to update notification settings");
    }
  };

  const handleMuteServer = async () => {
    if (!currentServerId || !currentUser) return;

    const newMutedState = !isServerMuted;
    const { success, error } = await updateServerMuteStatus(
      currentServerId,
      currentUser.id,
      newMutedState
    );

    if (success) {
      setIsServerMuted(newMutedState);
      toast.success(newMutedState ? "Server muted" : "Server unmuted");
    } else {
      toast.error(error || "Failed to update mute status");
    }
  };

  const handleHideMutedChannels = () => {
    setHideMutedChannels(!hideMutedChannels);
    toast.success(
      hideMutedChannels ? "Showing muted channels" : "Hiding muted channels"
    );
  };

  const handleLeaveServer = async () => {
    if (!currentServerId || !currentUser) return;

    // Show confirmation dialog
    if (
      !confirm(
        "Are you sure you want to leave this server? You'll need an invite to rejoin."
      )
    ) {
      return;
    }

    const { success, error } = await removeServerMember(
      currentServerId,
      currentUser.id
    );

    if (success) {
      // Refresh server list
      const serversList = await getUserServers(currentUser.id);
      setServers(serversList.map((s) => ({ id: s.id, name: s.name })));

      // Switch to first available server or null
      const newServerId = serversList[0]?.id || null;
      setCurrentServerId(newServerId);

      if (newServerId) {
        const serverChannels = await getServerChannels(newServerId);
        const mapped = serverChannels.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          category: c.category || "TEXT CHANNELS",
        }));
        setChannels(mapped.filter((c) => c.type === "text"));
        setVoiceChannels(mapped.filter((c) => c.type === "voice"));
      } else {
        setChannels([]);
        setVoiceChannels([]);
      }

      toast.success("Left server successfully");
    } else {
      toast.error(error || "Failed to leave server");
    }
  };

  if (collapsed) {
    return (
      <motion.div
        initial={false}
        animate={{ width: 72 }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 32,
          mass: 0.7,
        }}
        className="bg-[#1e1f22] py-3 flex flex-col items-center gap-2 overflow-hidden"
      >
        {/* Home/DM Button */}
        <motion.button
          onClick={() => onViewChange("dm")}
          whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
          whileTap={{ scale: 0.9 }}
          animate={{
            scale: currentView === "dm" ? 1.05 : 1,
          }}
          transition={{
            scale: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
            rotate: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
          }}
          className={`w-12 h-12 rounded-[24px] flex items-center justify-center hover:rounded-[16px] transition-all cursor-pointer mb-2 ${
            currentView === "dm"
              ? "bg-[#5865f2] text-white"
              : "bg-[#313338] text-gray-400 hover:bg-[#5865f2] hover:text-white"
          }`}
          title="Home / Direct Messages"
        >
          <motion.div
            animate={{
              rotate: currentView === "dm" ? [0, -10, 10, -10, 0] : 0,
              scale: currentView === "dm" ? [1, 1.2, 1] : 1,
            }}
            transition={{
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <MessageSquare size={20} />
          </motion.div>
        </motion.button>

        <div className="w-8 h-[2px] bg-[#35363c] rounded-full" />

        {/* Dynamic Server List in Collapsed Mode */}
        {servers.map((server) => (
          <motion.div
            key={server.id}
            onClick={() => {
              setCurrentServerId(server.id);
              onViewChange("chat");
            }}
            whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
            whileTap={{ scale: 0.9 }}
            transition={{
              scale: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
              rotate: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
            }}
            className={`w-12 h-12 rounded-[24px] flex items-center justify-center hover:rounded-[16px] transition-all cursor-pointer ${
              currentServerId === server.id
                ? "bg-[#5865f2]"
                : "bg-[#313338] hover:bg-[#5865f2]"
            }`}
            title={server.name}
          >
            <span className="text-white text-sm font-semibold">
              {server.name
                .split(" ")
                .map((word) => word[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </span>
          </motion.div>
        ))}

        <div className="w-8 h-[2px] bg-[#35363c] rounded-full" />

        <div className="flex-1" />

        {/* Improved Expand Button */}
        <motion.button
          onClick={onToggleCollapse}
          whileHover={{ scale: 1.15, rotate: [0, -8, 8, 0] }}
          whileTap={{ scale: 0.85 }}
          transition={{
            scale: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
            rotate: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
          }}
          className="relative w-12 h-12 bg-gradient-to-br from-[#5865f2] to-[#4752c4] rounded-[16px] flex items-center justify-center hover:shadow-lg hover:shadow-[#5865f2]/30 transition-all text-white group"
          title="Expand sidebar"
        >
          <motion.div
            animate={{ x: [0, 3, 0] }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: "easeInOut",
            }}
          >
            <PanelLeftOpen size={20} />
          </motion.div>
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-[16px] bg-white"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 0.1 }}
            transition={{ duration: 0.2 }}
          />
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="flex">
      {/* Server bar */}
      <div className="w-[72px] bg-[#1e1f22] py-3 flex flex-col items-center gap-2">
        {/* Home/DM Button */}
        <div className="relative">
          <motion.button
            onClick={() => onViewChange("dm")}
            whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
            whileTap={{ scale: 0.9 }}
            animate={{
              scale: currentView === "dm" ? 1.05 : 1,
            }}
            transition={{
              scale: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
              rotate: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
            }}
            className={`w-12 h-12 rounded-[24px] flex items-center justify-center hover:rounded-[16px] transition-all cursor-pointer ${
              currentView === "dm"
                ? "bg-[#5865f2] text-white"
                : "bg-[#313338] text-gray-400 hover:bg-[#5865f2] hover:text-white"
            }`}
            title="Home / Direct Messages"
          >
            <motion.div
              animate={{
                rotate: currentView === "dm" ? [0, -10, 10, -10, 0] : 0,
                scale: currentView === "dm" ? [1, 1.2, 1] : 1,
              }}
              transition={{
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <MessageSquare size={20} />
            </motion.div>
          </motion.button>
          <NotificationBadges
            chat={serverNotifications.home.chat}
            board={serverNotifications.home.board}
          />
        </div>

        {servers.length > 0 && (
          <div className="w-8 h-[2px] bg-[#35363c] rounded-full" />
        )}

        {/* Dynamic Server List */}
        {servers.map((server) => (
          <div key={server.id} className="relative">
            <motion.div
              onClick={() => {
                setCurrentServerId(server.id);
                onViewChange("chat");
              }}
              whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
              whileTap={{ scale: 0.9 }}
              transition={{
                scale: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
                rotate: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
              }}
              className={`w-12 h-12 rounded-[24px] flex items-center justify-center hover:rounded-[16px] transition-all cursor-pointer ${
                currentServerId === server.id
                  ? "bg-[#5865f2]"
                  : "bg-[#313338] hover:bg-[#5865f2]"
              }`}
              title={server.name}
            >
              <span className="text-white text-sm font-semibold">
                {server.name
                  .split(" ")
                  .map((word) => word[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </span>
            </motion.div>
            {currentServerId === server.id && (
              <NotificationBadges
                chat={serverNotifications.workspace.chat}
                board={serverNotifications.workspace.board}
              />
            )}
          </div>
        ))}

        <div className="w-8 h-[2px] bg-[#35363c] rounded-full" />
        <motion.div
          onClick={() => setShowCreateServer(true)}
          whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
          whileTap={{ scale: 0.9 }}
          transition={{
            scale: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
            rotate: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
          }}
          className="w-12 h-12 bg-[#313338] rounded-[24px] flex items-center justify-center hover:rounded-[16px] hover:bg-[#5865f2] transition-all cursor-pointer group"
        >
          <Plus className="text-[#3ba55d] group-hover:text-white" />
        </motion.div>
      </div>

      {/* Channel sidebar - Hidden when in DM view */}
      {currentView !== "dm" && (
        <motion.div
          initial={false}
          animate={{ width: 240, opacity: 1, x: 0 }}
          exit={{ width: 0, opacity: 0, x: -20 }}
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 32,
            mass: 0.7,
          }}
        >
          <Resizable
            defaultSize={{ width: 240, height: "100%" }}
            minWidth={180}
            maxWidth={400}
            enable={{ right: true }}
            handleStyles={{
              right: {
                width: "4px",
                right: "0",
                cursor: "ew-resize",
              },
            }}
            handleClasses={{
              right: "hover:bg-[#5865f2] transition-colors",
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="h-full bg-[#2b2d31] flex flex-col border-r border-[#1e1f22]"
            >
              <WorkspaceDropdown
                serverName={
                  servers.find((s) => s.id === currentServerId)?.name ||
                  "Select Server"
                }
                onCreateChannel={() => setShowCreateChannel(true)}
                onCreateCategory={() => setShowCreateCategory(true)}
                onServerSettings={() => setShowServerSettings(true)}
                onInvitePeople={() => setShowInvitePeople(true)}
                onNotificationChange={handleNotificationChange}
                onMuteServer={handleMuteServer}
                onHideMutedChannels={handleHideMutedChannels}
                onLeaveServer={handleLeaveServer}
                currentNotificationSetting={notificationSetting}
                isMuted={isServerMuted}
                hideMutedChannels={hideMutedChannels}
              >
                <DropdownMenuTrigger asChild>
                  <div className="h-12 px-4 flex items-center shadow-md border-b border-[#1e1f22] cursor-pointer hover:bg-[#35363c] transition-colors">
                    <span className="text-white font-semibold">
                      {servers.find((s) => s.id === currentServerId)?.name ||
                        "Select Server"}
                    </span>
                    <ChevronDown className="ml-auto text-gray-400" size={18} />
                  </div>
                </DropdownMenuTrigger>
              </WorkspaceDropdown>

              {/* View Toggle */}
              <div className="p-2 border-b border-[#1e1f22]">
                <div className="flex gap-1 bg-[#1e1f22] rounded-md p-1 relative">
                  {/* Animated Background Indicator */}
                  <motion.div
                    layout
                    initial={false}
                    animate={{
                      x: currentView === "chat" ? 0 : "100%",
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                      mass: 0.8,
                    }}
                    className="absolute inset-y-1 w-[calc(50%-4px)] bg-[#404249] rounded-md shadow-sm"
                  />

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    className={`flex-1 gap-2 flex items-center justify-center py-1.5 px-3 rounded-md relative z-10 transition-colors duration-200 ${
                      currentView === "chat"
                        ? "text-white"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                    onClick={() => onViewChange("chat")}
                  >
                    <motion.div
                      animate={{
                        scale: currentView === "chat" ? 1 : 0.9,
                        rotate: currentView === "chat" ? [0, -10, 10, 0] : 0,
                      }}
                      transition={{
                        scale: { duration: 0.2 },
                        rotate: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                      }}
                    >
                      <MessageSquare size={16} />
                    </motion.div>
                    <span className="text-sm">Chat</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    className={`flex-1 gap-2 flex items-center justify-center py-1.5 px-3 rounded-md relative z-10 transition-colors duration-200 ${
                      currentView === "board"
                        ? "text-white"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                    onClick={() => onViewChange("board")}
                  >
                    <motion.div
                      animate={{
                        scale: currentView === "board" ? 1 : 0.9,
                        rotate: currentView === "board" ? [0, -10, 10, 0] : 0,
                      }}
                      transition={{
                        scale: { duration: 0.2 },
                        rotate: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                      }}
                    >
                      <LayoutGrid size={16} />
                    </motion.div>
                    <span className="text-sm">Board</span>
                  </motion.button>
                </div>

                {/* Improved Collapse Button */}
                <motion.button
                  onClick={onToggleCollapse}
                  whileHover={{ scale: 1.03, x: -3 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{
                    duration: 0.2,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="relative w-full mt-2 gap-2 py-2 px-3 rounded-md bg-gradient-to-r from-[#313338] to-[#2b2d31] hover:from-[#5865f2] hover:to-[#4752c4] text-gray-400 hover:text-white transition-all group overflow-hidden flex items-center justify-center"
                >
                  {/* Animated icon */}
                  <motion.div
                    animate={{ x: [-3, 0, -3] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "easeInOut",
                    }}
                  >
                    <PanelLeftClose size={16} />
                  </motion.div>
                  <span className="text-sm">Collapse sidebar</span>

                  {/* Shine effect on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      ease: "linear",
                    }}
                  />
                </motion.button>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-2">
                  {/* Text Channels */}
                  <div className="mb-4">
                    <button
                      onClick={() => setTextChannelsOpen(!textChannelsOpen)}
                      className="flex items-center px-2 mb-1 w-full hover:text-gray-200 transition-colors"
                    >
                      {textChannelsOpen ? (
                        <ChevronDown size={12} className="text-gray-400 mr-1" />
                      ) : (
                        <ChevronRight
                          size={12}
                          className="text-gray-400 mr-1"
                        />
                      )}
                      <span className="text-gray-400 text-xs tracking-wide">
                        TEXT CHANNELS
                      </span>
                      <Plus
                        size={16}
                        className="ml-auto text-gray-400 hover:text-gray-200 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCreateChannel(true);
                        }}
                      />
                    </button>
                    {textChannelsOpen &&
                      channels.map((channel) => (
                        <div key={channel.id} className="relative group">
                          <button
                            onClick={() => onChannelSelect(channel.id)}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#35363c] text-gray-400 hover:text-gray-200 ${
                              selectedChannel === channel.id &&
                              currentView === "chat"
                                ? "bg-[#35363c] text-gray-200"
                                : ""
                            }`}
                          >
                            <Hash
                              size={18}
                              className="text-gray-500 flex-shrink-0"
                            />
                            <span className="text-[15px] flex-1 truncate text-left">
                              {channel.name}
                            </span>
                            {channel.unread && channel.unread > 0 && (
                              <Badge className="bg-[#f23f43] text-white text-xs h-4 min-w-[1rem] px-1.5 flex-shrink-0 flex items-center justify-center">
                                {channel.unread > 99 ? "99+" : channel.unread}
                              </Badge>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setManageChannelTarget(channel);
                              setShowManageChannel(true);
                            }}
                            className="absolute top-1 right-1 p-1 rounded text-gray-500 hover:text-gray-200 hover:bg-[#404249] opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Manage channel"
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      ))}
                  </div>

                  {/* Voice Channels */}
                  <div className="mb-4">
                    <button
                      onClick={() => setVoiceChannelsOpen(!voiceChannelsOpen)}
                      className="flex items-center px-2 mb-1 w-full hover:text-gray-200 transition-colors"
                    >
                      {voiceChannelsOpen ? (
                        <ChevronDown size={12} className="text-gray-400 mr-1" />
                      ) : (
                        <ChevronRight
                          size={12}
                          className="text-gray-400 mr-1"
                        />
                      )}
                      <span className="text-gray-400 text-xs tracking-wide">
                        VOICE CHANNELS
                      </span>
                    </button>
                    {voiceChannelsOpen &&
                      voiceChannels.map((channel) => (
                        <div key={channel.id} className="relative group">
                          <button
                            onClick={() => onChannelSelect(channel.id)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#35363c] text-gray-400 hover:text-gray-200"
                          >
                            <Volume2 size={18} className="text-gray-500" />
                            <span className="text-[15px]">{channel.name}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setManageChannelTarget(channel);
                              setShowManageChannel(true);
                            }}
                            className="absolute top-1 right-1 p-1 rounded text-gray-500 hover:text-gray-200 hover:bg-[#404249] opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Manage channel"
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </ScrollArea>

              {/* User Profile Component */}
              <UserProfile
                userName="John Doe"
                userAvatar="JD"
                userStatus="online"
              />
            </motion.div>
          </Resizable>
        </motion.div>
      )}

      {/* Create Server Modal */}
      <CreateServerModal
        isOpen={showCreateServer}
        onClose={() => setShowCreateServer(false)}
        onCreate={handleCreateServer}
      />

      {/* Create Channel Modal */}
      <CreateChannelModal
        isOpen={showCreateChannel}
        onClose={() => setShowCreateChannel(false)}
        onCreate={handleCreateChannel}
      />

      {/* Create Category Modal */}
      <CreateCategoryModal
        isOpen={showCreateCategory}
        onClose={() => setShowCreateCategory(false)}
        onCreate={handleCreateCategory}
      />

      {/* Invite People Modal */}
      <InvitePeopleModal
        isOpen={showInvitePeople}
        onClose={() => setShowInvitePeople(false)}
        serverId={currentServerId || undefined}
      />

      {/* Server Settings Modal */}
      <ServerSettingsModal
        isOpen={showServerSettings}
        onClose={() => setShowServerSettings(false)}
      />

      {manageChannelTarget && (
        <ManageChannelModal
          isOpen={showManageChannel}
          channel={manageChannelTarget}
          onClose={() => {
            setShowManageChannel(false);
            setManageChannelTarget(null);
          }}
          onRename={async (newName) => {
            const { success, error } = await renameChannel(
              manageChannelTarget.id,
              newName
            );
            if (!success) {
              toast.error(error || "Failed to rename channel");
              return;
            }
            // Refresh channels
            if (currentServerId) {
              const serverChannels = await getServerChannels(currentServerId);
              const mapped = serverChannels.map((c) => ({
                id: c.id,
                name: c.name,
                type: c.type,
                category: c.category || "TEXT CHANNELS",
              }));
              setChannels(mapped.filter((c) => c.type === "text"));
              setVoiceChannels(mapped.filter((c) => c.type === "voice"));
            }
            toast.success("Channel renamed");
          }}
          onDelete={async () => {
            const { success, error } = await deleteChannel(
              manageChannelTarget.id
            );
            if (!success) {
              toast.error(error || "Failed to delete channel");
              return;
            }
            if (currentServerId) {
              const serverChannels = await getServerChannels(currentServerId);
              const mapped = serverChannels.map((c) => ({
                id: c.id,
                name: c.name,
                type: c.type,
                category: c.category || "TEXT CHANNELS",
              }));
              setChannels(mapped.filter((c) => c.type === "text"));
              setVoiceChannels(mapped.filter((c) => c.type === "voice"));
            }
            if (selectedChannel === manageChannelTarget.id) {
              onChannelSelect("general");
            }
            toast.success("Channel deleted");
          }}
        />
      )}
    </div>
  );
}
