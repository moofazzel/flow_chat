/**
 * inviteService.ts
 *
 * Single Responsibility: Handle all invite operations
 * - Server invites (links)
 * - Direct friend invites
 * - Invite validation and expiration
 *
 * This service provides a unified API for invite management
 * following the Single Responsibility Principle
 */

import { createClient } from "@/utils/supabase/client";
import { addServerMember, isServerMember } from "./membershipService";

// ================================================================
// TYPES
// ================================================================

export interface ServerInvite {
  id: string;
  server_id: string;
  code: string;
  created_by: string;
  expires_at: string | null;
  max_uses: number | null;
  uses: number;
  created_at: string;
}

export interface InviteResult {
  success: boolean;
  message: string;
  serverId?: string;
  serverName?: string;
}

// ================================================================
// INVITE LINK OPERATIONS
// ================================================================

/**
 * Generate a unique invite code
 */
function generateInviteCode(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new server invite link
 */
export async function createServerInvite(
  serverId: string,
  options?: {
    expiresInHours?: number;
    maxUses?: number;
  }
): Promise<ServerInvite> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  // Check if user is a member of the server
  const isMember = await isServerMember(serverId, user.id);
  if (!isMember) {
    throw new Error("Not authorized to create invite for this server");
  }

  const code = generateInviteCode();
  const expiresAt = options?.expiresInHours
    ? new Date(
        Date.now() + options.expiresInHours * 60 * 60 * 1000
      ).toISOString()
    : null;

  const { data, error } = await supabase
    .from("server_invites")
    .insert({
      server_id: serverId,
      code: code,
      created_by: user.id,
      expires_at: expiresAt,
      max_uses: options?.maxUses || null,
      uses: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating server invite:", error);
    throw error;
  }

  return data;
}

/**
 * Get all invites for a server
 */
export async function getServerInvites(
  serverId: string
): Promise<ServerInvite[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("server_invites")
    .select("*")
    .eq("server_id", serverId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching server invites:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get invite by code
 */
export async function getInviteByCode(
  code: string
): Promise<ServerInvite | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("server_invites")
    .select("*")
    .eq("code", code)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching invite:", error);
    throw error;
  }

  return data;
}

/**
 * Validate an invite code
 */
export async function validateInvite(code: string): Promise<{
  valid: boolean;
  reason?: string;
  invite?: ServerInvite;
}> {
  const invite = await getInviteByCode(code);

  if (!invite) {
    return { valid: false, reason: "Invite not found" };
  }

  // Check expiration
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { valid: false, reason: "Invite has expired" };
  }

  // Check max uses
  if (invite.max_uses && invite.uses >= invite.max_uses) {
    return { valid: false, reason: "Invite has reached maximum uses" };
  }

  return { valid: true, invite };
}

/**
 * Accept an invite and join the server
 */
export async function acceptInvite(code: string): Promise<InviteResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "User not authenticated" };
  }

  // Validate the invite
  const validation = await validateInvite(code);
  if (!validation.valid || !validation.invite) {
    return { success: false, message: validation.reason || "Invalid invite" };
  }

  const invite = validation.invite;

  // Check if already a member
  const alreadyMember = await isServerMember(invite.server_id, user.id);
  if (alreadyMember) {
    return {
      success: false,
      message: "You are already a member of this server",
      serverId: invite.server_id,
    };
  }

  try {
    // Add user to server
    await addServerMember(invite.server_id, user.id, "member");

    // Increment uses count
    await supabase
      .from("server_invites")
      .update({ uses: invite.uses + 1 })
      .eq("id", invite.id);

    // Get server name for confirmation
    const { data: server } = await supabase
      .from("servers")
      .select("name")
      .eq("id", invite.server_id)
      .single();

    return {
      success: true,
      message: `Successfully joined ${server?.name || "the server"}`,
      serverId: invite.server_id,
      serverName: server?.name,
    };
  } catch (error) {
    console.error("Error accepting invite:", error);
    return { success: false, message: "Failed to join server" };
  }
}

/**
 * Delete an invite
 */
