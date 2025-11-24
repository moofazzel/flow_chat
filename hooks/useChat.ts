import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: Array<{ id: string; username: string }>;
  hasReacted?: boolean;
}

export interface MessageMention {
  id: string;
  message_id: string;
  mentioned_user_id: string;
  created_at: string;
}

export interface MessageTaskLink {
  id: string;
  message_id: string;
  card_id: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  author_id: string;
  content: string;
  created_at: string;
  is_edited: boolean;
  is_pinned?: boolean;
  reply_to_id?: string;
  edited_at?: string;
  author?: {
    username: string;
    avatar_url: string;
    full_name: string;
  };
  attachments?: MessageAttachment[];
  reactions?: Record<string, MessageReaction>;
  mentions?: MessageMention[];
  task_links?: MessageTaskLink[];
  reply_to?: ChatMessage;
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

      // Fetch messages with all related data
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          author:users!author_id(username, avatar_url, full_name),
          reply_to:messages!reply_to_id(id, content, author:users!author_id(username))
        `
        )
        .eq("channel_id", channelId)
        .order("created_at", { ascending: true });

      if (error) {
        toast.error("Failed to load messages");
        console.error(error);
        setIsLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setMessages([]);
        setIsLoading(false);
        return;
      }

      // Fetch attachments for all messages
      const messageIds = data.map((msg) => msg.id);
      const { data: attachmentsData } = await supabase
        .from("message_attachments")
        .select("*")
        .in("message_id", messageIds);

      // Fetch reactions for all messages
      const { data: reactionsData } = await supabase
        .from("reactions")
        .select("*, user:users!user_id(id, username)")
        .in("message_id", messageIds);

      // Fetch mentions for all messages
      const { data: mentionsData } = await supabase
        .from("message_mentions")
        .select("*")
        .in("message_id", messageIds);

      // Fetch task links for all messages
      const { data: taskLinksData } = await supabase
        .from("message_task_links")
        .select("*")
        .in("message_id", messageIds);

      // Group reactions by message and emoji
      const reactionsByMessage: Record<
        string,
        Record<string, MessageReaction>
      > = {};
      reactionsData?.forEach(
        (reaction: {
          message_id: string;
          emoji: string;
          user: { id: string; username: string };
        }) => {
          if (!reactionsByMessage[reaction.message_id]) {
            reactionsByMessage[reaction.message_id] = {};
          }
          if (!reactionsByMessage[reaction.message_id][reaction.emoji]) {
            reactionsByMessage[reaction.message_id][reaction.emoji] = {
              emoji: reaction.emoji,
              count: 0,
              users: [],
            };
          }
          reactionsByMessage[reaction.message_id][reaction.emoji].count++;
          reactionsByMessage[reaction.message_id][reaction.emoji].users.push(
            reaction.user
          );
        }
      );

      // Combine all data
      const messagesWithRelations = data.map((msg) => ({
        ...msg,
        attachments:
          attachmentsData?.filter((a) => a.message_id === msg.id) || [],
        reactions: reactionsByMessage[msg.id] || {},
        mentions: mentionsData?.filter((m) => m.message_id === msg.id) || [],
        task_links: taskLinksData?.filter((t) => t.message_id === msg.id) || [],
      })) as ChatMessage[];

      setMessages(messagesWithRelations);
      setIsLoading(false);
    };

    fetchMessages();

    // Helper function to fetch a single message with all relations
    const fetchMessageWithRelations = async (messageId: string) => {
      const { data: msgData } = await supabase
        .from("messages")
        .select(
          `
          *,
          author:users!author_id(username, avatar_url, full_name),
          reply_to:messages!reply_to_id(id, content, author:users!author_id(username))
        `
        )
        .eq("id", messageId)
        .single();

      if (!msgData) return null;

      // Fetch related data
      const { data: attachmentsData } = await supabase
        .from("message_attachments")
        .select("*")
        .eq("message_id", messageId);

      const { data: reactionsData } = await supabase
        .from("reactions")
        .select("*, user:users!user_id(id, username)")
        .eq("message_id", messageId);

      const { data: mentionsData } = await supabase
        .from("message_mentions")
        .select("*")
        .eq("message_id", messageId);

      const { data: taskLinksData } = await supabase
        .from("message_task_links")
        .select("*")
        .eq("message_id", messageId);

      // Group reactions
      const reactions: Record<string, MessageReaction> = {};
      reactionsData?.forEach(
        (reaction: {
          message_id: string;
          emoji: string;
          user: { id: string; username: string };
        }) => {
          if (!reactions[reaction.emoji]) {
            reactions[reaction.emoji] = {
              emoji: reaction.emoji,
              count: 0,
              users: [],
            };
          }
          reactions[reaction.emoji].count++;
          reactions[reaction.emoji].users.push(reaction.user);
        }
      );

      return {
        ...msgData,
        attachments: attachmentsData || [],
        reactions,
        mentions: mentionsData || [],
        task_links: taskLinksData || [],
      } as ChatMessage;
    };

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
          // Fetch the complete message with all relations
          const newMessage = await fetchMessageWithRelations(payload.new.id);
          if (newMessage) {
            setMessages((prev) => [...prev, newMessage]);
          }
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
          // Handle message edits - refetch with all relations
          const updatedMessage = await fetchMessageWithRelations(
            payload.new.id
          );
          if (updatedMessage) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === updatedMessage.id ? updatedMessage : msg
              )
            );
          }
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
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reactions",
        },
        async (payload) => {
          // Refetch the message to update reactions
          const updatedMessage = await fetchMessageWithRelations(
            payload.new.message_id
          );
          if (updatedMessage) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === updatedMessage.id ? updatedMessage : msg
              )
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "reactions",
        },
        async (payload) => {
          // Refetch the message to update reactions
          const updatedMessage = await fetchMessageWithRelations(
            payload.old.message_id
          );
          if (updatedMessage) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === updatedMessage.id ? updatedMessage : msg
              )
            );
          }
        }
      )
      .on(
        "broadcast",
        { event: "typing" },
        (payload: { payload: { user: string; isTyping: boolean } }) => {
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
        }
      )
      .subscribe();

    return () => {
      // Clear all typing timeouts
      Object.values(typingTimeoutRef).forEach(clearTimeout);
      supabase.removeChannel(channel);
    };
  }, [channelId, typingTimeoutRef, supabase]);

  const sendMessage = async (
    content: string,
    userId: string,
    options?: {
      attachments?: File[];
      replyToId?: string;
      mentionedUserIds?: string[];
      taskIds?: string[];
    }
  ) => {
    // Insert the message first
    const { data: messageData, error: messageError } = await supabase
      .from("messages")
      .insert({
        channel_id: channelId,
        author_id: userId,
        content,
        reply_to_id: options?.replyToId,
      })
      .select()
      .single();

    if (messageError || !messageData) {
      toast.error("Failed to send message");
      console.error(messageError);
      return false;
    }

    const messageId = messageData.id;

    // Handle attachments if any
    if (options?.attachments && options.attachments.length > 0) {
      for (const file of options.attachments) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${messageId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("message-attachments")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Failed to upload attachment:", uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("message-attachments")
          .getPublicUrl(fileName);

        await supabase.from("message_attachments").insert({
          message_id: messageId,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: fileExt || "unknown",
          file_size: file.size,
          mime_type: file.type,
        });
      }
    }

    // Handle mentions
    if (options?.mentionedUserIds && options.mentionedUserIds.length > 0) {
      const mentions = options.mentionedUserIds.map((userId) => ({
        message_id: messageId,
        mentioned_user_id: userId,
      }));
      await supabase.from("message_mentions").insert(mentions);
    }

    // Handle task links
    if (options?.taskIds && options.taskIds.length > 0) {
      const taskLinks = options.taskIds.map((cardId) => ({
        message_id: messageId,
        card_id: cardId,
      }));
      await supabase.from("message_task_links").insert(taskLinks);
    }

    return true;
  };

  const editMessage = async (messageId: string, newContent: string) => {
    const { error } = await supabase
      .from("messages")
      .update({
        content: newContent,
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
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

  // Reactions
  const addReaction = async (
    messageId: string,
    user: { id: string; username: string },
    emoji: string
  ) => {
    // Optimistic update
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const reactions = { ...msg.reactions };
          if (!reactions[emoji]) {
            reactions[emoji] = {
              emoji,
              count: 0,
              users: [],
            };
          }
          // Check if user already reacted (to prevent duplicates in UI)
          if (!reactions[emoji].users.some((u) => u.id === user.id)) {
            reactions[emoji] = {
              ...reactions[emoji],
              count: reactions[emoji].count + 1,
              users: [...reactions[emoji].users, user],
            };
          }
          return { ...msg, reactions };
        }
        return msg;
      })
    );

    const { error } = await supabase.from("reactions").insert({
      message_id: messageId,
      user_id: user.id,
      emoji,
    });

    if (error) {
      // Revert optimistic update on error
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            const reactions = { ...msg.reactions };
            if (reactions[emoji]) {
              reactions[emoji] = {
                ...reactions[emoji],
                count: Math.max(0, reactions[emoji].count - 1),
                users: reactions[emoji].users.filter((u) => u.id !== user.id),
              };
              if (reactions[emoji].count === 0) {
                delete reactions[emoji];
              }
            }
            return { ...msg, reactions };
          }
          return msg;
        })
      );

      // If unique constraint violation, user already reacted with this emoji
      if (error.code === "23505") {
        toast.error("You already reacted with this emoji");
      } else {
        toast.error("Failed to add reaction");
        console.error(error);
      }
      return false;
    }
    return true;
  };

  const removeReaction = async (
    messageId: string,
    user: { id: string; username: string },
    emoji: string
  ) => {
    // Optimistic update
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const reactions = { ...msg.reactions };
          if (reactions[emoji]) {
            reactions[emoji] = {
              ...reactions[emoji],
              count: Math.max(0, reactions[emoji].count - 1),
              users: reactions[emoji].users.filter((u) => u.id !== user.id),
            };
            if (reactions[emoji].count === 0) {
              delete reactions[emoji];
            }
          }
          return { ...msg, reactions };
        }
        return msg;
      })
    );

    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", user.id)
      .eq("emoji", emoji);

    if (error) {
      // Revert optimistic update on error
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            const reactions = { ...msg.reactions };
            if (!reactions[emoji]) {
              reactions[emoji] = {
                emoji,
                count: 0,
                users: [],
              };
            }
            reactions[emoji] = {
              ...reactions[emoji],
              count: reactions[emoji].count + 1,
              users: [...reactions[emoji].users, user],
            };
            return { ...msg, reactions };
          }
          return msg;
        })
      );

      toast.error("Failed to remove reaction");
      console.error(error);
      return false;
    }
    return true;
  };

  // Pin/Unpin messages
  const pinMessage = async (messageId: string) => {
    const { error } = await supabase
      .from("messages")
      .update({ is_pinned: true })
      .eq("id", messageId);

    if (error) {
      toast.error("Failed to pin message");
      console.error(error);
      return false;
    }
    toast.success("Message pinned");
    return true;
  };

  const unpinMessage = async (messageId: string) => {
    const { error } = await supabase
      .from("messages")
      .update({ is_pinned: false })
      .eq("id", messageId);

    if (error) {
      toast.error("Failed to unpin message");
      console.error(error);
      return false;
    }
    toast.success("Message unpinned");
    return true;
  };

  // Search messages
  const searchMessages = async (query: string) => {
    const { data, error } = await supabase.rpc("search_messages", {
      channel_id_param: channelId,
      search_query: query,
      limit_param: 50,
    });

    if (error) {
      toast.error("Search failed");
      console.error(error);
      return [];
    }
    return data as ChatMessage[];
  };

  // Upload attachment
  const uploadAttachment = async (file: File, messageId: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${messageId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("message-attachments")
      .upload(fileName, file);

    if (uploadError) {
      toast.error("Failed to upload file");
      console.error(uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("message-attachments")
      .getPublicUrl(fileName);

    const { data: attachmentData, error: attachmentError } = await supabase
      .from("message_attachments")
      .insert({
        message_id: messageId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: fileExt || "unknown",
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (attachmentError) {
      toast.error("Failed to save attachment");
      console.error(attachmentError);
      return null;
    }

    toast.success("File uploaded");
    return attachmentData as MessageAttachment;
  };

  return {
    messages,
    isLoading,
    sendMessage,
    editMessage,
    deleteMessage,
    broadcastTyping,
    typingUsers,
    addReaction,
    removeReaction,
    pinMessage,
    unpinMessage,
    searchMessages,
    uploadAttachment,
  };
};
