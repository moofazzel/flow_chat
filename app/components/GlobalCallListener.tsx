"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { receiveCall, setCallModalOpen } from "@/store/slices/callSlice";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

// Ringtone audio for incoming calls
const SOUND_RINGTONE =
  process.env.NEXT_PUBLIC_SOUND_RINGTONE || "/sounds/notification.mp3";

/**
 * Listens for incoming direct call offers globally, even when
 * the DM chat view is not mounted. Uses a user-targeted channel.
 *
 * Initiators should broadcast to `user-call:<toUserId>` along with threadId.
 */
export function GlobalCallListener() {
  const dispatch = useAppDispatch();
  const currentUserId = useAppSelector((s) => s.auth.user?.id);
  const isCallModalOpen = useAppSelector((s) => s.call.isCallModalOpen);
  const incomingOffer = useAppSelector((s) => s.call.incomingOffer);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);
  const ringtoneAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeToastIdRef = useRef<string | number | null>(null);

  // Preload ringtone audio
  useEffect(() => {
    ringtoneAudioRef.current = new Audio(SOUND_RINGTONE);
    ringtoneAudioRef.current.loop = true;
    return () => {
      try {
        ringtoneAudioRef.current?.pause();
      } catch {}
    };
  }, []);

  useEffect(() => {
    // Require authenticated user to subscribe
    if (!currentUserId) return;

    // Avoid duplicate listeners when modal already handles signaling
    if (isCallModalOpen) {
      // Stop ringtone if modal opened
      try {
        ringtoneAudioRef.current?.pause();
      } catch {}
      return;
    }

    const supabase = createClient();
    supabaseRef.current = supabase;

    const userChannelName = `user-call:${currentUserId}`;
    const channel = supabase.channel(userChannelName, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

    let subscribed = false;

    channel
      .on("broadcast", { event: "call-offer" }, ({ payload }: any) => {
        if (!payload) return;
        // Expect payload to contain: toUserId, fromUserId, fromUserName, callType, offer, threadId
        if (payload.toUserId !== currentUserId) return;

        // If call modal opened meanwhile, skip
        if (isCallModalOpen) return;

        // If we already have an incoming offer or active toast, ignore
        if (incomingOffer) {
          console.log(
            "[GlobalCallListener] Already have an incoming offer, ignoring new one"
          );
          return;
        }
        if (activeToastIdRef.current) {
          console.log(
            "[GlobalCallListener] Active incoming toast present, ignoring new call-offer"
          );
          return;
        }

        console.log(
          "[GlobalCallListener] Incoming call from:",
          payload.fromUserName
        );

        // Play ringtone
        try {
          if (ringtoneAudioRef.current) {
            ringtoneAudioRef.current.currentTime = 0;
            ringtoneAudioRef.current.play().catch((e) => {
              console.warn("[GlobalCallListener] Audio autoplay blocked:", e);
            });
          }
        } catch (e) {
          console.warn("[GlobalCallListener] Failed to play ringtone:", e);
        }

        dispatch(
          receiveCall({
            type: payload.callType,
            userId: payload.fromUserId,
            userName: payload.fromUserName,
            userAvatar: payload.fromUserAvatar || "",
            threadId: payload.threadId,
            offer: payload.offer,
          })
        );

        // Show toast with Answer action
        const toastId = toast.info(
          `Incoming ${payload.callType} call from ${payload.fromUserName}`,
          {
            duration: 30000,
            action: {
              label: "Answer",
              onClick: () => {
                dispatch(setCallModalOpen(true));
                toast.dismiss(toastId);
                try {
                  ringtoneAudioRef.current?.pause();
                } catch {}
              },
            },
          }
        );
        activeToastIdRef.current = toastId;
        console.log("[GlobalCallListener] Toast shown for incoming call", toastId);
      })
      .on("broadcast", { event: "call-end" }, ({ payload }: any) => {
        if (payload?.toUserId !== currentUserId) return;
        console.log("[GlobalCallListener] Call ended by other user");
        // Dismiss toast and stop ringtone
        if (activeToastIdRef.current) {
          toast.dismiss(activeToastIdRef.current);
          activeToastIdRef.current = null;
        }
        try {
          ringtoneAudioRef.current?.pause();
        } catch {}
      })
      .on("broadcast", { event: "call-declined" }, ({ payload }: any) => {
        if (payload?.toUserId !== currentUserId) return;
        console.log("[GlobalCallListener] Call declined by other user");
        // Dismiss toast and stop ringtone
        if (activeToastIdRef.current) {
          toast.dismiss(activeToastIdRef.current);
          activeToastIdRef.current = null;
        }
        try {
          ringtoneAudioRef.current?.pause();
        } catch {}
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          subscribed = true;
          console.log("[GlobalCallListener] Subscribed to", userChannelName);
        } else if (status === "CHANNEL_ERROR") {
          console.error("[GlobalCallListener] Channel error");
        }
      });

    return () => {
      try {
        const ch = channelRef.current || channel;
        const sb = supabaseRef.current || supabase;
        if (ch) {
          if (subscribed && sb && typeof sb.removeChannel === "function") {
            console.log(
              "[GlobalCallListener] Removing subscribed channel on cleanup",
              userChannelName
            );
            sb.removeChannel(ch);
          } else {
            try {
              console.log(
                "[GlobalCallListener] Unsubscribing channel on cleanup",
                userChannelName
              );
              ch.unsubscribe();
            } catch (e) {
              console.warn(
                "[GlobalCallListener] Failed to unsubscribe channel:",
                e
              );
            }
          }
        }
      } catch (e) {
        console.warn("[GlobalCallListener] Cleanup failed:", e);
      } finally {
        supabaseRef.current = null;
        channelRef.current = null;
        // Stop ringtone on cleanup
        try {
          ringtoneAudioRef.current?.pause();
        } catch {}
        // Dismiss active toast
        if (activeToastIdRef.current) {
          toast.dismiss(activeToastIdRef.current);
          activeToastIdRef.current = null;
        }
      }
    };
  }, [currentUserId, isCallModalOpen, incomingOffer, dispatch]);

  return null;
}
