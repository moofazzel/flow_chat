"use client";

import {
  getMediaConstraints,
  getRTCConfiguration,
  isWebRTCSupported,
} from "@/lib/webrtc-config";
import { createClient } from "@/utils/supabase/client";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";

// Generate unique session ID for debugging
const generateSessionId = () => Math.random().toString(36).substring(2, 8);

// Call sound URLs - using Web Audio API generated tones as fallback
const RINGTONE_FREQUENCY = 440; // A4 note
const RINGBACK_FREQUENCY = 480; // B4 note
const CALL_END_FREQUENCY = 300; // D#4 note

interface DirectCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callType: "audio" | "video";
  otherUser: {
    id: string;
    name: string;
    avatar: string;
  };
  currentUserId: string;
  currentUserName: string;
  threadId: string;
  isInitiator: boolean;
  incomingOffer?: RTCSessionDescriptionInit;
}

type CallStatus =
  | "initializing"
  | "calling"
  | "ringing"
  | "connected"
  | "ended"
  | "declined"
  | "missed"
  | "failed";

export function DirectCallModal({
  isOpen,
  onClose,
  callType,
  otherUser,
  currentUserId,
  currentUserName,
  threadId,
  isInitiator,
  incomingOffer,
}: DirectCallModalProps) {
  // Session ID for debugging
  const sessionIdRef = useRef<string>(generateSessionId());

  // Debug: Only log when modal is actually open (with session ID)
  useEffect(() => {
    if (isOpen) {
      console.log(
        `[DirectCall:${sessionIdRef.current}] Modal opened with props:`,
        {
          callType,
          otherUserId: otherUser.id,
          isInitiator,
          hasIncomingOffer: !!incomingOffer,
          threadId,
        }
      );
    }
  }, [isOpen, callType, otherUser.id, isInitiator, incomingOffer, threadId]);

  const [callStatus, setCallStatus] = useState<CallStatus>("initializing");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === "video");
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isChannelReady, setIsChannelReady] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const callStartTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidate[]>([]);

  // Sound refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneOscillatorRef = useRef<OscillatorNode | null>(null);
  const ringtoneIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const ringbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Key refs for preventing double cleanup and tracking call state
  const isInitializedRef = useRef(false);
  const isMountedRef = useRef(true);
  const isCleanedUpRef = useRef(false);
  const hasCallStartedRef = useRef(false);
  const userInitiatedEndRef = useRef(false);
  const initializationPromiseRef = useRef<Promise<void> | null>(null);

  // Store incoming offer in ref immediately
  useEffect(() => {
    if (incomingOffer) {
      incomingOfferRef.current = incomingOffer;
      console.log("[DirectCall] Stored incoming offer in ref");
    }
  }, [incomingOffer]);

  // Initialize audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play a simple tone
  const playTone = useCallback(
    (frequency: number, duration: number, volume: number = 0.3) => {
      try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = "sine";
        gainNode.gain.value = volume;

        // Fade out at the end
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          ctx.currentTime + duration
        );

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
      } catch (e) {
        console.warn("[DirectCall] Failed to play tone:", e);
      }
    },
    [getAudioContext]
  );

  // Start ringtone (incoming call) - plays a pattern
  const startRingtone = useCallback(() => {
    console.log("[DirectCall] Starting ringtone");
    // Clear existing intervals directly instead of calling stopAllSounds
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    if (ringbackIntervalRef.current) {
      clearInterval(ringbackIntervalRef.current);
      ringbackIntervalRef.current = null;
    }

    const playRingPattern = () => {
      // Play two quick tones
      playTone(RINGTONE_FREQUENCY, 0.3, 0.4);
      setTimeout(() => playTone(RINGTONE_FREQUENCY * 1.25, 0.3, 0.4), 350);
    };

    playRingPattern(); // Play immediately
    ringtoneIntervalRef.current = setInterval(playRingPattern, 2000); // Repeat every 2 seconds
  }, [playTone]);

  // Start ringback tone (outgoing call waiting for answer)
  const startRingback = useCallback(() => {
    console.log("[DirectCall] Starting ringback tone");
    // Clear existing intervals directly
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    if (ringbackIntervalRef.current) {
      clearInterval(ringbackIntervalRef.current);
      ringbackIntervalRef.current = null;
    }

    const playRingbackPattern = () => {
      playTone(RINGBACK_FREQUENCY, 0.8, 0.2);
    };

    playRingbackPattern();
    ringbackIntervalRef.current = setInterval(playRingbackPattern, 3000);
  }, [playTone]);

  // Play call connected sound
  const playConnectedSound = useCallback(() => {
    console.log("[DirectCall] Playing connected sound");
    playTone(523.25, 0.15, 0.3); // C5
    setTimeout(() => playTone(659.25, 0.15, 0.3), 150); // E5
    setTimeout(() => playTone(783.99, 0.2, 0.3), 300); // G5
  }, [playTone]);

  // Play call end sound
  const playEndSound = useCallback(() => {
    console.log("[DirectCall] Playing end sound");
    playTone(CALL_END_FREQUENCY, 0.3, 0.25);
    setTimeout(() => playTone(CALL_END_FREQUENCY * 0.8, 0.4, 0.2), 350);
  }, [playTone]);

  // Play declined sound
  const playDeclinedSound = useCallback(() => {
    console.log("[DirectCall] Playing declined sound");
    playTone(350, 0.2, 0.25);
    setTimeout(() => playTone(300, 0.2, 0.25), 250);
    setTimeout(() => playTone(250, 0.3, 0.2), 500);
  }, [playTone]);

  // Stop all sounds
  const stopAllSounds = useCallback(() => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    if (ringbackIntervalRef.current) {
      clearInterval(ringbackIntervalRef.current);
      ringbackIntervalRef.current = null;
    }
    if (ringtoneOscillatorRef.current) {
      try {
        ringtoneOscillatorRef.current.stop();
      } catch {
        // Oscillator may already be stopped
      }
      ringtoneOscillatorRef.current = null;
    }
  }, []);

  // Handle call status changes for sounds
  useEffect(() => {
    if (!isOpen) return;

    switch (callStatus) {
      case "ringing":
        startRingtone();
        break;
      case "calling":
        startRingback();
        break;
      case "connected":
        stopAllSounds();
        playConnectedSound();
        break;
      case "ended":
        stopAllSounds();
        playEndSound();
        break;
      case "declined":
        stopAllSounds();
        playDeclinedSound();
        break;
      case "failed":
        stopAllSounds();
        playEndSound();
        break;
      default:
        break;
    }

    return () => {
      // Don't stop sounds on every status change, only when component unmounts
    };
  }, [
    callStatus,
    isOpen,
    startRingtone,
    startRingback,
    playConnectedSound,
    playEndSound,
    playDeclinedSound,
    stopAllSounds,
  ]);

  const cleanup = useCallback(
    async (sendEndSignal: boolean = false) => {
      const sessionId = sessionIdRef.current;

      // Prevent double cleanup
      if (isCleanedUpRef.current) {
        console.log(`[DirectCall:${sessionId}] Already cleaned up, skipping`);
        return;
      }
      isCleanedUpRef.current = true;

      console.log(`[DirectCall:${sessionId}] Cleaning up...`, {
        sendEndSignal,
        hasCallStarted: hasCallStartedRef.current,
        hasChannel: !!channelRef.current,
      });

      // Stop all notification sounds
      stopAllSounds();

      // Only send call-end if user explicitly ended AND call had started
      if (sendEndSignal && hasCallStartedRef.current && channelRef.current) {
        console.log(`[DirectCall:${sessionId}] Sending call-end event`);
        try {
          await channelRef.current.send({
            type: "broadcast",
            event: "call-end",
            payload: {
              fromUserId: currentUserId,
              toUserId: otherUser.id,
              sessionId,
            },
          });
          // Small delay to ensure message is sent before cleanup
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (e) {
          console.warn(`[DirectCall:${sessionId}] Failed to send call-end:`, e);
        }
      }

      // Stop duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Stop all tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          console.log(`[DirectCall:${sessionId}] Stopped track:`, track.kind);
        });
        localStreamRef.current = null;
      }

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
        console.log(`[DirectCall:${sessionId}] Closed peer connection`);
      }

      // Unsubscribe from channel with proper removal
      if (channelRef.current && supabaseRef.current) {
        try {
          await supabaseRef.current.removeChannel(channelRef.current);
          console.log(`[DirectCall:${sessionId}] Removed channel`);
        } catch (e) {
          console.warn(
            `[DirectCall:${sessionId}] Failed to remove channel:`,
            e
          );
        }
        channelRef.current = null;
      }

      pendingIceCandidatesRef.current = [];
      setConnectionError(null);
    },
    [currentUserId, otherUser.id, stopAllSounds]
  );

  const startDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) return;
    callStartTimeRef.current = Date.now();
    durationIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - callStartTimeRef.current) / 1000
      );
      setCallDuration(elapsed);
    }, 1000);
  }, []);

  const handleEndCall = useCallback(async () => {
    console.log(`[DirectCall:${sessionIdRef.current}] User clicked end call`);
    userInitiatedEndRef.current = true;
    await cleanup(true); // Send end signal
    onClose();
  }, [cleanup, onClose]);

  const handleAnswer = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    const offer = incomingOfferRef.current;

    if (!peerConnectionRef.current || !offer) {
      console.error(
        `[DirectCall:${sessionId}] Cannot answer: no peer connection or offer`,
        {
          hasPc: !!peerConnectionRef.current,
          hasOffer: !!offer,
        }
      );
      toast.error("Cannot answer call - connection not ready");
      return;
    }

    try {
      console.log(`[DirectCall:${sessionId}] Answering call...`);

      // Check signaling state before setting remote description
      if (peerConnectionRef.current.signalingState !== "stable") {
        console.warn(
          `[DirectCall:${sessionId}] Unexpected signaling state:`,
          peerConnectionRef.current.signalingState
        );
      }

      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      console.log(
        `[DirectCall:${sessionId}] Remote description set from offer`
      );

      // Process pending ICE candidates
      console.log(
        `[DirectCall:${sessionId}] Processing ${pendingIceCandidatesRef.current.length} pending ICE candidates`
      );
      for (const candidate of pendingIceCandidatesRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(candidate);
        } catch (e) {
          console.warn(
            `[DirectCall:${sessionId}] Failed to add pending ICE candidate:`,
            e
          );
        }
      }
      pendingIceCandidatesRef.current = [];

      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      console.log(
        `[DirectCall:${sessionId}] Local description set with answer`
      );

      if (channelRef.current) {
        console.log(
          `[DirectCall:${sessionId}] Sending call-answer to:`,
          otherUser.id
        );
        await channelRef.current.send({
          type: "broadcast",
          event: "call-answer",
          payload: {
            answer,
            fromUserId: currentUserId,
            toUserId: otherUser.id,
            sessionId,
          },
        });
        console.log(`[DirectCall:${sessionId}] ✅ Answer sent successfully`);
      } else {
        console.error(
          `[DirectCall:${sessionId}] No channel available to send answer`
        );
        toast.error("Connection error - please try again");
        setCallStatus("failed");
        return;
      }

      setCallStatus("connected");
      startDurationTimer();
    } catch (error) {
      console.error(`[DirectCall:${sessionId}] Failed to answer call:`, error);
      toast.error("Failed to answer call");
      setCallStatus("failed");
      setConnectionError("Failed to answer");
    }
  }, [currentUserId, otherUser.id, startDurationTimer]);

  const handleDeclineCall = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    console.log(`[DirectCall:${sessionId}] Declining call`);
    userInitiatedEndRef.current = true;

    if (channelRef.current) {
      try {
        await channelRef.current.send({
          type: "broadcast",
          event: "call-declined",
          payload: {
            fromUserId: currentUserId,
            toUserId: otherUser.id,
            sessionId,
          },
        });
        // Small delay to ensure message is sent
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (e) {
        console.warn(`[DirectCall:${sessionId}] Failed to send decline:`, e);
      }
    }
    await cleanup(false); // Don't send end signal for decline
    onClose();
  }, [currentUserId, otherUser.id, cleanup, onClose]);

  // Main initialization effect
  useEffect(() => {
    if (!isOpen) return;

    // Check if already initialized or initialization in progress
    if (isInitializedRef.current || initializationPromiseRef.current) {
      console.log(
        `[DirectCall:${sessionIdRef.current}] Already initialized or initializing, skipping`
      );
      return;
    }

    // Generate new session ID for this call
    sessionIdRef.current = generateSessionId();
    const sessionId = sessionIdRef.current;

    // Reset flags for new call
    isCleanedUpRef.current = false;
    isMountedRef.current = true;
    isInitializedRef.current = true;
    hasCallStartedRef.current = false;
    userInitiatedEndRef.current = false;

    const initializeCall = async () => {
      console.log(`[DirectCall:${sessionId}] Initializing...`, {
        isInitiator,
        hasIncomingOffer: !!incomingOffer,
        callType,
        threadId,
      });

      if (!isWebRTCSupported()) {
        toast.error("Your browser doesn't support voice/video calls");
        setCallStatus("failed");
        setConnectionError("WebRTC not supported");
        return;
      }

      // Set initial status for receiver
      if (!isInitiator && incomingOffer) {
        incomingOfferRef.current = incomingOffer;
        setCallStatus("ringing");
        hasCallStartedRef.current = true;
      }

      try {
        // Request media access
        console.log(`[DirectCall:${sessionId}] Requesting media access...`);
        const constraints = getMediaConstraints(callType === "audio");
        let stream: MediaStream;

        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (mediaError: unknown) {
          console.error(
            `[DirectCall:${sessionId}] Media access failed:`,
            mediaError
          );
          const errorName =
            mediaError instanceof Error ? mediaError.name : "Unknown";
          if (errorName === "NotAllowedError") {
            toast.error(
              "Microphone access denied. Please allow access and try again."
            );
            setConnectionError("Microphone access denied");
          } else if (errorName === "NotFoundError") {
            toast.error("No microphone found. Please connect a microphone.");
            setConnectionError("No microphone found");
          } else {
            toast.error("Failed to access microphone");
            setConnectionError("Media access failed");
          }
          setCallStatus("failed");
          return;
        }

        if (!isMountedRef.current || isCleanedUpRef.current) {
          console.log(
            `[DirectCall:${sessionId}] Component unmounted during media request, cleaning up`
          );
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;
        console.log(
          `[DirectCall:${sessionId}] Got local stream:`,
          stream.getTracks().map((t) => t.kind)
        );

        if (localVideoRef.current && callType === "video") {
          localVideoRef.current.srcObject = stream;
        }

        // Initialize peer connection
        const pc = new RTCPeerConnection(getRTCConfiguration());
        peerConnectionRef.current = pc;

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Handle remote stream
        pc.ontrack = (event) => {
          console.log(
            `[DirectCall:${sessionId}] Received remote track:`,
            event.track.kind
          );
          remoteStreamRef.current = event.streams[0];

          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }

          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = event.streams[0];
            remoteAudioRef.current
              .play()
              .catch((e) =>
                console.warn(
                  `[DirectCall:${sessionId}] Audio autoplay blocked:`,
                  e
                )
              );
          }
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate && channelRef.current) {
            console.log(`[DirectCall:${sessionId}] Sending ICE candidate`);
            channelRef.current.send({
              type: "broadcast",
              event: "ice-candidate",
              payload: {
                candidate: event.candidate,
                fromUserId: currentUserId,
                toUserId: otherUser.id,
                sessionId,
              },
            });
          }
        };

        pc.oniceconnectionstatechange = () => {
          console.log(
            `[DirectCall:${sessionId}] ICE state:`,
            pc.iceConnectionState
          );
          if (pc.iceConnectionState === "failed") {
            console.error(`[DirectCall:${sessionId}] ICE connection failed`);
            setConnectionError("Connection failed - network issue");
          }
        };

        pc.onconnectionstatechange = () => {
          console.log(
            `[DirectCall:${sessionId}] Connection state:`,
            pc.connectionState
          );
          if (pc.connectionState === "connected") {
            setCallStatus("connected");
            setConnectionError(null);
            startDurationTimer();
            toast.success("Call connected!");
          } else if (pc.connectionState === "disconnected") {
            console.log(`[DirectCall:${sessionId}] Peer disconnected`);
            if (!isCleanedUpRef.current) {
              setConnectionError("Connection lost - trying to reconnect...");
              // Give some time for reconnection before giving up
              setTimeout(() => {
                if (
                  peerConnectionRef.current?.connectionState ===
                    "disconnected" &&
                  !isCleanedUpRef.current
                ) {
                  setCallStatus("ended");
                  toast.info("Call ended - connection lost");
                  cleanup(false);
                  onClose();
                }
              }, 5000);
            }
          } else if (pc.connectionState === "failed") {
            if (!isCleanedUpRef.current) {
              setCallStatus("failed");
              setConnectionError("Connection failed");
              toast.error("Call failed - could not establish connection");
              cleanup(false);
              onClose();
            }
          }
        };

        // For receiver, set isReady now since we have media and PC ready
        if (!isInitiator && incomingOffer) {
          console.log(
            `[DirectCall:${sessionId}] Receiver ready to answer (media + PC ready)`
          );
          setIsReady(true);
        }

        // Setup signaling channel with unique name to avoid conflicts
        const supabase = createClient();
        supabaseRef.current = supabase;

        // Use a unique channel name per call to avoid conflicts with the listener in EnhancedDirectMessageChat
        const channelName = `dm-call:${threadId}`;
        const channel = supabase.channel(channelName, {
          config: {
            broadcast: { self: false },
          },
        });
        channelRef.current = channel;

        channel
          .on("broadcast", { event: "call-answer" }, async ({ payload }) => {
            if (
              payload.toUserId !== currentUserId ||
              !peerConnectionRef.current
            ) {
              console.log(
                `[DirectCall:${sessionId}] Ignoring answer not for us`
              );
              return;
            }
            console.log(
              `[DirectCall:${sessionId}] Received answer from:`,
              payload.fromUserId
            );

            try {
              if (
                peerConnectionRef.current.signalingState !== "have-local-offer"
              ) {
                console.warn(
                  `[DirectCall:${sessionId}] Unexpected signaling state:`,
                  peerConnectionRef.current.signalingState
                );
                return;
              }

              await peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription(payload.answer)
              );
              console.log(`[DirectCall:${sessionId}] Remote description set`);

              // Process pending ICE candidates
              for (const candidate of pendingIceCandidatesRef.current) {
                try {
                  await peerConnectionRef.current.addIceCandidate(candidate);
                } catch (e) {
                  console.warn(
                    `[DirectCall:${sessionId}] Failed to add pending ICE candidate:`,
                    e
                  );
                }
              }
              pendingIceCandidatesRef.current = [];

              setCallStatus("connected");
              startDurationTimer();
            } catch (error) {
              console.error(
                `[DirectCall:${sessionId}] Failed to process answer:`,
                error
              );
              setConnectionError("Failed to process answer");
            }
          })
          .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
            if (payload.toUserId !== currentUserId) return;

            if (payload.candidate && peerConnectionRef.current) {
              const candidate = new RTCIceCandidate(payload.candidate);
              console.log(`[DirectCall:${sessionId}] Received ICE candidate`);

              if (peerConnectionRef.current.remoteDescription) {
                try {
                  await peerConnectionRef.current.addIceCandidate(candidate);
                } catch (e) {
                  console.warn(
                    `[DirectCall:${sessionId}] Failed to add ICE candidate:`,
                    e
                  );
                }
              } else {
                pendingIceCandidatesRef.current.push(candidate);
                console.log(
                  `[DirectCall:${sessionId}] Queued ICE candidate, total:`,
                  pendingIceCandidatesRef.current.length
                );
              }
            }
          })
          .on("broadcast", { event: "call-end" }, ({ payload }) => {
            if (payload.toUserId !== currentUserId) return;
            console.log(`[DirectCall:${sessionId}] Call ended by other user`);
            if (!isCleanedUpRef.current) {
              setCallStatus("ended");
              toast.info("Call ended by other user");
              cleanup(false);
              onClose();
            }
          })
          .on("broadcast", { event: "call-declined" }, ({ payload }) => {
            if (payload.toUserId !== currentUserId) return;
            console.log(`[DirectCall:${sessionId}] Call declined`);
            if (!isCleanedUpRef.current) {
              setCallStatus("declined");
              toast.info("Call was declined");
              setTimeout(() => {
                cleanup(false);
                onClose();
              }, 2000);
            }
          })
          .subscribe(async (status) => {
            console.log(`[DirectCall:${sessionId}] Channel status:`, status);

            if (status === "SUBSCRIBED") {
              console.log(
                `[DirectCall:${sessionId}] ✅ Successfully subscribed to signaling channel`
              );
              setIsChannelReady(true);

              // For initiator, send offer after channel is ready
              if (isInitiator && !hasCallStartedRef.current) {
                setIsReady(true);
                try {
                  setCallStatus("calling");

                  // Small delay to ensure receiver's channel is also ready
                  await new Promise((resolve) => setTimeout(resolve, 500));

                  if (!isMountedRef.current || isCleanedUpRef.current) {
                    console.log(
                      `[DirectCall:${sessionId}] Aborted - component unmounted`
                    );
                    return;
                  }

                  const offer = await pc.createOffer();
                  await pc.setLocalDescription(offer);

                  hasCallStartedRef.current = true;
                  console.log(
                    `[DirectCall:${sessionId}] 📞 Sending call-offer to:`,
                    otherUser.id
                  );

                  await channel.send({
                    type: "broadcast",
                    event: "call-offer",
                    payload: {
                      offer,
                      fromUserId: currentUserId,
                      fromUserName: currentUserName,
                      toUserId: otherUser.id,
                      callType,
                      sessionId,
                    },
                  });
                  console.log(
                    `[DirectCall:${sessionId}] ✅ Call offer sent successfully`
                  );
                } catch (error) {
                  console.error(
                    `[DirectCall:${sessionId}] Failed to create/send offer:`,
                    error
                  );
                  setCallStatus("failed");
                  setConnectionError("Failed to start call");
                  toast.error("Failed to start call");
                }
              } else if (!isInitiator) {
                console.log(
                  `[DirectCall:${sessionId}] Receiver channel subscribed - ready to answer`
                );
                setIsChannelReady(true);
              }
            } else if (status === "CHANNEL_ERROR") {
              console.error(`[DirectCall:${sessionId}] ❌ Channel error`);
              setCallStatus("failed");
              setConnectionError("Signaling channel error");
              toast.error("Connection failed - please try again");
            } else if (status === "TIMED_OUT") {
              console.error(`[DirectCall:${sessionId}] ❌ Channel timed out`);
              setCallStatus("failed");
              setConnectionError("Connection timed out");
              toast.error("Connection timed out - please try again");
            }
          });
      } catch (error) {
        console.error(
          `[DirectCall:${sessionId}] Initialization failed:`,
          error
        );
        toast.error("Failed to start call. Please check your permissions.");
        setCallStatus("failed");
        setConnectionError("Initialization failed");
      }
    };

    // Store the promise to prevent double initialization
    initializationPromiseRef.current = initializeCall();

    // Cleanup function
    return () => {
      console.log(`[DirectCall:${sessionId}] useEffect cleanup triggered`);
      isMountedRef.current = false;
      initializationPromiseRef.current = null;

      if (!userInitiatedEndRef.current && !isCleanedUpRef.current) {
        console.log(
          `[DirectCall:${sessionId}] Cleanup without user action - not sending call-end`
        );
        cleanup(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Stop all sounds when modal closes
      stopAllSounds();

      // Reset all state when modal closes
      isInitializedRef.current = false;
      initializationPromiseRef.current = null;
      setIsChannelReady(false);
      setCallStatus("initializing");
      setIsReady(false);
      setCallDuration(0);
      setConnectionError(null);
      setIsMuted(false);
      setIsVideoEnabled(callType === "video");
      setIsSpeakerOn(true);
    }
  }, [isOpen, callType, stopAllSounds]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current && callType === "video") {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleSpeaker = () => {
    const newValue = !isSpeakerOn;
    setIsSpeakerOn(newValue);
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !newValue;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !newValue;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getStatusText = () => {
    // Show connection error if any
    if (connectionError && callStatus !== "connected") {
      return connectionError;
    }

    // Show specific status for initiator waiting for channel
    if (isInitiator && callStatus === "initializing" && !isChannelReady) {
      return "Setting up connection...";
    }

    switch (callStatus) {
      case "initializing":
        return "Connecting...";
      case "calling":
        return `Calling ${otherUser.name}...`;
      case "ringing":
        return `Incoming ${callType} call...`;
      case "connected":
        return formatDuration(callDuration);
      case "ended":
        return "Call ended";
      case "declined":
        return "Call declined";
      case "missed":
        return "Call missed";
      case "failed":
        return connectionError || "Call failed";
      default:
        return "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div className="relative w-full max-w-2xl bg-[#1e1f22] rounded-xl shadow-2xl overflow-hidden border border-[#2b2d31]">
        <button
          onClick={handleEndCall}
          className="absolute top-4 right-4 z-10 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          <X size={20} />
        </button>

        <div className="relative aspect-video bg-linear-to-b from-[#1a1b1e] to-[#141517]">
          {callType === "video" ? (
            <>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 right-4 w-32 h-24 bg-[#1e1f22] rounded-lg overflow-hidden border-2 border-[#5865f2]/30 shadow-lg">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="relative">
                  <Avatar className="h-32 w-32 mx-auto mb-4 ring-4 ring-[#5865f2]/20">
                    <AvatarFallback className="bg-linear-to-br from-[#5865f2] to-[#4752c4] text-white text-4xl font-semibold">
                      {otherUser.avatar}
                    </AvatarFallback>
                  </Avatar>
                  {callStatus === "ringing" && (
                    <div className="absolute inset-0 animate-ping">
                      <div className="h-32 w-32 mx-auto rounded-full bg-[#5865f2]/20" />
                    </div>
                  )}
                </div>
                <h3 className="text-white text-2xl font-semibold mb-2">
                  {otherUser.name}
                </h3>
                <p className="text-gray-400 text-lg">{getStatusText()}</p>
                {callStatus === "ringing" && (
                  <p className="text-[#57f287] text-sm mt-3 font-medium flex items-center justify-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#57f287] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#57f287]"></span>
                    </span>
                    Incoming {callType} call
                  </p>
                )}
              </div>
            </div>
          )}

          {callStatus === "connected" && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#57f287]/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-[#57f287]/30">
              <div className="w-2 h-2 rounded-full bg-[#57f287] shadow-[0_0_8px_rgba(87,242,135,0.5)]" />
              <span className="text-[#57f287] text-xs font-medium">
                Connected
              </span>
            </div>
          )}
        </div>

        <div className="p-6 bg-[#2b2d31]">
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={toggleMute}
              variant="ghost"
              size="lg"
              className={`rounded-full w-14 h-14 transition-all duration-200 ${
                isMuted
                  ? "bg-[#ed4245] hover:bg-[#c53b3e] text-white shadow-[0_0_12px_rgba(237,66,69,0.4)]"
                  : "bg-[#313338] hover:bg-[#404249] text-gray-200 border border-[#404249]"
              }`}
            >
              {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </Button>

            {callType === "video" && (
              <Button
                onClick={toggleVideo}
                variant="ghost"
                size="lg"
                className={`rounded-full w-14 h-14 transition-all duration-200 ${
                  !isVideoEnabled
                    ? "bg-[#ed4245] hover:bg-[#c53b3e] text-white shadow-[0_0_12px_rgba(237,66,69,0.4)]"
                    : "bg-[#313338] hover:bg-[#404249] text-gray-200 border border-[#404249]"
                }`}
              >
                {isVideoEnabled ? <Video size={22} /> : <VideoOff size={22} />}
              </Button>
            )}

            {/* Answer button for receiver */}
            {callStatus === "ringing" && !isInitiator && (
              <Button
                onClick={handleAnswer}
                variant="ghost"
                size="lg"
                className="rounded-full w-14 h-14 bg-[#57f287] hover:bg-[#3ba55c] text-white animate-pulse shadow-[0_0_20px_rgba(87,242,135,0.5)] transition-all duration-200"
                disabled={!isReady}
              >
                <Phone size={22} />
              </Button>
            )}

            {/* End/Decline call button */}
            <Button
              onClick={
                callStatus === "ringing" && !isInitiator
                  ? handleDeclineCall
                  : handleEndCall
              }
              variant="ghost"
              size="lg"
              className="rounded-full w-14 h-14 bg-[#ed4245] hover:bg-[#c53b3e] text-white shadow-[0_0_12px_rgba(237,66,69,0.4)] transition-all duration-200"
            >
              <PhoneOff size={22} />
            </Button>

            <Button
              onClick={toggleSpeaker}
              variant="ghost"
              size="lg"
              className={`rounded-full w-14 h-14 transition-all duration-200 ${
                !isSpeakerOn
                  ? "bg-[#ed4245] hover:bg-[#c53b3e] text-white shadow-[0_0_12px_rgba(237,66,69,0.4)]"
                  : "bg-[#313338] hover:bg-[#404249] text-gray-200 border border-[#404249]"
              }`}
            >
              {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
            </Button>
          </div>

          <div className="text-center mt-4">
            <p className="text-gray-400 text-sm font-medium">
              {getStatusText()}
            </p>
            {!isReady && callStatus === "ringing" && (
              <p className="text-[#faa61a] text-xs mt-2 flex items-center justify-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#faa61a] animate-pulse" />
                Setting up connection...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
