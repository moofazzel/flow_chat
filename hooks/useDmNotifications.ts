import { createClient } from "@/utils/supabase/client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export interface DmNotification {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

/**
 * Subscribe to real-time DM message notifications
 * Shows toast notifications when user receives new DM messages
 */
export function useDmNotifications(
  userId: string | null,
  currentThreadId: string | null
) {
  const [notifications, setNotifications] = useState<DmNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) {
      console.log("⚠️ useDmNotifications: No userId provided");
      return;
    }

    console.log(
      "🔌 useDmNotifications: Setting up subscription for user:",
      userId
    );

    // Subscribe to dm_messages table for new messages
    const channel = supabase
      .channel(`dm-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dm_messages",
        },
        async (payload) => {
          console.log("✅ New DM message received:", payload);

          // Don't show notification for own messages
          if (payload.new.sender_id === userId) {
            console.log("📤 Message from self, skipping notification");
            return;
          }

          // Don't show notification if currently viewing this thread
          if (payload.new.thread_id === currentThreadId) {
            console.log(
              "👁️ Currently viewing this thread, skipping notification"
            );
            return;
          }

          // Fetch sender details
          const { data: sender, error: senderError } = await supabase
            .from("users")
            .select("full_name, username")
            .eq("id", payload.new.sender_id)
            .single();

          if (senderError) {
            console.error("❌ Error fetching sender:", senderError);
          }

          const notification: DmNotification = {
            id: payload.new.id,
            thread_id: payload.new.thread_id,
            sender_id: payload.new.sender_id,
            sender_name: sender?.full_name || sender?.username || "Someone",
            content: payload.new.content,
            created_at: payload.new.created_at,
          };

          console.log("📨 Adding DM notification to state:", notification);
          setNotifications((prev) => [...prev, notification]);
          setUnreadCount((prev) => prev + 1);

          // Show toast notification
          toast.info(`New message from ${notification.sender_name}`, {
            description:
              notification.content.length > 50
                ? `${notification.content.substring(0, 50)}...`
                : notification.content,
            duration: 4000,
          });
        }
      )
      .subscribe((status) => {
        console.log("📡 DM notifications subscription status:", status);
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          console.log("✅ Successfully subscribed to DM notifications");
        } else if (status === "CHANNEL_ERROR") {
          setIsConnected(false);
          console.error(
            "❌ Channel error - check if realtime is enabled for dm_messages table"
          );
        } else if (status === "TIMED_OUT") {
          setIsConnected(false);
          console.error("⏱️ DM notifications subscription timed out");
        } else {
          setIsConnected(false);
        }
      });

    return () => {
      console.log("🔌 useDmNotifications: Unsubscribing");
      channel.unsubscribe();
    };
  }, [userId, currentThreadId, supabase]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    clearNotifications,
    removeNotification,
  };
}
