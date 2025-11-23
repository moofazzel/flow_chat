import { User } from "@/utils/auth";
import { createClient } from "@/utils/supabase/client";

export interface Server {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface ServerMember {
  id: string;
  server_id: string;
  user_id: string;
  role: "owner" | "admin" | "moderator" | "member";
  nickname?: string;
  joined_at: string;
}

export interface Channel {
  id: string;
  server_id: string;
  name: string;
  description?: string;
  type: "text" | "voice" | "announcement";
  category?: string;
  position: number;
  created_at: string;
}

/**
 * Create a new server
 */
export async function createServer(
  name: string,
  ownerId: string,
  description?: string,
  iconUrl?: string
): Promise<{ success: boolean; server?: Server; error?: string }> {
  const supabase = createClient();

  const { data: server, error } = await supabase
    .from("servers")
    .insert({
      name,
      description,
      icon_url: iconUrl,
      owner_id: ownerId,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  // Auto-add owner as member
  await supabase.from("server_members").insert({
    server_id: server.id,
    user_id: ownerId,
    role: "owner",
  });

  return { success: true, server: server as Server };
}

/**
 * Get user's servers
 */
export async function getUserServers(userId: string): Promise<Server[]> {
  const supabase = createClient();

  const { data: memberships } = await supabase
    .from("server_members")
    .select("server_id")
    .eq("user_id", userId);

  if (!memberships || memberships.length === 0) return [];

  const serverIds = memberships.map((m) => m.server_id);

  const { data: servers } = await supabase
    .from("servers")
    .select("*")
    .in("id", serverIds)
    .order("created_at", { ascending: false });

  return (servers as Server[]) || [];
}

/**
 * Add member to server
 */
export async function addServerMember(
  serverId: string,
  userId: string,
  role: ServerMember["role"] = "member"
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase.from("server_members").insert({
    server_id: serverId,
    user_id: userId,
    role,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Get server members
 */
export async function getServerMembers(serverId: string): Promise<User[]> {
  const supabase = createClient();

  const { data: memberships } = await supabase
    .from("server_members")
    .select("user_id")
    .eq("server_id", serverId);

  if (!memberships || memberships.length === 0) return [];

  const userIds = memberships.map((m) => m.user_id);

  const { data: users } = await supabase
    .from("users")
    .select("*")
    .in("id", userIds);

  return (users as User[]) || [];
}

/**
 * Create channel in server
 */
export async function createChannel(
  serverId: string,
  name: string,
  type: Channel["type"] = "text",
  category?: string,
  description?: string
): Promise<{ success: boolean; channel?: Channel; error?: string }> {
  const supabase = createClient();

  // Get max position for ordering
  const { data: existingChannels } = await supabase
    .from("channels")
    .select("position")
    .eq("server_id", serverId)
    .order("position", { ascending: false })
    .limit(1);

  const position = existingChannels?.[0]?.position ?? 0;

  const { data: channel, error } = await supabase
    .from("channels")
    .insert({
      server_id: serverId,
      name,
      type,
      category,
      description,
      position: position + 1,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, channel: channel as Channel };
}

/**
 * Get server channels
 */
export async function getServerChannels(serverId: string): Promise<Channel[]> {
  const supabase = createClient();

  const { data: channels } = await supabase
    .from("channels")
    .select("*")
    .eq("server_id", serverId)
    .order("position", { ascending: true });

  return (channels as Channel[]) || [];
}

/**
 * Update server
 */
export async function updateServer(
  serverId: string,
  updates: Partial<Pick<Server, "name" | "description" | "icon_url">>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("servers")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", serverId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Delete server
 */
export async function deleteServer(
  serverId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase.from("servers").delete().eq("id", serverId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Delete channel
 */
export async function deleteChannel(
  channelId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("channels")
    .delete()
    .eq("id", channelId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
