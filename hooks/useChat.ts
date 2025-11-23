import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  is_edited: boolean;
  user?: {
    username: string;
    avatar_url: string;
    full_name: string;
  };
  attachments?: any[];
  reactions?: any;
}

export const useChat = (channelId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!channelId) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          user:users(username, avatar_url, full_name)
        `
        )
        .eq("channel_id", channelId)
        .order("created_at", { ascending: true });

      if (error) {
        toast.error("Failed to load messages");
        console.error(error);
      } else {
        setMessages(data || []);
      }
      setIsLoading(false);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          // Fetch the user details for the new message
          const { data: userData } = await supabase
            .from("users")
            .select("username, avatar_url, full_name")
            .eq("id", payload.new.user_id)
            .single();

          const newMessage = {
            ...payload.new,
            user: userData,
          } as ChatMessage;

          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  const sendMessage = async (content: string, userId: string) => {
    const { error } = await supabase.from("messages").insert({
      channel_id: channelId,
      user_id: userId,
      content,
    });

    if (error) {
      toast.error("Failed to send message");
      console.error(error);
      return false;
    }
    return true;
  };

  return { messages, isLoading, sendMessage };
};
