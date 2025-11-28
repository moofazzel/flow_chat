/**
 * membershipService.ts
 *
 * Single Responsibility: Handle all membership operations across the workspace
 * - Server membership
 * - Board membership
 * - Member synchronization
 *
 * This service provides a unified API for membership management
 * following the Single Responsibility Principle
 */

import { createClient } from "@/utils/supabase/client";

// ================================================================
// TYPES
// ================================================================

export type ServerRole = "owner" | "admin" | "member";
export type BoardRole = "admin" | "member" | "observer";

export interface MemberUser {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  status?: string;
}

export interface ServerMember {
  id: string;
  server_id: string;
  user_id: string;
  role: ServerRole;
  joined_at: string;
  user?: MemberUser;
}

export interface BoardMember {
  id: string;
  board_id: string;
  user_id: string;
  role: BoardRole;
  added_at: string;
  user?: MemberUser;
}

export interface MembershipStatus {
  isServerMember: boolean;
  isBoardMember: boolean;
  serverRole?: ServerRole;
  boardRole?: BoardRole;
}

// ================================================================
// SERVER MEMBERSHIP
// ================================================================

/**
 * Get all members of a server
 */
export async function getServerMembers(
  serverId: string
): Promise<ServerMember[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("server_members")
    .select("*")
    .eq("server_id", serverId)
    .order("joined_at", { ascending: true });

  if (error) {
    console.error("Error fetching server members:", error);
    throw error;
  }

  // Fetch user details separately
  if (data && data.length > 0) {
    const userIds = data.map((m) => m.user_id);
    const { data: users } = await supabase
      .from("users")
      .select("id, email, username, full_name, avatar_url, status")
      .in("id", userIds);

    // Map users to members
    return data.map((member) => ({
      ...member,
      user: users?.find((u) => u.id === member.user_id) || undefined,
    })) as ServerMember[];
  }

  return data || [];
}

/**
 * Get a specific server member
 */
export async function getServerMember(
  serverId: string,
  userId: string
): Promise<ServerMember | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("server_members")
    .select("*")
    .eq("server_id", serverId)
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching server member:", error);
    throw error;
  }

  if (!data) return null;

  // Fetch user details
  const { data: user } = await supabase
    .from("users")
    .select("id, email, username, full_name, avatar_url, status")
    .eq("id", userId)
    .single();

  return {
    ...data,
    user: user || undefined,
  } as ServerMember;
}

/**
 * Check if user is a server member
 */
export async function isServerMember(
  serverId: string,
  userId: string
): Promise<boolean> {
  const member = await getServerMember(serverId, userId);
  return member !== null;
}

/**
 * Add a member to a server
 */
export async function addServerMember(
  serverId: string,
  userId: string,
  role: ServerRole = "member"
): Promise<ServerMember> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("server_members")
    .insert({
      server_id: serverId,
      user_id: userId,
      role: role,
      joined_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding server member:", error);
    throw error;
  }

  return data;
}

/**
 * Update a server member's role
 */
export async function updateServerMemberRole(
  serverId: string,
  userId: string,
  newRole: ServerRole
): Promise<ServerMember> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("server_members")
    .update({ role: newRole })
    .eq("server_id", serverId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating server member role:", error);
    throw error;
  }

  return data;
}

/**
 * Remove a member from a server
 */
export async function removeServerMember(
  serverId: string,
  userId: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("server_members")
    .delete()
    .eq("server_id", serverId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error removing server member:", error);
    throw error;
  }
}

// ================================================================
// BOARD MEMBERSHIP
// ================================================================

/**
 * Get all members of a board
 */
export async function getBoardMembers(boardId: string): Promise<BoardMember[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("board_members")
    .select("*")
    .eq("board_id", boardId)
    .order("added_at", { ascending: true });

  if (error) {
    console.error("Error fetching board members:", error);
    throw error;
  }

  // Fetch user details separately
  if (data && data.length > 0) {
    const userIds = data.map((m) => m.user_id);
    const { data: users } = await supabase
      .from("users")
      .select("id, email, username, full_name, avatar_url")
      .in("id", userIds);

    // Map users to members
    return data.map((member) => ({
      ...member,
      user: users?.find((u) => u.id === member.user_id) || undefined,
    })) as BoardMember[];
  }

  return data || [];
}