export async function deleteInvite(inviteId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("server_invites")
    .delete()
    .eq("id", inviteId);

  if (error) {
    console.error("Error deleting invite:", error);
    throw error;
  }
}

/**
 * Get full invite URL
 */
export function getInviteUrl(code: string): string {
  // Use window.location if available, otherwise fallback
  const baseUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}`
      : "http://localhost:3000";

  return `${baseUrl}/invite/${code}`;
}

// ================================================================
// DIRECT FRIEND INVITES
// ================================================================

/**
 * Check if current user can invite members to a server
 * Only owner and admin can invite
 */
export async function canInviteMembers(serverId: string): Promise<boolean> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  // Check if user is server owner
  const { data: server } = await supabase
    .from("servers")
    .select("owner_id")
    .eq("id", serverId)
    .single();

  if (server?.owner_id === user.id) return true;

  // Check if user is admin
  const { data: membership } = await supabase
    .from("server_members")
    .select("role")
    .eq("server_id", serverId)
    .eq("user_id", user.id)
    .single();

  return membership?.role === "owner" || membership?.role === "admin";
}

/**
 * Invite a friend directly to a server
 * (Friend must already exist in the friends list)
 */
export async function inviteFriendToServer(
  serverId: string,
  friendId: string
): Promise<InviteResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "User not authenticated" };
  }

  // Check if the current user is a member
  const isMember = await isServerMember(serverId, user.id);
  if (!isMember) {
    return { success: false, message: "You must be a member to invite others" };
  }

  // Check if user has permission to invite (owner or admin)
  const hasPermission = await canInviteMembers(serverId);
  if (!hasPermission) {
    return {
      success: false,
      message:
        "You don't have permission to invite members. Only owners and admins can invite.",
    };
  }

  // Check if friend is already a member
  const friendIsMember = await isServerMember(serverId, friendId);
  if (friendIsMember) {
    return {
      success: false,
      message: "User is already a member of this server",
    };
  }

  try {
    // Add friend to server
    await addServerMember(serverId, friendId, "member");

    // Get server name for confirmation
    const { data: server } = await supabase
      .from("servers")
      .select("name")
      .eq("id", serverId)
      .single();

    // Create a notification for the friend (if notifications table exists)
    try {
      await supabase.from("notifications").insert({
        user_id: friendId,
        type: "server_invite_accepted",
        message: `You have been added to ${server?.name || "a server"}`,
        data: { server_id: serverId, invited_by: user.id },
      });
    } catch {
      // Notification table might not exist, ignore
    }

    return {
      success: true,
      message: `Successfully invited user to ${server?.name || "the server"}`,
      serverId: serverId,
      serverName: server?.name,
    };
  } catch (error: unknown) {
    console.error("Error inviting friend:", error);
    // Check for RLS permission error
    const errorObj = error as { code?: string; message?: string };
    if (errorObj?.code === "42501") {
      return {
        success: false,
        message:
          "You don't have permission to invite members. Only owners and admins can invite.",
      };
    }
    return { success: false, message: "Failed to invite user" };
  }
}

// ================================================================
// EMAIL INVITES (Placeholder for future implementation)
// ================================================================

/**
 * Send an email invite to a user
 * NOTE: Requires email service integration
 */
export async function sendEmailInvite(
  serverId: string,
  email: string
): Promise<InviteResult> {
  // This would require an email service like SendGrid, Mailgun, etc.
  // For now, return a placeholder message

  console.log(`Email invite requested for ${email} to server ${serverId}`);

  return {
    success: false,
    message:
      "Email invites are not yet implemented. Please use an invite link instead.",
  };
}

// ================================================================
// CLEANUP OPERATIONS
// ================================================================

/**
 * Delete expired invites
 * This should be called periodically (e.g., via a cron job)
 */
export async function cleanupExpiredInvites(): Promise<number> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("server_invites")
    .delete()
    .lt("expires_at", new Date().toISOString())
    .select("id");

  if (error) {
    console.error("Error cleaning up expired invites:", error);
    throw error;
  }

  return data?.length || 0;
}
