import { createClient } from "@/utils/supabase/client";
import { useCallback, useEffect, useState } from "react";

export interface ChannelUnreadState {
  [channelId: string]: number;
}

export function useServerNotifications(
  userId: string | null,
  activeChannelId: string | null = null
) {
  const [unreadCounts, setUnreadCounts] = useState<ChannelUnreadState>({});
  const [serverUnreadCounts, setServerUnreadCounts] = useState<
    Record<string, number>
  >({});
  const [channelToServerMap, setChannelToServerMap] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Fetch initial unread counts
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchUnreadCounts = async () => {
      try {
        // 1. Get all channels the user has access to (via server members)
        const { data: userServers } = await supabase
          .from("server_members")
          .select("server_id")
          .eq("user_id", userId);

        if (!userServers || userServers.length === 0) {
          setLoading(false);
          return;
        }

        const serverIds = userServers.map((s) => s.server_id);

        const { data: channels } = await supabase
          .from("channels")
          .select("id, server_id, last_message_at")
          .in("server_id", serverIds);

        if (!channels) {
          setLoading(false);
          return;
        }

        // Build map for aggregation
        const chMap: Record<string, string> = {};
        channels.forEach((c) => {
          chMap[c.id] = c.server_id;
        });
        setChannelToServerMap(chMap);

        // 2. Get user's read states
        const { data: readStates } = await supabase
          .from("channel_read_states")
          .select("channel_id, last_read_at")
          .eq("user_id", userId);

        const readStateMap = new Map(
          readStates?.map((s) => [s.channel_id, s.last_read_at]) || []
        );

        // 3. Calculate unread counts
        const newUnreadCounts: ChannelUnreadState = {};

        const countPromises = channels.map(async (channel) => {
          const lastRead =
            readStateMap.get(channel.id) || "1970-01-01T00:00:00Z";

          // If last message is newer than last read (or never read)
          if (new Date(channel.last_message_at) > new Date(lastRead)) {
            const { count } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("channel_id", channel.id)
              .gt("created_at", lastRead);

            if (count && count > 0) {
              newUnreadCounts[channel.id] = count;
            }
          }
        });

        await Promise.all(countPromises);
        setUnreadCounts(newUnreadCounts);
      } catch (error) {
        console.error("Failed to fetch unread counts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadCounts();
  }, [userId]);

  // Calculate server counts whenever unreadCounts changes
  useEffect(() => {
    const sCounts: Record<string, number> = {};
    Object.entries(unreadCounts).forEach(([channelId, count]) => {
      const serverId = channelToServerMap[channelId];
      if (serverId) {
        sCounts[serverId] = (sCounts[serverId] || 0) + count;
      }
    });
    setServerUnreadCounts(sCounts);
  }, [unreadCounts, channelToServerMap]);

  const markAsRead = useCallback(
    async (channelId: string) => {
      if (!userId) return;

      // Optimistic update
      setUnreadCounts((prev) => {
        const newCounts = { ...prev };
        delete newCounts[channelId];
        return newCounts;
      });

      try {
        const { error } = await supabase.rpc("mark_channel_read", {
          p_channel_id: channelId,
          p_user_id: userId,
        });

        if (error) throw error;
      } catch (error) {
        console.error("Failed to mark channel as read:", error);
      }
    },
    [userId]
  ); // Removed supabase dependency as it's stable

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) return;

    // Listen for new messages
    const messageChannel = supabase
      .channel("global-messages-notification")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new;
          // Don't count own messages
          if (newMessage.author_id === userId) return;

          // If we are currently in this channel, don't increment count and mark as read
          if (newMessage.channel_id === activeChannelId) {
            markAsRead(newMessage.channel_id);
            return;
          }

          setUnreadCounts((prev) => ({
            ...prev,
            [newMessage.channel_id]: (prev[newMessage.channel_id] || 0) + 1,
          }));
        }
      )
      .subscribe();

    // Listen for read state updates
    const readStateChannel = supabase
      .channel(`read-states-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "channel_read_states",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            const { channel_id } = payload.new;
            // Reset count for this channel
            setUnreadCounts((prev) => {
              const newCounts = { ...prev };
              delete newCounts[channel_id];
              return newCounts;
            });
          }
        }
      )
      .subscribe();

    return () => {
      messageChannel.unsubscribe();
      readStateChannel.unsubscribe();
    };
  }, [userId, activeChannelId, markAsRead]);

  return {
    unreadCounts,
    serverUnreadCounts,
    loading,
    markAsRead,
  };
}
