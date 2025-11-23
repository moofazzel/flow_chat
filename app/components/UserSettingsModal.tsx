"use client";

import { User as AuthUser, getCurrentUser } from "@/utils/auth";
import {
  Bell,
  ChevronRight,
  Keyboard,
  Languages,
  LogOut,
  Palette,
  Shield,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userAvatar: string;
  userStatus: "online" | "idle" | "dnd" | "offline";
}

export function UserSettingsModal({
  isOpen,
  onClose,
  userName,
  userAvatar,
  userStatus,
}: UserSettingsModalProps) {
  const [activeTab, setActiveTab] = useState("account");
  const [customStatus, setCustomStatus] = useState("Available");
  const [showActivity, setShowActivity] = useState(true);
  const [allowDMs, setAllowDMs] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Fetch current user when modal opens
  useEffect(() => {
    if (isOpen) {
      getCurrentUser().then((user) => {
        setCurrentUser(user);
      });
    }
  }, [isOpen]);

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to log out?")) return;

    try {
      const { logout } = await import("@/utils/auth");
      await logout();
    } catch (error) {
      // Ignore RLS errors - we'll clear session anyway
      console.log("Logout error (ignoring):", error);
    }

    // Clear everything and reload regardless of database errors
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[95vw] md:max-w-[900px] h-[90vh] md:h-[650px] p-0 bg-[#313338] border-[#1e1f22] overflow-hidden"
        aria-describedby={undefined}
      >
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-[220px] bg-[#2b2d31] p-4 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="space-y-1">
                <div className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2 px-2">
                  User Settings
                </div>
                <button
                  onClick={() => setActiveTab("account")}
                  className={`w-full flex items-center justify-between px-2 py-2 rounded text-sm ${
                    activeTab === "account"
                      ? "bg-[#404249] text-white"
                      : "text-gray-300 hover:bg-[#35363c] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User size={18} />
                    My Account
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center justify-between px-2 py-2 rounded text-sm ${
                    activeTab === "profile"
                      ? "bg-[#404249] text-white"
                      : "text-gray-300 hover:bg-[#35363c] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User size={18} />
                    Profile
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("privacy")}
                  className={`w-full flex items-center justify-between px-2 py-2 rounded text-sm ${
                    activeTab === "privacy"
                      ? "bg-[#404249] text-white"
                      : "text-gray-300 hover:bg-[#35363c] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield size={18} />
                    Privacy & Safety
                  </div>
                </button>

                <Separator className="bg-[#1e1f22] my-2" />

                <div className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2 px-2">
                  App Settings
                </div>
                <button
                  onClick={() => setActiveTab("appearance")}
                  className={`w-full flex items-center justify-between px-2 py-2 rounded text-sm ${
                    activeTab === "appearance"
                      ? "bg-[#404249] text-white"
                      : "text-gray-300 hover:bg-[#35363c] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Palette size={18} />
                    Appearance
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("notifications")}
                  className={`w-full flex items-center justify-between px-2 py-2 rounded text-sm ${
                    activeTab === "notifications"
                      ? "bg-[#404249] text-white"
                      : "text-gray-300 hover:bg-[#35363c] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Bell size={18} />
                    Notifications
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("keybinds")}
                  className={`w-full flex items-center justify-between px-2 py-2 rounded text-sm ${
                    activeTab === "keybinds"
                      ? "bg-[#404249] text-white"
                      : "text-gray-300 hover:bg-[#35363c] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Keyboard size={18} />
                    Keybinds
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("language")}
                  className={`w-full flex items-center justify-between px-2 py-2 rounded text-sm ${
                    activeTab === "language"
                      ? "bg-[#404249] text-white"
                      : "text-gray-300 hover:bg-[#35363c] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Languages size={18} />
                    Language
                  </div>
                </button>
              </div>
            </ScrollArea>

            <div className="mt-auto pt-3 border-t border-[#1e1f22]">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-2 py-2 rounded text-sm text-red-400 hover:bg-[#35363c] hover:text-red-300 transition-all w-full"
              >
                <LogOut size={18} />
                Log Out
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="h-14 px-6 flex items-center justify-between border-b border-[#1e1f22]">
              <h2 className="text-white font-semibold">
                {activeTab === "account" && "My Account"}
                {activeTab === "profile" && "Profile"}
                {activeTab === "privacy" && "Privacy & Safety"}
                {activeTab === "appearance" && "Appearance"}
                {activeTab === "notifications" && "Notifications"}
                {activeTab === "keybinds" && "Keybinds"}
                {activeTab === "language" && "Language"}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 p-6">
              {activeTab === "account" && (
                <div className="max-w-[660px] space-y-6">
                  {/* Profile Card */}
                  <div className="bg-[#5865f2] rounded-lg p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative flex items-center gap-4">
                      <Avatar className="h-20 w-20 border-4 border-[#313338]">
                        <AvatarFallback className="bg-[#313338] text-white text-2xl">
                          {currentUser?.full_name
                            ? currentUser.full_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                            : userAvatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-white text-xl font-semibold">
                          {currentUser?.full_name || userName}
                        </div>
                        <div className="text-white/80 text-sm">
                          @
                          {currentUser?.username ||
                            userName.toLowerCase().replace(" ", "_")}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="ml-auto bg-[#4752c4] hover:bg-[#3c45a5] text-white"
                      >
                        Edit Profile
                      </Button>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2 block">
                        Username
                      </Label>
                      <div className="bg-[#1e1f22] rounded p-3 flex items-center justify-between">
                        <span className="text-white">
                          @
                          {currentUser?.username ||
                            userName.toLowerCase().replace(" ", "_")}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-[#35363c] h-8 px-3"
                        >
                          Edit
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2 block">
                        User ID
                      </Label>
                      <div className="bg-[#1e1f22] rounded p-3 flex items-center justify-between">
                        <span className="text-white font-mono text-sm">
                          {currentUser?.id || "Loading..."}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-[#35363c] h-8 px-3"
                          onClick={() => {
                            if (currentUser?.id) {
                              navigator.clipboard.writeText(currentUser.id);
                            }
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2 block">
                        Email
                      </Label>
                      <div className="bg-[#1e1f22] rounded p-3 flex items-center justify-between">
                        <span className="text-white">
                          {currentUser?.email ||
                            `${userName
                              .toLowerCase()
                              .replace(" ", ".")}@company.com`}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-[#35363c] h-8 px-3"
                        >
                          Edit
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2 block">
                        Custom Status
                      </Label>
                      <Input
                        value={customStatus}
                        onChange={(e) => setCustomStatus(e.target.value)}
                        className="bg-[#1e1f22] border-none text-white"
                        placeholder="Set a custom status"
                      />
                    </div>
                  </div>

                  <Separator className="bg-[#1e1f22]" />

                  {/* Password & Authentication */}
                  <div className="space-y-3">
                    <h3 className="text-white font-semibold">
                      Password and Authentication
                    </h3>
                    <Button
                      variant="outline"
                      className="w-full justify-between bg-[#1e1f22] border-none text-white hover:bg-[#35363c]"
                    >
                      Change Password
                      <ChevronRight size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-between bg-[#1e1f22] border-none text-white hover:bg-[#35363c]"
                    >
                      Enable Two-Factor Auth
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "profile" && (
                <div className="max-w-[660px] space-y-6">
                  <div>
                    <h3 className="text-white font-semibold mb-4">
                      Profile Settings
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <div className="text-white font-medium">
                            Display Activity
                          </div>
                          <div className="text-gray-400 text-sm">
                            Show what youMy Account re working on
                          </div>
                        </div>
                        <Switch
                          checked={showActivity}
                          onCheckedChange={setShowActivity}
                        />
                      </div>
                      <Separator className="bg-[#1e1f22]" />
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <div className="text-white font-medium">
                            Allow Direct Messages
                          </div>
                          <div className="text-gray-400 text-sm">
                            From workspace members
                          </div>
                        </div>
                        <Switch
                          checked={allowDMs}
                          onCheckedChange={setAllowDMs}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "privacy" && (
                <div className="max-w-[660px] space-y-6">
                  <div>
                    <h3 className="text-white font-semibold mb-2">
                      Privacy & Safety
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Manage who can add you as a friend, message you, and more.
                    </p>
                    <div className="space-y-4 bg-[#2b2d31] rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">
                            Allow friend requests
                          </div>
                          <div className="text-gray-400 text-sm">
                            From workspace members
                          </div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <Separator className="bg-[#1e1f22]" />
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">
                            Keep me safe
                          </div>
                          <div className="text-gray-400 text-sm">
                            Automatically scan messages
                          </div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "appearance" && (
                <div className="max-w-[660px] space-y-6">
                  <div>
                    <h3 className="text-white font-semibold mb-4">
                      Appearance
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-3 block">
                          Theme
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-[#1e1f22] rounded-lg p-4 border-2 border-[#5865f2] cursor-pointer">
                            <div className="bg-[#313338] rounded h-16 mb-2" />
                            <div className="text-white text-sm text-center">
                              Dark
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-4 border-2 border-transparent hover:border-gray-300 cursor-pointer">
                            <div className="bg-gray-100 rounded h-16 mb-2" />
                            <div className="text-gray-800 text-sm text-center">
                              Light
                            </div>
                          </div>
                        </div>
                      </div>
                      <Separator className="bg-[#1e1f22]" />
                      <div>
                        <Label className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-3 block">
                          Message Display
                        </Label>
                        <div className="space-y-2">
                          <div className="bg-[#1e1f22] rounded p-3 border-2 border-[#5865f2]">
                            <div className="text-white text-sm">Cozy</div>
                            <div className="text-gray-400 text-xs">
                              Modern, comfortable spacing
                            </div>
                          </div>
                          <div className="bg-[#1e1f22] rounded p-3 border-2 border-transparent hover:border-gray-600 cursor-pointer">
                            <div className="text-white text-sm">Compact</div>
                            <div className="text-gray-400 text-xs">
                              Fit more messages on screen
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="max-w-[660px] space-y-6">
                  <div>
                    <h3 className="text-white font-semibold mb-4">
                      Notification Settings
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <div className="text-white font-medium">
                            Enable Notifications
                          </div>
                          <div className="text-gray-400 text-sm">
                            Show desktop notifications
                          </div>
                        </div>
                        <Switch
                          checked={notifications}
                          onCheckedChange={setNotifications}
                        />
                      </div>
                      <Separator className="bg-[#1e1f22]" />
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <div className="text-white font-medium">
                            Notification Sounds
                          </div>
                          <div className="text-gray-400 text-sm">
                            Play sound for notifications
                          </div>
                        </div>
                        <Switch
                          checked={soundEnabled}
                          onCheckedChange={setSoundEnabled}
                        />
                      </div>
                      <Separator className="bg-[#1e1f22]" />
                      <div className="py-3">
                        <div className="text-white font-medium mb-2">
                          Push Notifications
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="push"
                              defaultChecked
                              className="text-[#5865f2]"
                            />
                            <div>
                              <div className="text-white text-sm">
                                All messages
                              </div>
                              <div className="text-gray-400 text-xs">
                                Get notified for every message
                              </div>
                            </div>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="push"
                              className="text-[#5865f2]"
                            />
                            <div>
                              <div className="text-white text-sm">
                                Only @mentions
                              </div>
                              <div className="text-gray-400 text-xs">
                                Only when someone mentions you
                              </div>
                            </div>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="push"
                              className="text-[#5865f2]"
                            />
                            <div>
                              <div className="text-white text-sm">Nothing</div>
                              <div className="text-gray-400 text-xs">
                                Mute all notifications
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "keybinds" && (
                <div className="max-w-[660px] space-y-6">
                  <div>
                    <h3 className="text-white font-semibold mb-4">Keybinds</h3>
                    <div className="space-y-3">
                      {[
                        { action: "Toggle Mute", keys: "Ctrl + Shift + M" },
                        { action: "Toggle Deafen", keys: "Ctrl + Shift + D" },
                        { action: "Search", keys: "Ctrl + K" },
                        { action: "Mark as Read", keys: "Shift + Esc" },
                        { action: "Create Server", keys: "Ctrl + Shift + N" },
                      ].map((keybind, idx) => (
                        <div
                          key={idx}
                          className="bg-[#2b2d31] rounded-lg p-3 flex items-center justify-between"
                        >
                          <span className="text-white">{keybind.action}</span>
                          <div className="flex gap-1">
                            {keybind.keys.split(" + ").map((key, i) => (
                              <span
                                key={i}
                                className="bg-[#1e1f22] px-2 py-1 rounded text-white text-sm font-mono"
                              >
                                {key}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "language" && (
                <div className="max-w-[660px] space-y-6">
                  <div>
                    <h3 className="text-white font-semibold mb-4">Language</h3>
                    <Label className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-3 block">
                      Select Language
                    </Label>
                    <select className="w-full bg-[#1e1f22] border-none text-white rounded p-3">
                      <option>English, US</option>
                      <option>English, UK</option>
                      <option>Español</option>
                      <option>Français</option>
                      <option>Deutsch</option>
                      <option>日本語</option>
                      <option>한국어</option>
                      <option>中文</option>
                    </select>
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            <div className="h-16 px-6 flex items-center justify-end gap-3 border-t border-[#1e1f22]">
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-white hover:bg-[#35363c]"
              >
                Cancel
              </Button>
              <Button className="bg-[#5865f2] hover:bg-[#4752c4] text-white">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
