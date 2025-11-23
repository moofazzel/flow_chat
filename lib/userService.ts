import { User } from "@/utils/auth";
import { createClient } from "@/utils/supabase/client";

/**
 * Search for users by username, email, or full name
 */
export async function searchUsers(
  query: string,
  currentUserId?: string
): Promise<User[]> {
  const supabase = createClient();

  let queryBuilder = supabase
    .from("users")
    .select("*")
    .or(
      `username.ilike.%${query}%,email.ilike.%${query}%,full_name.ilike.%${query}%`
    )
    .limit(10);

  if (currentUserId) {
    queryBuilder = queryBuilder.neq("id", currentUserId);
  }

  const { data } = await queryBuilder;
  if (!data) return [];
  return data as User[];
}

/**
 * Find a user by their unique invitation ID (user ID/username)
 */
export async function findUserByInvitationId(
  invitationId: string
): Promise<User | null> {
  const supabase = createClient();

  const { data } = await supabase
    .from("users")
    .select("*")
    .or(`id.eq.${invitationId},username.eq.${invitationId}`)
    .single();

  if (!data) return null;
  return data as User;
}

/**
 * Get user's friends list
 */
export async function getFriends(userId: string): Promise<User[]> {
  const supabase = createClient();

  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (!friendships) return [];

  const friendIds = friendships.map((f) =>
    f.requester_id === userId ? f.addressee_id : f.requester_id
  );

  if (friendIds.length === 0) return [];

  const { data: friends } = await supabase
    .from("users")
    .select("*")
    .in("id", friendIds);

  return (friends as User[]) || [];
}

/**
 * Get pending friend requests for a user
 */
export async function getPendingFriendRequests(userId: string): Promise<{
  incoming: User[];
  outgoing: User[];
}> {
  const supabase = createClient();

  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .eq("status", "pending")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (!friendships) return { incoming: [], outgoing: [] };

  const incomingIds = friendships
    .filter((f) => f.addressee_id === userId)
    .map((f) => f.requester_id);

  const outgoingIds = friendships
    .filter((f) => f.requester_id === userId)
    .map((f) => f.addressee_id);

  const incoming: User[] = [];
  const outgoing: User[] = [];

  if (incomingIds.length > 0) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .in("id", incomingIds);
    if (data) incoming.push(...(data as User[]));
  }

  if (outgoingIds.length > 0) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .in("id", outgoingIds);
    if (data) outgoing.push(...(data as User[]));
  }

  return { incoming, outgoing };
}

/**
 * Add friend by user ID or username (Auto-accepts for invitation flow)
 */
export async function addFriendByInvitation(
  currentUserId: string,
  invitationId: string,
  apiKey?: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  const user = await findUserByInvitationId(invitationId);

  if (!user) {
    return { success: false, error: "User not found with that invitation ID" };
  }

  if (user.id === currentUserId) {
    return { success: false, error: "You cannot add yourself as a friend" };
  }

  const supabase = createClient();

  const { data: existing } = await supabase
    .from("friendships")
    .select("*")
    .or(
      `and(requester_id.eq.${currentUserId},addressee_id.eq.${user.id}),and(requester_id.eq.${user.id},addressee_id.eq.${currentUserId})`
    )
    .single();

  if (existing) {
    if (existing.status === "accepted") {
      return { success: false, error: "Already friends with this user" };
    } else if (existing.status === "pending") {
      return { success: false, error: "Friend request already pending" };
    }
  }

  const { error } = await supabase.from("friendships").insert({
    requester_id: currentUserId,
    addressee_id: user.id,
    status: "accepted",
    api_key: apiKey,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, user };
}

/**
 * Send a friend request (Creates pending friendship)
 */
export async function sendFriendRequest(
  currentUserId: string,
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  if (currentUserId === targetUserId) {
    return { success: false, error: "You cannot add yourself as a friend" };
  }

  const supabase = createClient();

  const { data: existing } = await supabase
    .from("friendships")
    .select("*")
    .or(
      `and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`
    )
    .single();

  if (existing) {
    if (existing.status === "accepted") {
      return { success: false, error: "Already friends with this user" };
    } else if (existing.status === "pending") {
      return {
        success: false,
        error: "Friend request already sent or received",
      };
    }
  }

  const { error } = await supabase.from("friendships").insert({
    requester_id: currentUserId,
    addressee_id: targetUserId,
    status: "pending",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(
  currentUserId: string,
  requesterId: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  const supabase = createClient();

  const { error: updateError } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("requester_id", requesterId)
    .eq("addressee_id", currentUserId)
    .eq("status", "pending");

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", requesterId)
    .single();

  if (!user) {
    return { success: false, error: "User not found" };
  }

  return { success: true, user: user as User };
}

/**
 * Decline a friend request
 */
export async function declineFriendRequest(
  currentUserId: string,
  requesterId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("requester_id", requesterId)
    .eq("addressee_id", currentUserId)
    .eq("status", "pending");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Cancel an outgoing friend request
 */
export async function cancelFriendRequest(
  currentUserId: string,
  addresseeId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("requester_id", currentUserId)
    .eq("addressee_id", addresseeId)
    .eq("status", "pending");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
