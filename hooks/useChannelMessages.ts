"use client";

import {
  ChannelMessage,
  getChannelMessages,
  sendChannelMessage,
  subscribeToChannel,
} from "@/lib/channelMessageService";
import { useCallback, useEffect, useState } from "react";

export function useChannelMessages(
  channelId: string | null,
  userId: string | null
) {
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // Load initial messages
    getChannelMessages(channelId).then((data) => {
      setMessages(data);
      setLoading(false);
    });

    // Subscribe to realtime updates
    const channel = subscribeToChannel(
      channelId,
      (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
      },
      (updatedMessage) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
        );
      },
      (deletedId) => {
        setMessages((prev) => prev.filter((m) => m.id !== deletedId));
      }
    );

    return () => {
      channel.unsubscribe();
    };
  }, [channelId]);

  const sendMessage = useCallback(
    async (
      content: string,
      options?: { replyToId?: string; mentions?: string[] }
    ) => {
      if (!channelId || !userId)
        return { success: false, error: "Not authenticated" };
      return await sendChannelMessage(channelId, userId, content, options);
    },
    [channelId, userId]
  );

  return { messages, loading, sendMessage };
}
