import { createClient } from "@/utils/supabase/client";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "sonner";

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: "image" | "file" | "video";
  url?: string;
}

export interface MessageEmbed {
  type: "task" | "link";
  task_id?: string;
  url?: string;
  title?: string;
  description?: string;
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
  embeds?: MessageEmbed[];
  author?: {
    username: string;
    avatar_url: string;
    full_name: string;
  };
  attachments?: Attachment[];
  reactions?: Record<
    string,
    {
      emoji: string;
      count: number;
      users: Array<{ id: string; username: string }>;
    }
  >;
  mentions?: Array<{
    id: string;
    message_id: string;
    mentioned_user_id: string;
    created_at: string;
  }>;
  task_links?: Array<{
    id: string;
    message_id: string;
    card_id: string;
    created_at: string;
  }>;
  reply_to?: ChatMessage;
}

interface ChatState {
  messagesByChannel: Record<string, ChatMessage[]>;
  isLoading: boolean;
  error: string | null;
  currentChannelId: string | null;
}

const initialState: ChatState = {
  messagesByChannel: {},
  isLoading: false,
  error: null,
  currentChannelId: null,
};

// Async thunk to fetch messages for a channel
export const fetchChannelMessages = createAsyncThunk(
  "chat/fetchChannelMessages",
  async (channelId: string, { rejectWithValue }) => {
    const supabase = createClient();
    try {
      // Fetch messages with author data
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

      if (error) throw error;

      if (!data || data.length === 0) {
        return { channelId, messages: [] };
      }

      // Fetch reply_to messages separately
      const replyIds = data
        .filter((msg) => msg.reply_to_id)
        .map((msg) => msg.reply_to_id);

      let replyMessagesMap: Record<string, any> = {};

      if (replyIds.length > 0) {
        const { data: replyMessages } = await supabase
          .from("messages")
          .select(`id, content, author:users!author_id(username)`)
          .in("id", replyIds);

        if (replyMessages) {
          replyMessagesMap = replyMessages.reduce((acc, msg) => {
            acc[msg.id] = {
              id: msg.id,
              content: msg.content,
              author: Array.isArray(msg.author) ? msg.author[0] : msg.author,
            };
            return acc;
          }, {} as Record<string, any>);
        }
      }

      const dataWithReplies = data.map((msg) => ({
        ...msg,
        reply_to: msg.reply_to_id ? replyMessagesMap[msg.reply_to_id] : null,
      }));

      // Fetch attachments, reactions, mentions, task links
      const messageIds = data.map((msg) => msg.id);

      const [attachmentsData, reactionsData, mentionsData, taskLinksData] =
        await Promise.all([
          supabase
            .from("message_attachments")
            .select("*")
            .in("message_id", messageIds),
          supabase
            .from("reactions")
            .select("*, user:users!user_id(id, username)")
            .in("message_id", messageIds),
          supabase
            .from("message_mentions")
            .select("*")
            .in("message_id", messageIds),
          supabase
            .from("message_task_links")
            .select("*")
            .in("message_id", messageIds),
        ]);

      // Group reactions by message and emoji
      const reactionsByMessage: Record<string, Record<string, any>> = {};
      reactionsData.data?.forEach((reaction: any) => {
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
      });

      // Combine all data
      const messagesWithRelations = dataWithReplies.map((msg) => ({
        ...msg,
        attachments:
          attachmentsData.data?.filter((a) => a.message_id === msg.id) || [],
        reactions: reactionsByMessage[msg.id] || {},
        mentions:
          mentionsData.data?.filter((m) => m.message_id === msg.id) || [],
        task_links:
          taskLinksData.data?.filter((t) => t.message_id === msg.id) || [],
      })) as ChatMessage[];

      return { channelId, messages: messagesWithRelations };
    } catch (error: any) {
      toast.error("Failed to load messages");
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to send a message
export const sendMessageThunk = createAsyncThunk(
  "chat/sendMessage",
  async (
    {
      channelId,
      content,
      userId,
      options,
    }: {
      channelId: string;
      content: string;
      userId: string;
      options?: {
        attachments?: File[];
        replyToId?: string;
        mentionedUserIds?: string[];
        taskIds?: string[];
      };
    },
    { rejectWithValue }
  ) => {
    const supabase = createClient();
    try {
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert({
          channel_id: channelId,
          author_id: userId,
          content,
          reply_to_id: options?.replyToId,
        })
        .select(
          `
          *,
          author:users!author_id(username, avatar_url, full_name)
        `
        )
        .single();

      if (messageError || !messageData) throw messageError;

      const messageId = messageData.id;

      // Handle attachments, mentions, task links
      if (options?.attachments && options.attachments.length > 0) {
        for (const file of options.attachments) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${messageId}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("message-attachments")
            .upload(fileName, file);

          if (!uploadError) {
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
      }

      if (options?.mentionedUserIds && options.mentionedUserIds.length > 0) {
        const mentions = options.mentionedUserIds.map((userId) => ({
          message_id: messageId,
          mentioned_user_id: userId,
        }));
        await supabase.from("message_mentions").insert(mentions);
      }

      if (options?.taskIds && options.taskIds.length > 0) {
        const taskLinks = options.taskIds.map((cardId) => ({
          message_id: messageId,
          card_id: cardId,
        }));
        await supabase.from("message_task_links").insert(taskLinks);
      }

      const newMessage: ChatMessage = {
        ...messageData,
        attachments: [],
        reactions: {},
        mentions: [],
        task_links: [],
        reply_to: options?.replyToId ? null : null,
      };

      return { channelId, message: newMessage };
    } catch (error: any) {
      toast.error("Failed to send message");
      return rejectWithValue(error.message);
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setCurrentChannelId: (state, action: PayloadAction<string>) => {
      state.currentChannelId = action.payload;
    },
    addMessageToChannel: (
      state,
      action: PayloadAction<{ channelId: string; message: ChatMessage }>
    ) => {
      const { channelId, message } = action.payload;
      if (!state.messagesByChannel[channelId]) {
        state.messagesByChannel[channelId] = [];
      }
      // Avoid duplicates
      if (
        !state.messagesByChannel[channelId].find((m) => m.id === message.id)
      ) {
        state.messagesByChannel[channelId].push(message);
      }
    },
    updateMessageInChannel: (
      state,
      action: PayloadAction<{ channelId: string; message: ChatMessage }>
    ) => {
      const { channelId, message } = action.payload;
      if (state.messagesByChannel[channelId]) {
        const index = state.messagesByChannel[channelId].findIndex(
          (m) => m.id === message.id
        );
        if (index !== -1) {
          state.messagesByChannel[channelId][index] = message;
        }
      }
    },
    deleteMessageFromChannel: (
      state,
      action: PayloadAction<{ channelId: string; messageId: string }>
    ) => {
      const { channelId, messageId } = action.payload;
      if (state.messagesByChannel[channelId]) {
        state.messagesByChannel[channelId] = state.messagesByChannel[
          channelId
        ].filter((m) => m.id !== messageId);
      }
    },
    clearChannelMessages: (state, action: PayloadAction<string>) => {
      delete state.messagesByChannel[action.payload];
    },
  },
  extraReducers: (builder) => {
    // Fetch messages
    builder.addCase(fetchChannelMessages.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchChannelMessages.fulfilled, (state, action) => {
      state.isLoading = false;
      const { channelId, messages } = action.payload;
      state.messagesByChannel[channelId] = messages;
    });
    builder.addCase(fetchChannelMessages.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Send message
    builder.addCase(sendMessageThunk.fulfilled, (state, action) => {
      const { channelId, message } = action.payload;
      if (!state.messagesByChannel[channelId]) {
        state.messagesByChannel[channelId] = [];
      }
      // Avoid duplicates
      if (
        !state.messagesByChannel[channelId].find((m) => m.id === message.id)
      ) {
        state.messagesByChannel[channelId].push(message);
      }
    });
  },
});

export const {
  setCurrentChannelId,
  addMessageToChannel,
  updateMessageInChannel,
  deleteMessageFromChannel,
  clearChannelMessages,
} = chatSlice.actions;

export default chatSlice.reducer;
