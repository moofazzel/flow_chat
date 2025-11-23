import { User } from "@/utils/auth";
import { createClient } from "@/utils/supabase/client";

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "blocked";
  created_at: string;
  updated_at: string;
}

export interface DmThread {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
}

export interface DmMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  attachments?: any[];
  reactions?: Record<string, string[]>;
  reply_to_id?: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Send a friend request
 */
export async function sendFriendRequest(
  currentUserId: string,
  targetUserId: string,
  message?: string
): Promise<{ success: boolean; error?: string }> {
  if (currentUserId === targetUserId) {
    return { success: false, error: "You cannot add yourself as a friend" };
  }

  const supabase = createClient();

  // Check if friendship already exists
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
      return { success: false, error: "Friend request already pending" };
    } else if (existing.status === "blocked") {
      return { success: false, error: "Unable to send friend request" };
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
): Promise<{ success: boolean; error?: string; threadId?: string }> {
  const supabase = createClient();

  // Update friendship status
  const { error: updateError } = await supabase
    .from("friendships")
    .update({
      status: "accepted",
      updated_at: new Date().toISOString(),
    })
    .eq("requester_id", requesterId)
    .eq("addressee_id", currentUserId)
    .eq("status", "pending");

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Create DM thread between the users
  const { data: threadId, error: threadError } = await supabase.rpc(
    "create_dm_thread",
    {
      user_id_1: currentUserId,
      user_id_2: requesterId,
    }
  );

  if (threadError) {
    console.warn("Failed to create DM thread:", threadError.message);
  }

  return {
    success: true,
    threadId: threadId || undefined,
  };
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

  if (!friendships || friendships.length === 0) return [];

  const friendIds = friendships.map((f) =>
    f.requester_id === userId ? f.addressee_id : f.requester_id
  );

  const { data: friends } = await supabase
    .from("users")
    .select("*")
    .in("id", friendIds);

  return (friends as User[]) || [];
}

/**
 * Get pending friend requests
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

  // Get user details for incoming requests
  const { data: incomingUsers } = await supabase
    .from("users")
    .select("*")
    .in("id", incomingIds);

  // Get user details for outgoing requests
  const { data: outgoingUsers } = await supabase
    .from("users")
    .select("*")
    .in("id", outgoingIds);

  return {
    incoming: (incomingUsers as User[]) || [],
    outgoing: (outgoingUsers as User[]) || [],
  };
}

/**
 * Get or create DM thread between two users
 */
export async function getDmThread(
  currentUserId: string,
  otherUserId: string
): Promise<{ thread: DmThread | null; error?: string }> {
  const supabase = createClient();

  // First try to find existing thread
  const orderedUserA =
    currentUserId < otherUserId ? currentUserId : otherUserId;
  const orderedUserB =
    currentUserId < otherUserId ? otherUserId : currentUserId;

  let { data: thread } = await supabase
    .from("dm_threads")
    .select("*")
    .eq("user_a", orderedUserA)
    .eq("user_b", orderedUserB)
    .single();

  // If no thread exists, create one
  if (!thread) {
    const { data: newThread, error } = await supabase
      .from("dm_threads")
      .insert({
        user_a: orderedUserA,
        user_b: orderedUserB,
      })
      .select()
      .single();

    if (error) {
      return { thread: null, error: error.message };
    }

    thread = newThread;
  }

  return { thread: thread as DmThread };
}

/**
 * Get DM messages for a thread
 */
export async function getDmMessages(
  threadId: string,
  limit: number = 50
): Promise<DmMessage[]> {
  const supabase = createClient();

  const { data: messages } = await supabase
    .from("dm_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(limit);

  return (messages as DmMessage[]) || [];
}

/**
 * Send a DM message
 */
export async function sendDmMessage(
  threadId: string,
  senderId: string,
  content: string,
  replyToId?: string
): Promise<{ success: boolean; message?: DmMessage; error?: string }> {
  const supabase = createClient();

  const { data: message, error } = await supabase
    .from("dm_messages")
    .insert({
      thread_id: threadId,
      sender_id: senderId,
      content,
      reply_to_id: replyToId,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, message: message as DmMessage };
}

/**
 * Get user's DM conversations with last message info
 */
export async function getDmConversations(userId: string): Promise<
  {
    id: string;
    otherUser: User;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
  }[]
> {
  const supabase = createClient();

  // Get all DM threads for the user
  const { data: threads } = await supabase
    .from("dm_threads")
    .select("*")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (!threads || threads.length === 0) return [];

  const conversations = [];

  for (const thread of threads) {
    const otherUserId =
      thread.user_a === userId ? thread.user_b : thread.user_a;

    // Get other user details
    const { data: otherUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", otherUserId)
      .single();

    // Get last message
    const { data: lastMessage } = await supabase
      .from("dm_messages")
      .select("content, created_at")
      .eq("thread_id", thread.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (otherUser) {
      conversations.push({
        id: thread.id,
        otherUser: otherUser as User,
        lastMessage: lastMessage?.content || "No messages yet",
        lastMessageTime: lastMessage?.created_at || thread.created_at,
        unreadCount: 0, // TODO: Implement unread tracking
      });
    }
  }

  return conversations;
}

/**
 * Block a user (prevents future friend requests)
 */
export async function blockUser(
  currentUserId: string,
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  // Remove any existing friendship
  await supabase
    .from("friendships")
    .delete()
    .or(
      `and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`
    );

  // Create blocked relationship
  const { error } = await supabase.from("friendships").insert({
    requester_id: currentUserId,
    addressee_id: targetUserId,
    status: "blocked",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Unblock a user
 */
export async function unblockUser(
  currentUserId: string,
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("requester_id", currentUserId)
    .eq("addressee_id", targetUserId)
    .eq("status", "blocked");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
