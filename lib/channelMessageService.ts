import { User } from "@/utils/auth";
import { createClient } from "@/utils/supabase/client";

export interface Attachment {
  url: string;
  type: string;
  name: string;
  size: number;
}

export interface Embed {
  type: "task" | "link";
  task_id?: string;
  url?: string;
  title?: string;
  description?: string;
}

export interface ChannelMessage {
  id: string;
  channel_id: string;
  author_id: string;
  content: string;
  message_type:
    | "user_message"
    | "system"
    | "bot"
    | "task_created"
    | "task_completed"
    | "task_assigned";
  attachments: Attachment[];
  embeds: Embed[];
  mentions: string[];
  reply_to_id?: string;
  thread_id?: string;
  is_pinned: boolean;
  is_edited: boolean;
  created_at: string;
  updated_at: string;

  // Populated
  author?: User;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export async function sendChannelMessage(
  channelId: string,
  authorId: string,
  content: string,
  options?: {
    replyToId?: string;
    mentions?: string[];
    embeds?: Embed[];
  }
): Promise<{ success: boolean; message?: ChannelMessage; error?: string }> {
  const supabase = createClient();

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      channel_id: channelId,
      author_id: authorId,
      content,
      reply_to_id: options?.replyToId,
      mentions: options?.mentions || [],
      embeds: options?.embeds || [],
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, message: message as ChannelMessage };
}

export async function getChannelMessages(
  channelId: string,
  limit: number = 50,
  before?: string
): Promise<ChannelMessage[]> {
  const supabase = createClient();

  let query = supabase
    .from("messages")
    .select(`*, author:users!author_id(*)`)
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) query = query.lt("created_at", before);

  const { data } = await query;
  return (data as ChannelMessage[])?.reverse() || [];
}

export async function editMessage(
  messageId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("messages")
    .update({ content, is_edited: true, updated_at: new Date().toISOString() })
    .eq("id", messageId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteMessage(
  messageId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", messageId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function addReaction(
  messageId: string,
  userId: string,
  emoji: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from("reactions").insert({
    message_id: messageId,
    user_id: userId,
    emoji,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Already reacted" };
    }
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function removeReaction(
  messageId: string,
  userId: string,
  emoji: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("reactions")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", userId)
    .eq("emoji", emoji);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function togglePinMessage(
  messageId: string,
  pinned: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("messages")
    .update({ is_pinned: pinned })
    .eq("id", messageId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export function subscribeToChannel(
  channelId: string,
  onMessage: (message: ChannelMessage) => void,
  onUpdate: (message: ChannelMessage) => void,
  onDelete: (messageId: string) => void
) {
  const supabase = createClient();

  return supabase
    .channel(`channel-${channelId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => onMessage(payload.new as ChannelMessage)
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => onUpdate(payload.new as ChannelMessage)
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "messages",
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => onDelete(payload.old.id)
    )
    .subscribe();
}
