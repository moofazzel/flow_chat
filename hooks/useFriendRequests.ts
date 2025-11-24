import { User } from "@/utils/auth";
import { createClient } from "@/utils/supabase/client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export interface FriendRequest {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  requester?: User;
  addressee?: User;
}

/**
 * Subscribe to real-time friend request updates for the current user
 * Shows toast notifications when user receives friend requests
 */
export function useFriendRequests(userId: string | null) {
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) {
      console.log("⚠️ useFriendRequests: No userId provided");
      return;
    }

    console.log(
      "🔌 useFriendRequests: Setting up subscription for user:",
      userId
    );

    // Subscribe to friendships table for all events related to this user
    const channel = supabase
      .channel(`friend-requests-${userId}`)
      // Listen for incoming friend requests (where user is the addressee)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "friendships",
          filter: `addressee_id=eq.${userId}`,
        },
        async (payload) => {
          console.log("✅ New incoming friend request:", payload);

          // Fetch requester details
          const { data: requester, error: requesterError } = await supabase
            .from("users")
            .select("*")
            .eq("id", payload.new.requester_id)
            .single();

          if (requesterError) {
            console.error("❌ Error fetching requester:", requesterError);
          }

          const request: FriendRequest = {
            id: payload.new.id,
            requester_id: payload.new.requester_id,
            addressee_id: payload.new.addressee_id,
            status: payload.new.status,
            created_at: payload.new.created_at,
            requester: requester || undefined,
          };

          console.log("📨 Adding incoming request to state:", request);

          if (request.status === "pending") {
            setIncomingRequests((prev) => [...prev, request]);

            // Show toast notification
            toast.success("New friend request!", {
              description: `${
                requester?.full_name || "Someone"
              } sent you a friend request`,
              duration: 5000,
            });
          }
        }
      )
      // Listen for updates to friend requests (accepted/declined)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "friendships",
          filter: `requester_id=eq.${userId}`,
        },
        async (payload) => {
          console.log("✅ Friend request updated:", payload);

          // If request was accepted
          if (payload.new.status === "accepted") {
            // Fetch addressee details
            const { data: addressee } = await supabase
              .from("users")
              .select("*")
              .eq("id", payload.new.addressee_id)
              .single();

            // Remove from outgoing requests
            setOutgoingRequests((prev) =>
              prev.filter((req) => req.id !== payload.new.id)
            );

            // Show toast notification
            toast.success("Friend request accepted!", {
              description: `${
                addressee?.full_name || "User"
              } accepted your friend request`,
              duration: 5000,
            });
          } else if (payload.new.status === "declined") {
            // Remove from outgoing requests
            setOutgoingRequests((prev) =>
              prev.filter((req) => req.id !== payload.new.id)
            );
          }
        }
      )
      // Listen for when user accepts a request (updates where user is addressee)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "friendships",
          filter: `addressee_id=eq.${userId}`,
        },
        async (payload) => {
          console.log("✅ User accepted/declined a friend request:", payload);

          // Remove from incoming requests
          setIncomingRequests((prev) =>
            prev.filter((req) => req.id !== payload.new.id)
          );
        }
      )
      // Listen for deleted friend requests (cancelled)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "friendships",
        },
        (payload) => {
          console.log("✅ Friend request deleted:", payload);

          // Remove from both lists
          const deletedId = payload.old.id;
          setIncomingRequests((prev) =>
            prev.filter((req) => req.id !== deletedId)
          );
          setOutgoingRequests((prev) =>
            prev.filter((req) => req.id !== deletedId)
          );
        }
      )
      .subscribe((status) => {
        console.log("📡 Friend requests subscription status:", status);
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          console.log("✅ Successfully subscribed to friend requests");
        } else if (status === "CHANNEL_ERROR") {
          setIsConnected(false);
          console.error(
            "❌ Channel error - check if realtime is enabled for friendships table"
          );
          toast.error("Failed to connect to friend notifications", {
            description: "Friend requests may not update in real-time",
          });
        } else if (status === "TIMED_OUT") {
          setIsConnected(false);
          console.error("⏱️ Friend requests subscription timed out");
        } else {
          setIsConnected(false);
        }
      });

    return () => {
      console.log("🔌 useFriendRequests: Unsubscribing");
      channel.unsubscribe();
    };
  }, [userId, supabase]);

  const clearRequests = useCallback(() => {
    setIncomingRequests([]);
    setOutgoingRequests([]);
  }, []);

  const removeIncomingRequest = useCallback((requestId: string) => {
    setIncomingRequests((prev) => prev.filter((req) => req.id !== requestId));
  }, []);

  const removeOutgoingRequest = useCallback((requestId: string) => {
    setOutgoingRequests((prev) => prev.filter((req) => req.id !== requestId));
  }, []);

  return {
    incomingRequests,
    outgoingRequests,
    totalCount: incomingRequests.length + outgoingRequests.length,
    incomingCount: incomingRequests.length,
    outgoingCount: outgoingRequests.length,
    isConnected,
    clearRequests,
    removeIncomingRequest,
    removeOutgoingRequest,
  };
}
