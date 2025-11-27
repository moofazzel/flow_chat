"use client";

import { getCurrentUser } from "@/utils/auth";
import { createClient } from "@/utils/supabase/client";
import {
  Mic,
  MicOff,
  PhoneOff,
  Settings,
  Users,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Slider } from "./ui/slider";

interface VoiceChannelPanelProps {
  channelId: string;
  channelName: string;
  onLeave: () => void;
}

interface VoiceParticipant {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isVideoEnabled: boolean;
}

export function VoiceChannelPanel({
  channelId,
  channelName,
  onLeave,
}: VoiceChannelPanelProps) {
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [volume, setVolume] = useState([75]);
  const [showSettings, setShowSettings] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
    full_name: string;
  } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Play join/leave sound
  const playSound = useCallback((frequency: number, duration: number) => {
    try {
      const audioContext = new (window.AudioContext ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + duration
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.error("Failed to play sound:", error);
    }
  }, []);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const isMutedRef = useRef(isMuted);
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const remoteAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(
    new Map()
  );
  const hasJoinedRef = useRef(false);
  const isJoiningRef = useRef(false);
  const processedUserListRef = useRef<Set<string>>(new Set());
  const processedAnswersRef = useRef<Set<string>>(new Set()); // Track processed answers
  const processedOffersRef = useRef<Set<string>>(new Set()); // Track processed offers
  const isCleaningUpRef = useRef(false);
  const participantsRef = useRef<VoiceParticipant[]>([]); // Track current participants for closures
  const supabase = createClient();

  // Keep participantsRef in sync with participants state
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  // Helper functions for participant management
  const addParticipant = (participant: {
    userId: string;
    username: string;
    full_name: string;
    isMuted: boolean;
    isDeafened: boolean;
    isVideoEnabled: boolean;
  }) => {
    console.log(
      "Adding participant to UI:",
      participant.full_name,
      participant.userId
    );
    setParticipants((prev) => {
      if (prev.find((p) => p.id === participant.userId)) {
        console.log("Participant already exists, skipping");
        return prev;
      }
      const newList = [
        ...prev,
        {
          id: participant.userId,
          username: participant.username,
          full_name: participant.full_name,
          isMuted: participant.isMuted,
          isDeafened: participant.isDeafened,
          isSpeaking: false,
          isVideoEnabled: participant.isVideoEnabled,
        },
      ];
      console.log(
        "Participant list updated:",
        newList.length,
        "participants",
        newList.map((p) => p.full_name)
      );
      return newList;
    });
  };

  const removeParticipant = (userId: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== userId));
  };

  const updateParticipant = (update: {
    userId: string;
    isMuted?: boolean;
    isDeafened?: boolean;
    isVideoEnabled?: boolean;
  }) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === update.userId
          ? {
              ...p,
              isMuted: update.isMuted ?? p.isMuted,
              isDeafened: update.isDeafened ?? p.isDeafened,
              isVideoEnabled: update.isVideoEnabled ?? p.isVideoEnabled,
            }
          : p
      )
    );
  };

  const setSpeaking = (userId: string, isSpeaking: boolean) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === userId ? { ...p, isSpeaking } : p))
    );
  };

  // Participants state tracking (logging removed to prevent render spam)

  // WebRTC peer connection management
  const createPeerConnection = useCallback(
    (userId: string) => {
      // Return existing connection if available
      const existingPc = peerConnectionsRef.current.get(userId);
      if (
        existingPc &&
        existingPc.connectionState !== "closed" &&
        existingPc.connectionState !== "failed"
      ) {
        console.log(
          "♻️ [WEBRTC] Reusing existing peer connection for:",
          userId
        );
        return existingPc;
      }

      console.log(
        "🔧 [WEBRTC] Creating NEW peer connection for userId:",
        userId
      );
      const iceServers: RTCConfiguration = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      };
      const pc = new RTCPeerConnection(iceServers);

      // Add local stream tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          if (localStreamRef.current) {
            pc.addTrack(track, localStreamRef.current);
          }
        });
      }

      // Handle incoming remote tracks
      pc.ontrack = (event) => {
        console.log(
          "🎵 [TRACK] Received remote track from:",
          userId,
          "| kind:",
          event.track.kind,
          "| enabled:",
          event.track.enabled,
          "| readyState:",
          event.track.readyState,
          "| streams:",
          event.streams.length
        );
        const remoteStream = event.streams[0];
        remoteStreamsRef.current.set(userId, remoteStream);

        // Create and play audio element for remote stream
        const audio = new Audio();
        audio.srcObject = remoteStream;
        audio.autoplay = true;
        audio.volume = volume[0] / 100; // Use volume from slider

        console.log(
          "🔊 [AUDIO] Creating element for:",
          userId,
          "| stream active:",
          remoteStream.active,
          "| tracks:",
          remoteStream.getTracks().map((t) => ({
            kind: t.kind,
            id: t.id,
            enabled: t.enabled,
            muted: t.muted,
            readyState: t.readyState,
          }))
        );

        // Store the audio element to prevent garbage collection
        remoteAudioElementsRef.current.set(userId, audio);

        audio
          .play()
          .then(() => {
            console.log(
              "✅ [AUDIO] Successfully playing for:",
              userId,
              "| paused:",
              audio.paused,
              "| volume:",
              audio.volume,
              "| currentTime:",
              audio.currentTime
            );
          })
          .catch((err) => {
            console.error(
              "❌ [AUDIO] Play failed for:",
              userId,
              "| error:",
              err.name,
              err.message,
              "| readyState:",
              audio.readyState
            );
            toast.error("Failed to play audio from " + userId);
          });
      };

      // Handle ICE candidates
      // Handle ICE connection state changes
      pc.oniceconnectionstatechange = () => {
        console.log(
          "🧊 [ICE-CONNECTION-STATE] With",
          userId,
          ":",
          pc.iceConnectionState,
          "| Gathering:",
          pc.iceGatheringState
        );
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && channelRef.current) {
          console.log(
            "🧊 [ICE] Sending candidate to:",
            userId,
            "| type:",
            event.candidate.type,
            "| protocol:",
            event.candidate.protocol
          );
          channelRef.current.send({
            type: "broadcast",
            event: "ice-candidate",
            payload: {
              candidate: event.candidate,
              fromUserId: currentUser?.id,
              toUserId: userId,
            },
          });
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log(
          "🔌 [CONNECTION-STATE] With",
          userId,
          ":",
          pc.connectionState,
          "| ICE:",
          pc.iceConnectionState,
          "| Signaling:",
          pc.signalingState
        );
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          pc.close();
          peerConnectionsRef.current.delete(userId);
          remoteStreamsRef.current.delete(userId);
        }
      };

      peerConnectionsRef.current.set(userId, pc);
      return pc;
    },
    [currentUser?.id, volume]
  );

  // Track sent offers to prevent duplicates
  const sentOffersRef = useRef<Set<string>>(new Set());

  const createOffer = useCallback(
    async (userId: string) => {
      // Prevent sending duplicate offers
      if (sentOffersRef.current.has(userId)) {
        console.log("⏭️ [OFFER] Already sent offer to:", userId);
        return;
      }
      sentOffersRef.current.add(userId);

      console.log("📤 [OFFER] Creating offer for userId:", userId);
      const pc = createPeerConnection(userId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log(
        "📤 [OFFER] Created and set local description:",
        "| type:",
        offer.type,
        "| signalingState:",
        pc.signalingState
      );

      if (channelRef.current) {
        console.log("📡 [OFFER] Sending offer to:", userId);
        channelRef.current.send({
          type: "broadcast",
          event: "webrtc-offer",
          payload: {
            offer,
            fromUserId: currentUser?.id,
            toUserId: userId,
          },
        });
      }
    },
    [createPeerConnection, currentUser?.id]
  );

  const handleOffer = useCallback(
    async (offer: RTCSessionDescriptionInit, fromUserId: string) => {
      // Check if we already processed an offer from this user
      if (processedOffersRef.current.has(fromUserId)) {
        console.log("⏭️ [OFFER] Already processed offer from:", fromUserId);
        return;
      }
      processedOffersRef.current.add(fromUserId);

      console.log(
        "📥 [ANSWER] Received offer from:",
        fromUserId,
        "| offer type:",
        offer.type
      );
      const pc = createPeerConnection(fromUserId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log(
        "📤 [ANSWER] Created and set local description:",
        "| type:",
        answer.type,
        "| signalingState:",
        pc.signalingState
      );

      if (channelRef.current) {
        console.log("📡 [ANSWER] Sending answer to:", fromUserId);
        channelRef.current.send({
          type: "broadcast",
          event: "webrtc-answer",
          payload: {
            answer,
            fromUserId: currentUser?.id,
            toUserId: fromUserId,
          },
        });
      }
    },
    [createPeerConnection, currentUser?.id]
  );

  const handleAnswer = useCallback(
    async (answer: RTCSessionDescriptionInit, fromUserId: string) => {
      console.log(
        "📥 [ANSWER-RECEIVED] From:",
        fromUserId,
        "| answer type:",
        answer.type
      );

      // Check if we already processed this answer
      if (processedAnswersRef.current.has(fromUserId)) {
        console.log("⏭️ [ANSWER] Already processed answer from:", fromUserId);
        return;
      }

      const pc = peerConnectionsRef.current.get(fromUserId);
      if (!pc) {
        console.log(
          "❌ [ANSWER-RECEIVED] No peer connection found for:",
          fromUserId
        );
        return;
      }

      // Only set remote description if in correct state
      if (pc.signalingState === "have-local-offer") {
        processedAnswersRef.current.add(fromUserId); // Mark as processed
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          console.log("✅ Set remote answer for:", fromUserId);
        } catch (error) {
          console.error("❌ Failed to set remote answer:", error);
        }
      } else if (pc.signalingState === "stable" && pc.remoteDescription) {
        console.log(
          `⚠️ Already in stable state with remote description for ${fromUserId}, ignoring duplicate answer`
        );
      } else {
        console.log(
          `⚠️ Ignoring answer, wrong state (${pc.signalingState}) for:`,
          fromUserId
        );
      }
    },
    []
  );

  const handleIceCandidate = useCallback(
    async (candidate: RTCIceCandidateInit, fromUserId: string) => {
      console.log(
        "🧊 [ICE-CANDIDATE] Received from:",
        fromUserId,
        "| signalingState:",
        peerConnectionsRef.current.get(fromUserId)?.signalingState
      );
      const pc = peerConnectionsRef.current.get(fromUserId);
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("✅ [ICE-CANDIDATE] Added successfully for:", fromUserId);
        } catch (error) {
          console.error(
            "❌ [ICE-CANDIDATE] Failed to add for:",
            fromUserId,
            error
          );
        }
      } else {
        console.log(
          "❌ [ICE-CANDIDATE] No peer connection found for:",
          fromUserId
        );
      }
    },
    []
  );

  const handleLeaveChannel = useCallback(async () => {
    console.log(
      "🚪 handleLeaveChannel called - hasJoined:",
      hasJoinedRef.current,
      "isJoining:",
      isJoiningRef.current,
      "isCleaning:",
      isCleaningUpRef.current
    );

    // Prevent duplicate cleanup
    if (isCleaningUpRef.current) {
      console.log("⚠️ Already cleaning up, skipping");
      return;
    }
    isCleaningUpRef.current = true;

    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    // Stop and remove all remote audio elements
    remoteAudioElementsRef.current.forEach((audio) => {
      audio.pause();
      audio.srcObject = null;
    });
    remoteAudioElementsRef.current.clear();

    // Only broadcast leave if we actually joined
    if (hasJoinedRef.current && currentUser && channelRef.current) {
      console.log("🚪 Broadcasting leave event");
      channelRef.current.send({
        type: "broadcast",
        event: "user-left",
        payload: {
          userId: currentUser.id,
        },
      });
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setIsConnected(false);
    setParticipants([]);
    hasJoinedRef.current = false;
    isJoiningRef.current = false;
    processedUserListRef.current.clear();
    processedAnswersRef.current.clear();
    processedOffersRef.current.clear();
    sentOffersRef.current.clear(); // Clear sent offers
    isCleaningUpRef.current = false;
    onLeave();
  }, [currentUser, supabase, onLeave]);

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };
    loadUser();
  }, []);

  // Join voice channel
  useEffect(() => {
    console.log(
      "🎤 VoiceChannelPanel useEffect triggered - currentUser:",
      currentUser?.full_name,
      "channelId:",
      channelId,
      "isJoining:",
      isJoiningRef.current,
      "hasJoined:",
      hasJoinedRef.current
    );
    if (!currentUser) return;

    // Prevent duplicate join attempts
    if (isJoiningRef.current || hasJoinedRef.current) {
      console.log(
        "⚠️ Already joining or joined, skipping - isJoining:",
        isJoiningRef.current,
        "hasJoined:",
        hasJoinedRef.current
      );
      return;
    }

    const joinVoiceChannel = async () => {
      console.log("🚀 Starting joinVoiceChannel");
      isJoiningRef.current = true;
      setIsConnecting(true);
      try {
        // Get user media (audio only initially)
        console.log("📹 Requesting media access...");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        console.log(
          "✅ [MEDIA] Access granted:",
          "| tracks:",
          stream.getTracks().length,
          "| details:",
          stream.getTracks().map((t) => ({
            kind: t.kind,
            id: t.id,
            enabled: t.enabled,
            muted: t.muted,
            readyState: t.readyState,
          }))
        );
        localStreamRef.current = stream;

        // Setup audio analysis for speaking detection
        audioContextRef.current = new AudioContext();
        const audioSource =
          audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        audioSource.connect(analyserRef.current);

        // Start speaking detection (throttled to 1 update/sec)
        let lastSpeakingBroadcast = 0;
        let lastSpeakingState = false;
        const SPEAKING_BROADCAST_THROTTLE = 1000; // 1 second

        const detectSpeaking = () => {
          if (!analyserRef.current || !channelRef.current) return;

          const dataArray = new Uint8Array(
            analyserRef.current.frequencyBinCount
          );
          analyserRef.current.getByteFrequencyData(dataArray);

          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          const isSpeaking = average > 10 && !isMutedRef.current; // Threshold for speaking

          // Broadcast speaking status (throttled and only on state change)
          const now = Date.now();
          if (
            (isSpeaking !== lastSpeakingState ||
              now - lastSpeakingBroadcast > SPEAKING_BROADCAST_THROTTLE) &&
            channelRef.current
          ) {
            lastSpeakingState = isSpeaking;
            lastSpeakingBroadcast = now;
            channelRef.current.send({
              type: "broadcast",
              event: "speaking",
              payload: {
                userId: currentUser.id,
                isSpeaking,
              },
            });
          }

          requestAnimationFrame(detectSpeaking);
        };
        detectSpeaking();

        // Mute by default if user had muted before
        if (isMuted) {
          stream.getAudioTracks().forEach((track) => {
            track.enabled = false;
          });
        }

        // Broadcast join to channel
        const channel = supabase.channel(`voice:${channelId}`, {
          config: {
            broadcast: { self: false },
          },
        });
        channelRef.current = channel;

        await channel
          .on("broadcast", { event: "user-joined" }, ({ payload }) => {
            const userId = payload.userId;
            const userName = payload.full_name;

            // Skip if it's ourselves
            if (userId === currentUser.id) return;

            // Check both processed list AND current participants to prevent duplicates
            const alreadyProcessed = processedUserListRef.current.has(userId);
            const alreadyInParticipants = participantsRef.current.some(
              (p) => p.id === userId
            );

            if (alreadyProcessed || alreadyInParticipants) {
              console.log("⏭️ User already in channel:", userName);
              return;
            }

            console.log("👋 User joined:", userName);
            processedUserListRef.current.add(userId);
            addParticipant(payload);

            // Play join sound (ascending tone)
            playSound(800, 0.15);

            // Only initiate WebRTC if our ID is lexicographically greater (prevents duplicate offers)
            if (currentUser.id.localeCompare(userId) > 0) {
              console.log("📞 Initiating WebRTC offer to:", userName);
              createOffer(userId);
            } else {
              console.log("⏳ Waiting for offer from:", userName);
            }
          })
          .on("broadcast", { event: "user-left" }, ({ payload }) => {
            console.log("👋 User left:", payload.full_name || payload.userId);
            removeParticipant(payload.userId);

            // Play leave sound (descending tone)
            playSound(400, 0.15);

            // Clean up peer connection
            const pc = peerConnectionsRef.current.get(payload.userId);
            if (pc) {
              pc.close();
              peerConnectionsRef.current.delete(payload.userId);
            }
            remoteStreamsRef.current.delete(payload.userId);
          })
          .on("broadcast", { event: "user-updated" }, ({ payload }) => {
            console.log("User updated:", payload);
            updateParticipant(payload);
          })
          .on("broadcast", { event: "speaking" }, ({ payload }) => {
            setSpeaking(payload.userId, payload.isSpeaking);
          })
          .on("broadcast", { event: "webrtc-offer" }, ({ payload }) => {
            console.log("Received WebRTC offer from:", payload.fromUserId);
            if (payload.toUserId === currentUser.id) {
              handleOffer(payload.offer, payload.fromUserId);
            }
          })
          .on("broadcast", { event: "webrtc-answer" }, ({ payload }) => {
            console.log("Received WebRTC answer from:", payload.fromUserId);
            if (payload.toUserId === currentUser.id) {
              handleAnswer(payload.answer, payload.fromUserId);
            }
          })
          .on("broadcast", { event: "ice-candidate" }, ({ payload }) => {
            if (payload.toUserId === currentUser.id) {
              handleIceCandidate(payload.candidate, payload.fromUserId);
            }
          })
          .on("broadcast", { event: "request-users" }, ({ payload }) => {
            // Respond to new user with our info
            console.log(
              "📝 [REQUEST-USERS] From:",
              payload.requesterId,
              "| My ID:",
              currentUser.id
            );
            if (payload.requesterId !== currentUser.id) {
              console.log(
                "📤 [USER-LIST] Responding with my info to:",
                payload.requesterId
              );
              channel.send({
                type: "broadcast",
                event: "user-list",
                payload: {
                  userId: currentUser.id,
                  username: currentUser.username,
                  full_name: currentUser.full_name,
                  isMuted: isMuted,
                  isDeafened: isDeafened,
                  isVideoEnabled: isVideoEnabled,
                  respondingTo: payload.requesterId,
                },
              });
            }
          })
          .on("broadcast", { event: "user-list" }, ({ payload }) => {
            // Receive existing user info
            // Only process if this response was meant for us AND it's not our own message
            if (
              payload.respondingTo === currentUser.id &&
              payload.userId !== currentUser.id
            ) {
              // Check if we've already processed this user
              if (processedUserListRef.current.has(payload.userId)) {
                console.log("⏭️ Already processed user:", payload.full_name);
                return;
              }

              console.log("👤 Received existing user:", payload);
              processedUserListRef.current.add(payload.userId);
              addParticipant(payload);

              // Check if we already have a peer connection with this user
              if (peerConnectionsRef.current.has(payload.userId)) {
                console.log(
                  "⏭️ Peer connection already exists for:",
                  payload.full_name
                );
                return;
              }

              // Only initiate WebRTC if our ID is lexicographically greater (prevents duplicate offers)
              if (currentUser.id.localeCompare(payload.userId) > 0) {
                console.log(
                  "📞 Initiating WebRTC offer to existing user:",
                  payload.full_name
                );
                createOffer(payload.userId);
              } else {
                console.log(
                  "⏳ Waiting for offer from existing user:",
                  payload.full_name
                );
              }
            }
          })
          .subscribe(async (status) => {
            console.log(
              "📡 [SUBSCRIPTION] Status:",
              status,
              "| Channel ID:",
              channelId,
              "| User:",
              currentUser.full_name
            );
            if (status === "SUBSCRIBED") {
              console.log("🎉 Subscribed to channel, broadcasting join");
              // First, request list of existing users
              console.log(
                "📝 [BROADCAST] Requesting existing users:",
                "| My ID:",
                currentUser.id
              );
              channel.send({
                type: "broadcast",
                event: "request-users",
                payload: {
                  requesterId: currentUser.id,
                },
              });

              // Then announce our join
              console.log(
                "📣 [BROADCAST] Announcing join to channel:",
                "| User:",
                currentUser.full_name,
                "| ID:",
                currentUser.id
              );
              channel.send({
                type: "broadcast",
                event: "user-joined",
                payload: {
                  userId: currentUser.id,
                  username: currentUser.username,
                  full_name: currentUser.full_name,
                  isMuted: isMuted,
                  isDeafened: isDeafened,
                  isVideoEnabled: isVideoEnabled,
                },
              });

              // Only update state if not cleaning up
              if (!isCleaningUpRef.current) {
                setIsConnecting(false);
                setIsConnected(true);
                hasJoinedRef.current = true;
                isJoiningRef.current = false;
                console.log(
                  "✅ [JOIN] Successfully joined voice channel:",
                  channelName,
                  "| User:",
                  currentUser.full_name,
                  "| Participants:",
                  participants.length
                );

                // Play join sound (double ascending tone)
                playSound(600, 0.1);
                setTimeout(() => playSound(800, 0.1), 100);

                toast.success(`Joined ${channelName}`);
              } else {
                console.log("⚠️ Component cleaning up, skipping state updates");
              }
            }
          });
      } catch (error) {
        console.error("Failed to join voice channel:", error);
        toast.error("Failed to access microphone. Please grant permission.");
        setIsConnecting(false);
        isJoiningRef.current = false;
        onLeave(); // Exit if can't get microphone
      }
    };

    let isMounted = true;
    let cleanupExecuted = false;

    const join = async () => {
      if (isMounted && !cleanupExecuted) {
        await joinVoiceChannel();
      }
    };

    join();

    // Cleanup on unmount
    return () => {
      if (!cleanupExecuted) {
        console.log("🧹 VoiceChannelPanel cleanup function called");
        cleanupExecuted = true;
        isMounted = false;
        // Only cleanup if actually joined
        if (hasJoinedRef.current) {
          handleLeaveChannel();
        } else {
          // Reset flags if cleanup happens during join
          isJoiningRef.current = false;
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, channelId, channelName]);

  const handleToggleMute = async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    isMutedRef.current = newMuted;

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !newMuted;
      });
    }

    // Broadcast update
    if (currentUser && channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "user-updated",
        payload: {
          userId: currentUser.id,
          isMuted: newMuted,
        },
      });
    }

    toast.success(newMuted ? "Microphone muted" : "Microphone unmuted");
  };

  const handleToggleDeafen = () => {
    const newDeafened = !isDeafened;
    setIsDeafened(newDeafened);

    // If deafening, also mute
    if (newDeafened && !isMuted) {
      setIsMuted(true);
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
      }
    }

    toast.success(newDeafened ? "Audio deafened" : "Audio undeafened");
  };

  const handleToggleVideo = async () => {
    const newVideoEnabled = !isVideoEnabled;
    setIsVideoEnabled(newVideoEnabled);

    try {
      if (newVideoEnabled) {
        // Add video track
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoStream.getVideoTracks().forEach((track) => {
          localStreamRef.current?.addTrack(track);
        });
      } else {
        // Remove video track
        localStreamRef.current?.getVideoTracks().forEach((track) => {
          track.stop();
          localStreamRef.current?.removeTrack(track);
        });
      }

      // Broadcast update
      if (currentUser && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "user-updated",
          payload: {
            userId: currentUser.id,
            isVideoEnabled: newVideoEnabled,
          },
        });
      }

      toast.success(newVideoEnabled ? "Video enabled" : "Video disabled");
    } catch (error) {
      console.error("Failed to toggle video:", error);
      toast.error("Failed to access camera");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Don't render until user is loaded
  if (!currentUser) {
    return (
      <div className="fixed bottom-0 left-[72px] right-0 bg-[#232428] border-t border-[#1e1f22] z-50">
        <div className="h-16 px-4 flex items-center justify-center">
          <div className="text-gray-400">Loading voice channel...</div>
        </div>
      </div>
    );
  }

  // Removed render logging to prevent spam

  return (
    <div className="fixed bottom-0 left-[72px] right-0 bg-[#232428] border-t border-[#1e1f22] z-50">
      <div className="h-16 px-4 flex items-center justify-between">
        {/* Left: Channel Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#1e1f22] rounded relative">
              <Volume2 size={18} className="text-gray-400" />
              {isConnected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#232428]" />
              )}
            </div>
            <div>
              <div className="text-white text-sm font-semibold flex items-center gap-2">
                {channelName}
                {isConnected && (
                  <span className="text-xs text-green-500 font-normal">
                    Connected
                  </span>
                )}
              </div>
              <div className="text-gray-400 text-xs flex items-center gap-1">
                <Users size={12} />
                <span className="font-medium text-white">
                  {participants.length + 1}
                </span>{" "}
                member{participants.length !== 0 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Voice Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleMute}
            className={`h-9 w-9 p-0 ${
              isMuted
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-[#35363c]"
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleDeafen}
            className={`h-9 w-9 p-0 ${
              isDeafened
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-[#35363c]"
            }`}
            title={isDeafened ? "Undeafen" : "Deafen"}
          >
            {isDeafened ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleVideo}
            className={`h-9 w-9 p-0 ${
              isVideoEnabled
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-[#35363c]"
            }`}
            title={isVideoEnabled ? "Disable Video" : "Enable Video"}
          >
            {isVideoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
          </Button>

          <Separator orientation="vertical" className="h-6 bg-[#3f4147]" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowParticipants(!showParticipants)}
            className={`h-9 w-9 p-0 ${
              showParticipants
                ? "bg-[#5865f2] text-white"
                : "text-gray-400 hover:text-white hover:bg-[#35363c]"
            }`}
            title="Show Participants"
          >
            <Users size={18} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className={`h-9 w-9 p-0 ${
              showSettings
                ? "bg-[#5865f2] text-white"
                : "text-gray-400 hover:text-white hover:bg-[#35363c]"
            }`}
            title="Voice Settings"
          >
            <Settings size={18} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeaveChannel}
            className="h-9 px-4 bg-red-500 hover:bg-red-600 text-white gap-2"
            title="Disconnect"
          >
            <PhoneOff size={18} />
            <span className="text-sm">Disconnect</span>
          </Button>
        </div>

        {/* Right: Participants */}
        <div className="flex items-center gap-2">
          <ScrollArea className="max-w-md">
            <div className="flex items-center gap-2">
              {/* Current user */}
              <div className="relative group">
                <Avatar
                  className={`h-8 w-8 border-2 ${
                    isConnected ? "border-green-500" : "border-gray-500"
                  }`}
                >
                  <AvatarFallback className="bg-[#5865f2] text-white text-xs">
                    {getInitials(currentUser.full_name)}
                  </AvatarFallback>
                </Avatar>
                {isMuted && (
                  <div className="absolute -bottom-1 -right-1 p-0.5 bg-red-500 rounded-full">
                    <MicOff size={10} className="text-white" />
                  </div>
                )}
                {isDeafened && (
                  <div className="absolute -top-1 -right-1 p-0.5 bg-gray-700 rounded-full">
                    <VolumeX size={10} className="text-white" />
                  </div>
                )}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {currentUser.full_name} (You)
                </div>
              </div>

              {/* Other participants */}
              {participants.map((participant) => (
                <div key={participant.id} className="relative group">
                  <Avatar
                    className={`h-8 w-8 border-2 transition-all ${
                      participant.isSpeaking
                        ? "border-green-500 shadow-lg shadow-green-500/50"
                        : "border-gray-600"
                    }`}
                  >
                    <AvatarFallback className="bg-[#5865f2] text-white text-xs">
                      {getInitials(participant.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  {participant.isMuted && (
                    <div className="absolute -bottom-1 -right-1 p-0.5 bg-red-500 rounded-full">
                      <MicOff size={10} className="text-white" />
                    </div>
                  )}
                  {participant.isDeafened && (
                    <div className="absolute -top-1 -right-1 p-0.5 bg-gray-700 rounded-full">
                      <VolumeX size={10} className="text-white" />
                    </div>
                  )}
                  {participant.isVideoEnabled && (
                    <div className="absolute -top-1 -left-1 p-0.5 bg-blue-500 rounded-full">
                      <Video size={10} className="text-white" />
                    </div>
                  )}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {participant.full_name}
                    {participant.isSpeaking && (
                      <span className="text-green-500 ml-1">● Speaking</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Participants Panel */}
      {showParticipants && (
        <div className="border-t border-[#1e1f22] bg-[#1e1f22]">
          <div className="p-4">
            <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
              <Users size={16} />
              Voice Participants — {participants.length + 1}
            </h3>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {/* Current User */}
                <div className="flex items-center gap-3 p-2 rounded hover:bg-[#2b2d31] transition-colors">
                  <Avatar
                    className={`h-10 w-10 border-2 ${
                      isConnected ? "border-green-500" : "border-gray-500"
                    }`}
                  >
                    <AvatarFallback className="bg-[#5865f2] text-white text-sm">
                      {getInitials(currentUser.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">
                      {currentUser.full_name}
                      <span className="text-xs text-gray-400 ml-2">(You)</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {isMuted ? "Muted" : "Unmuted"}
                      {isDeafened && " • Deafened"}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {isMuted ? (
                      <div className="p-1 bg-red-500/20 rounded">
                        <MicOff size={14} className="text-red-500" />
                      </div>
                    ) : (
                      <div className="p-1 bg-green-500/20 rounded">
                        <Mic size={14} className="text-green-500" />
                      </div>
                    )}
                    {isDeafened && (
                      <div className="p-1 bg-gray-500/20 rounded">
                        <VolumeX size={14} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Other Participants */}
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-[#2b2d31] transition-colors"
                  >
                    <Avatar
                      className={`h-10 w-10 border-2 transition-all ${
                        participant.isSpeaking
                          ? "border-green-500 shadow-lg shadow-green-500/50"
                          : "border-gray-600"
                      }`}
                    >
                      <AvatarFallback className="bg-[#5865f2] text-white text-sm">
                        {getInitials(participant.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">
                        {participant.full_name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {participant.isSpeaking && (
                          <span className="text-green-500">● Speaking</span>
                        )}
                        {!participant.isSpeaking &&
                          (participant.isMuted ? "Muted" : "Idle")}
                        {participant.isDeafened && " • Deafened"}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {participant.isMuted ? (
                        <div className="p-1 bg-red-500/20 rounded">
                          <MicOff size={14} className="text-red-500" />
                        </div>
                      ) : (
                        <div className="p-1 bg-green-500/20 rounded">
                          <Mic size={14} className="text-green-500" />
                        </div>
                      )}
                      {participant.isDeafened && (
                        <div className="p-1 bg-gray-500/20 rounded">
                          <VolumeX size={14} className="text-gray-400" />
                        </div>
                      )}
                      {participant.isVideoEnabled && (
                        <div className="p-1 bg-blue-500/20 rounded">
                          <Video size={14} className="text-blue-400" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {participants.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No other participants yet
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-t border-[#1e1f22] p-4 bg-[#1e1f22]">
          <div className="max-w-md">
            <div className="mb-4">
              <label className="text-white text-sm font-medium mb-2 block">
                Input Volume
              </label>
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
            <div className="text-xs text-gray-400">
              <p>• Use mute to silence your microphone</p>
              <p>• Use deafen to mute both your microphone and speakers</p>
              <p>• Enable video to start camera (experimental)</p>
            </div>
          </div>
        </div>
      )}

      {/* Connecting Overlay */}
      {isConnecting && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
            <p>Connecting to voice channel...</p>
          </div>
        </div>
      )}
    </div>
  );
}