/**
 * Get a specific board member
 */
export async function getBoardMember(
  boardId: string,
  userId: string
): Promise<BoardMember | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("board_members")
    .select(
      `
      id,
      board_id,
      user_id,
      role,
      added_at
    `
    )
    .eq("board_id", boardId)
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching board member:", error);
    throw error;
  }

  return data;
}

/**
 * Check if user is a board member
 */
export async function isBoardMember(
  boardId: string,
  userId: string
): Promise<boolean> {
  const member = await getBoardMember(boardId, userId);
  return member !== null;
}

/**
 * Add a member to a board
 */
export async function addBoardMember(
  boardId: string,
  userId: string,
  role: BoardRole = "member"
): Promise<BoardMember> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("board_members")
    .insert({
      board_id: boardId,
      user_id: userId,
      role: role,
      added_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding board member:", error);
    throw error;
  }

  return data;
}

/**
 * Update a board member's role
 */
export async function updateBoardMemberRole(
  boardId: string,
  userId: string,
  newRole: BoardRole
): Promise<BoardMember> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("board_members")
    .update({ role: newRole })
    .eq("board_id", boardId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating board member role:", error);
    throw error;
  }

  return data;
}

/**
 * Remove a member from a board
 */
export async function removeBoardMember(
  boardId: string,
  userId: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("board_members")
    .delete()
    .eq("board_id", boardId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error removing board member:", error);
    throw error;
  }
}

// ================================================================
// CROSS-MEMBERSHIP OPERATIONS
// ================================================================

/**
 * Get full membership status for a user in a workspace
 */
export async function getMembershipStatus(
  serverId: string,
  boardId: string | null,
  userId: string
): Promise<MembershipStatus> {
  const serverMember = await getServerMember(serverId, userId);

  let boardMember: BoardMember | null = null;
  if (boardId) {
    boardMember = await getBoardMember(boardId, userId);
  }

  return {
    isServerMember: serverMember !== null,
    isBoardMember: boardMember !== null,
    serverRole: serverMember?.role,
    boardRole: boardMember?.role,
  };
}

/**
 * Get all members in a channel's server (for chat/voice access)
 */
export async function getChannelMembers(
  channelId: string
): Promise<ServerMember[]> {
  const supabase = createClient();

  // First get the server_id from the channel
  const { data: channel, error: channelError } = await supabase
    .from("channels")
    .select("server_id")
    .eq("id", channelId)
    .single();

  if (channelError) {
    console.error("Error fetching channel:", channelError);
    throw channelError;
  }

  if (!channel?.server_id) {
    return [];
  }

  return getServerMembers(channel.server_id);
}

/**
 * Sync server members to a board (for server-visibility boards)
 */
export async function syncServerMembersToBoard(
  serverId: string,
  boardId: string
): Promise<void> {
  const serverMembers = await getServerMembers(serverId);

  for (const member of serverMembers) {
    try {
      const exists = await isBoardMember(boardId, member.user_id);
      if (!exists) {
        const role: BoardRole = member.role === "owner" ? "admin" : "member";
        await addBoardMember(boardId, member.user_id, role);
      }
    } catch (error) {
      // Ignore duplicate key errors
      console.warn(`Could not sync member ${member.user_id} to board:`, error);
    }
  }
}

// ================================================================
// REAL-TIME SUBSCRIPTIONS
// ================================================================

/**
 * Subscribe to server member changes
 */
export function subscribeToServerMembers(
  serverId: string,
  callback: (members: ServerMember[]) => void
) {
  const supabase = createClient();

  const channel = supabase
    .channel(`server-members-${serverId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "server_members",
        filter: `server_id=eq.${serverId}`,
      },
      async () => {
        // Refetch all members on any change
        const members = await getServerMembers(serverId);
        callback(members);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to board member changes
 */
export function subscribeToBoardMembers(
  boardId: string,
  callback: (members: BoardMember[]) => void
) {
  const supabase = createClient();

  const channel = supabase
    .channel(`board-members-${boardId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "board_members",
        filter: `board_id=eq.${boardId}`,
      },
      async () => {
        // Refetch all members on any change
        const members = await getBoardMembers(boardId);
        callback(members);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
