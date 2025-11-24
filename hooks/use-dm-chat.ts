"use client";

import { updateDmReaction } from "@/lib/friendService";
import { createClient } from "@/utils/supabase/client";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseDmChatProps {
  threadId: string;
  currentUserId: string;
  currentUserName: string;
}

export interface ReactionUser {
  userId: string;
  userName: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: ReactionUser[];
}

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: string;
  replyToId?: string;
  reactions?: Reaction[];
  isEdited?: boolean;
}

const EVENT_MESSAGE_TYPE = "dm_message";
const EVENT_TYPING = "typing";
const EVENT_REACTION = "reaction";
const EVENT_EDIT = "edit";
const EVENT_DELETE = "delete";

export function useDmChat({
  threadId,
  currentUserId,
  currentUserName,
}: UseDmChatProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [channelRef] = useState<{
    current: ReturnType<typeof supabase.channel> | null;
  }>({ current: null });
  const [isConnected, setIsConnected] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  useEffect(() => {
    if (!threadId) return;

    const newChannel = supabase.channel(`dm:${threadId}`);

    newChannel
      .on("broadcast", { event: EVENT_MESSAGE_TYPE }, (payload) => {
        const newMsg = payload.payload as ChatMessage;
        setMessages((current) => {
          // Deduplicate - check if message already exists
          const exists = current.find((m) => m.id === newMsg.id);
          if (exists) return current;
          return [...current, newMsg];
        });
        // Clear typing indicator when message arrives
        setOtherUserTyping(null);
      })
      .on("broadcast", { event: EVENT_TYPING }, (payload) => {
        const { userId, userName, isTyping } = payload.payload as {
          userId: string;
          userName: string;
          isTyping: boolean;
        };

        // Only show typing for other users
        if (userId !== currentUserId) {
          setOtherUserTyping(isTyping ? userName : null);
        }
      })
      .on("broadcast", { event: EVENT_REACTION }, (payload) => {
        const { messageId, emoji, user } = payload.payload as {
          messageId: string;
          emoji: string;
          user: ReactionUser;
        };

        // Helper to update reactions
        const updateReactions = (currentReactions: Reaction[] = []) => {
          const existing = currentReactions.find((r) => r.emoji === emoji);

          if (existing) {
            const hasUser = existing.users.some(
              (u) => u.userId === user.userId
            );
            const newUsers = hasUser
              ? existing.users.filter((u) => u.userId !== user.userId)
              : [...existing.users, user];

            if (newUsers.length === 0) {
              return currentReactions.filter((r) => r.emoji !== emoji);
            }

            return currentReactions.map((r) =>
              r.emoji === emoji
                ? { ...r, users: newUsers, count: newUsers.length }
                : r
            );
          }

          return [...currentReactions, { emoji, count: 1, users: [user] }];
        };

        // Update local messages state
        setMessages((current) =>
          current.map((m) => {
            if (m.id !== messageId) return m;
            return { ...m, reactions: updateReactions(m.reactions) };
          })
        );
      })
      .on("broadcast", { event: EVENT_EDIT }, (payload) => {
        const { messageId, content } = payload.payload as {
          messageId: string;
          content: string;
        };

        setMessages((current) =>
          current.map((m) =>
            m.id === messageId ? { ...m, content, isEdited: true } : m
          )
        );
      })
      .on("broadcast", { event: EVENT_DELETE }, (payload) => {
        const { messageId } = payload.payload as { messageId: string };

        setMessages((current) => current.filter((m) => m.id !== messageId));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      });

    channelRef.current = newChannel;

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      supabase.removeChannel(newChannel);
    };
  }, [threadId, currentUserId, supabase]);

  const sendMessage = useCallback(
    async (
      content: string,
      replyToId?: string
    ): Promise<ChatMessage | null> => {
      if (!channelRef.current || !isConnected) return null;

      const message: ChatMessage = {
        id: crypto.randomUUID(),
        content,
        senderId: currentUserId,
        senderName: currentUserName,
        createdAt: new Date().toISOString(),
        replyToId,
      };

      // Update local state immediately for the sender (optimistic)
      setMessages((current) => [...current, message]);

      // Broadcast to other users
      await channelRef.current.send({
        type: "broadcast",
        event: EVENT_MESSAGE_TYPE,
        payload: message,
      });

      return message;
    },
    [isConnected, currentUserId, currentUserName]
  );

  const sendReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!channelRef.current || !isConnected) return;

      const user: ReactionUser = {
        userId: currentUserId,
        userName: currentUserName,
      };

      // Determine if we're adding or removing the reaction
      let isAdding = true;

      // Optimistic update for local messages
      setMessages((current) =>
        current.map((m) => {
          if (m.id !== messageId) return m;
          const reactions = m.reactions || [];
          const existing = reactions.find((r) => r.emoji === emoji);

          if (existing) {
            const hasUser = existing.users.some(
              (u) => u.userId === user.userId
            );
            isAdding = !hasUser;
            const newUsers = hasUser
              ? existing.users.filter((u) => u.userId !== user.userId)
              : [...existing.users, user];

            if (newUsers.length === 0) {
              return {
                ...m,
                reactions: reactions.filter((r) => r.emoji !== emoji),
              };
            }

            return {
              ...m,
              reactions: reactions.map((r) =>
                r.emoji === emoji
                  ? { ...r, users: newUsers, count: newUsers.length }
                  : r
              ),
            };
          }
          return {
            ...m,
            reactions: [...reactions, { emoji, count: 1, users: [user] }],
          };
        })
      );

      // Persist to database
      try {
        await updateDmReaction(
          messageId,
          emoji,
          currentUserId,
          currentUserName,
          isAdding
        );
      } catch (error) {
        console.error("Failed to persist reaction:", error);
      }

      // Broadcast to other users
      await channelRef.current.send({
        type: "broadcast",
        event: EVENT_REACTION,
        payload: {
          messageId,
          emoji,
          user,
        },
      });
    },
    [isConnected, currentUserId, currentUserName]
  );

  const editMessage = useCallback(
    async (messageId: string, content: string) => {
      if (!channelRef.current || !isConnected) return;

      setMessages((current) =>
        current.map((m) =>
          m.id === messageId ? { ...m, content, isEdited: true } : m
        )
      );

      await channelRef.current.send({
        type: "broadcast",
        event: EVENT_EDIT,
        payload: { messageId, content },
      });
    },
    [isConnected]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!channelRef.current || !isConnected) return;

      setMessages((current) => current.filter((m) => m.id !== messageId));

      await channelRef.current.send({
        type: "broadcast",
        event: EVENT_DELETE,
        payload: { messageId },
      });
    },
    [isConnected]
  );

  const sendTypingIndicator = useCallback(
    (isTyping: boolean) => {
      if (!channelRef.current || !isConnected) return;

      channelRef.current.send({
        type: "broadcast",
        event: EVENT_TYPING,
        payload: {
          userId: currentUserId,
          userName: currentUserName,
          isTyping,
        },
      });
    },
    [isConnected, currentUserId, currentUserName]
  );

  const handleTyping = useCallback(() => {
    const now = Date.now();

    // Throttle the 'true' event
    if (now - lastTypingSentRef.current > 2000) {
      sendTypingIndicator(true);
      lastTypingSentRef.current = now;
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Set new timeout to stop typing after 2 seconds
    const timeout = setTimeout(() => {
      sendTypingIndicator(false);
    }, 2000);

    typingTimeoutRef.current = timeout;
  }, [sendTypingIndicator]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    sendReaction,
    editMessage,
    deleteMessage,
    isConnected,
    clearMessages,
    otherUserTyping,
    handleTyping,
  };
}
