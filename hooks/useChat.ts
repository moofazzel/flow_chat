import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  channel_id: string;
  author_id: string;
  content: string;
  created_at: string;
  is_edited: boolean;
  author?: {
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
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const supabase = createClient();
  const typingTimeoutRef = useState<Record<string, NodeJS.Timeout>>({})[0];

  useEffect(() => {
    if (!channelId) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          author:users!author_id(username, avatar_url, full_name)
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

    // Subscribe to new messages and typing indicators
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
            .eq("id", payload.new.author_id)
            .single();

          const newMessage = {
            ...payload.new,
            author: userData,
          } as ChatMessage;

          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          // Handle message edits
          const { data: userData } = await supabase
            .from("users")
            .select("username, avatar_url, full_name")
            .eq("id", payload.new.author_id)
            .single();

          const updatedMessage = {
            ...payload.new,
            author: userData,
          } as ChatMessage;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== payload.old.id)
          );
        }
      )
      .on("broadcast", { event: "typing" }, (payload: any) => {
        const { user, isTyping } = payload.payload;
        if (isTyping) {
          setTypingUsers((prev) => {
            if (!prev.includes(user)) {
              return [...prev, user];
            }
            return prev;
          });

          // Clear existing timeout for this user
          if (typingTimeoutRef[user]) {
            clearTimeout(typingTimeoutRef[user]);
          }

          // Set new timeout to remove user after 3 seconds of inactivity
          typingTimeoutRef[user] = setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u !== user));
            delete typingTimeoutRef[user];
          }, 3000);
        } else {
          setTypingUsers((prev) => prev.filter((u) => u !== user));
          if (typingTimeoutRef[user]) {
            clearTimeout(typingTimeoutRef[user]);
            delete typingTimeoutRef[user];
          }
        }
      })
      .subscribe();

    return () => {
      // Clear all typing timeouts
      Object.values(typingTimeoutRef).forEach(clearTimeout);
      supabase.removeChannel(channel);
    };
  }, [channelId, typingTimeoutRef]);

  const sendMessage = async (content: string, userId: string) => {
    const { error } = await supabase.from("messages").insert({
      channel_id: channelId,
      author_id: userId,
      content,
    });

    if (error) {
      toast.error("Failed to send message");
      console.error(error);
      return false;
    }
    return true;
  };

  const editMessage = async (messageId: string, newContent: string) => {
    const { error } = await supabase
      .from("messages")
      .update({ content: newContent, is_edited: true })
      .eq("id", messageId);

    if (error) {
      toast.error("Failed to edit message");
      console.error(error);
      return false;
    }
    toast.success("Message edited");
    return true;
  };

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId);

    if (error) {
      toast.error("Failed to delete message");
      console.error(error);
      return false;
    }
    toast.success("Message deleted");
    return true;
  };

  const broadcastTyping = async (username: string, isTyping: boolean) => {
    const channel = supabase.channel(`chat:${channelId}`);
    await channel.send({
      type: "broadcast",
      event: "typing",
      payload: { user: username, isTyping },
    });
  };

  return {
    messages,
    isLoading,
    sendMessage,
    editMessage,
    deleteMessage,
    broadcastTyping,
    typingUsers,
  };
};
