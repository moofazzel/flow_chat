import { createClient } from "@/utils/supabase/client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export interface ServerInvite {
  id: string;
  server_id: string;
  server_name: string;
  invited_by: string;
  invited_by_name: string;
  role: "owner" | "admin" | "moderator" | "member";
  joined_at: string;
}

/**
 * Subscribe to real-time server invitations for the current user
 * Shows toast notifications when user is invited to a server
 */
export function useServerInvites(userId: string | null) {
  const [newInvites, setNewInvites] = useState<ServerInvite[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) {
      console.log("⚠️ useServerInvites: No userId provided");
      return;
    }

    console.log(
      "🔌 useServerInvites: Setting up subscription for user:",
      userId
    );

    // Subscribe to server_members table for INSERT events where user_id matches
    const channel = supabase
      .channel(`server-invites-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "server_members",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log("✅ New server invite received:", payload);

          // Fetch server details
          const { data: server, error: serverError } = await supabase
            .from("servers")
            .select("name, owner_id")
            .eq("id", payload.new.server_id)
            .single();

          if (serverError) {
            console.error("❌ Error fetching server:", serverError);
          }

          // Fetch inviter details (usually the server owner or admin who invited)
          const { data: inviter, error: inviterError } = await supabase
            .from("users")
            .select("username, full_name")
            .eq("id", server?.owner_id || payload.new.user_id)
            .single();

          if (inviterError) {
            console.error("❌ Error fetching inviter:", inviterError);
          }

          const invite: ServerInvite = {
            id: payload.new.id,
            server_id: payload.new.server_id,
            server_name: server?.name || "Unknown Server",
            invited_by: server?.owner_id || "",
            invited_by_name:
              inviter?.username || inviter?.full_name || "Someone",
            role: payload.new.role,
            joined_at: payload.new.joined_at,
          };

          console.log("📨 Adding invite to state:", invite);
          setNewInvites((prev) => [...prev, invite]);

          // Show toast notification
          toast.success(`You've been invited to ${invite.server_name}!`, {
            description: `Invited by ${invite.invited_by_name}`,
            duration: 5000,
          });
        }
      )
      .subscribe((status) => {
        console.log("📡 Subscription status:", status);
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          console.log("✅ Successfully subscribed to server invites");
        } else if (status === "CHANNEL_ERROR") {
          setIsConnected(false);
          console.error("❌ Channel error - check if realtime is enabled");
          toast.error("Failed to connect to notifications", {
            description: "Server invites may not update in real-time",
          });
        } else if (status === "TIMED_OUT") {
          setIsConnected(false);
          console.error("⏱️ Subscription timed out");
        } else {
          setIsConnected(false);
        }
      });

    return () => {
      console.log("🔌 useServerInvites: Unsubscribing");
      channel.unsubscribe();
    };
  }, [userId, supabase]);

  const clearInvites = useCallback(() => {
    setNewInvites([]);
  }, []);

  const removeInvite = useCallback((inviteId: string) => {
    setNewInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
  }, []);

  return {
    newInvites,
    inviteCount: newInvites.length,
    isConnected,
    clearInvites,
    removeInvite,
  };
}
