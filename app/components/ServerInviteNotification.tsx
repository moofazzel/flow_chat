"use client";

import { ServerInvite } from "@/hooks/useServerInvites";
import { Bell, WifiOff } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface ServerInviteNotificationProps {
  invites: ServerInvite[];
  inviteCount: number;
  isConnected: boolean;
  onClearInvite: (inviteId: string) => void;
  onClearAll: () => void;
}

export function ServerInviteNotification({
  invites,
  inviteCount,
  isConnected,
  onClearInvite,
  onClearAll,
}: ServerInviteNotificationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Notification Bell Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(true)}
          className={`relative p-2 text-[#b5bac1] hover:text-white hover:bg-[#404249] rounded-md transition-colors ${
            !isConnected ? "opacity-60" : ""
          }`}
          title={
            !isConnected
              ? "⚠️ Notifications disconnected - check realtime is enabled"
              : `${inviteCount} pending server invite${
                  inviteCount !== 1 ? "s" : ""
                }`
          }
        >
          <Bell size={20} />
          {inviteCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#ed4245] text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
              {inviteCount > 9 ? "9+" : inviteCount}
            </span>
          )}
          {!isConnected && (
            <span className="absolute -bottom-1 -right-1 bg-[#faa61a] rounded-full p-0.5">
              <WifiOff size={10} className="text-white" />
            </span>
          )}
        </button>

        {/* Connection Status Warning */}
        {!isConnected && (
          <div className="absolute top-12 right-0 bg-[#faa61a] text-white text-xs px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap animate-pulse z-10">
            Realtime Disconnected
          </div>
        )}
      </div>

      {/* Invites Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[500px] bg-[#313338] border-none text-white p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 bg-linear-to-b from-[#313338] to-[#2b2d31]">
            <DialogTitle className="text-white text-2xl flex items-center gap-2">
              <Bell className="text-[#5865f2]" size={24} />
              Server Invitations ({inviteCount})
              {!isConnected && (
                <span className="ml-auto flex items-center gap-1 text-xs bg-[#faa61a] px-2 py-1 rounded-md">
                  <WifiOff size={12} />
                  Offline
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="text-[#b5bac1] text-[15px] mt-2">
              {inviteCount === 0
                ? "You have no pending server invitations"
                : "You&apos;ve been invited to join these servers"}
            </DialogDescription>
            {!isConnected && (
              <div className="mt-2 bg-[#faa61a]/10 border border-[#faa61a] rounded-md p-3 text-[#faa61a] text-sm">
                <p className="font-semibold">
                  ⚠️ Realtime notifications are disconnected
                </p>
                <p className="text-xs mt-1">
                  Enable realtime for &quot;server_members&quot; table in
                  Supabase Dashboard
                </p>
              </div>
            )}
          </DialogHeader>

          <div className="px-6 py-5 max-h-[400px] overflow-y-auto">
            {inviteCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#6d6f78]">
                <Bell size={48} className="mb-3 opacity-50" />
                <p className="text-[#b5bac1]">No pending invitations</p>
                <p className="text-[#80848e] text-sm mt-1">
                  You&apos;ll see notifications here when invited to servers
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="bg-[#2b2d31] rounded-lg p-4 border border-[#1e1f22] hover:bg-[#32353b] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-base">
                          {invite.server_name}
                        </h4>
                        <p className="text-[#b5bac1] text-sm mt-1">
                          Invited by {invite.invited_by_name}
                        </p>
                        <p className="text-[#80848e] text-xs mt-2">
                          Role:{" "}
                          <span className="text-[#5865f2] capitalize">
                            {invite.role}
                          </span>
                        </p>
                        <p className="text-[#80848e] text-xs">
                          {new Date(invite.joined_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => onClearInvite(invite.id)}
                        variant="ghost"
                        size="sm"
                        className="text-[#b5bac1] hover:text-white hover:bg-[#404249] ml-2"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {inviteCount > 0 && (
            <div className="px-6 py-4 bg-[#2b2d31] border-t border-[#1e1f22] flex justify-between">
              <Button
                onClick={onClearAll}
                variant="ghost"
                className="text-[#ed4245] hover:text-white hover:bg-[#ed4245]"
              >
                Clear All
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                className="bg-[#5865f2] hover:bg-[#4752c4]"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
