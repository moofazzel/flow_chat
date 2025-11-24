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

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const isMutedRef = useRef(isMuted);
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const hasJoinedRef = useRef(false);
  const isJoiningRef = useRef(false);
  const processedUserListRef = useRef<Set<string>>(new Set());
  const isCleaningUpRef = useRef(false);
  const lastSpeakingStateRef = useRef(false);
  const supabase = createClient();

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
    setParticipants((prev) => {
      const participant = prev.find((p) => p.id === userId);
      if (participant && participant.isSpeaking === isSpeaking) {
        return prev;
      }
      return prev.map((p) => (p.id === userId ? { ...p, isSpeaking } : p));
    });
  };

  // Debug participant state changes
  useEffect(() => {
    console.log(
      "🔄 Participants state changed:",
      participants.length,
      participants.map((p) => p.full_name)
    );
  }, [participants]);

  // WebRTC peer connection management
  const createPeerConnection = useCallback(
    (userId: string) => {
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
        console.log("Received remote track from:", userId);
        const remoteStream = event.streams[0];
        remoteStreamsRef.current.set(userId, remoteStream);

        // Create and play audio element for remote stream
        const audio = new Audio();
        audio.srcObject = remoteStream;
        audio.autoplay = true;
        audio.play().catch((err) => console.error("Audio play failed:", err));
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && channelRef.current) {
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
        console.log(`Peer connection with ${userId}:`, pc.connectionState);
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
    [currentUser?.id]
  );

  const createOffer = useCallback(
    async (userId: string) => {
      const pc = createPeerConnection(userId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (channelRef.current) {
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
      const pc = createPeerConnection(fromUserId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (channelRef.current) {
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
      const pc = peerConnectionsRef.current.get(fromUserId);
      if (pc && pc.signalingState !== "stable") {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("Set remote answer for:", fromUserId);
      } else if (pc) {
        console.log(
          "Ignoring answer, connection already stable with:",
          fromUserId
        );
      }
    },
    []
  );

  const handleIceCandidate = useCallback(
    async (candidate: RTCIceCandidateInit, fromUserId: string) => {
      const pc = peerConnectionsRef.current.get(fromUserId);
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    },
    []
  );

  const cleanupConnection = useCallback(async () => {
    console.log(
      "🚪 cleanupConnection called - hasJoined:",
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
    isCleaningUpRef.current = false;
  }, [currentUser, supabase]);

  const handleDisconnect = useCallback(() => {
    cleanupConnection();
    onLeave();
  }, [cleanupConnection, onLeave]);

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
        console.log("✅ Media access granted");
        localStreamRef.current = stream;

        // Setup audio analysis for speaking detection
        audioContextRef.current = new AudioContext();
        const audioSource =
          audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        audioSource.connect(analyserRef.current);

        // Start speaking detection
        const detectSpeaking = () => {
          if (!analyserRef.current || !channelRef.current) return;

          const dataArray = new Uint8Array(
            analyserRef.current.frequencyBinCount
          );
          analyserRef.current.getByteFrequencyData(dataArray);

          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          const isSpeaking = average > 10 && !isMutedRef.current; // Threshold for speaking

          // Only broadcast if state changed
          if (isSpeaking !== lastSpeakingStateRef.current) {
            lastSpeakingStateRef.current = isSpeaking;
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
            console.log("User joined:", payload);
            // Don't add self
            if (payload.userId !== currentUser.id) {
              addParticipant(payload);
              // Only initiate WebRTC if our ID is greater (prevents duplicate offers)
              if (currentUser.id > payload.userId) {
                console.log("Initiating WebRTC offer to:", payload.full_name);
                createOffer(payload.userId);
              } else {
                console.log("Waiting for offer from:", payload.full_name);
              }
            }
          })
          .on("broadcast", { event: "user-left" }, ({ payload }) => {
            console.log("User left:", payload);
            removeParticipant(payload.userId);
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
            if (payload.requesterId !== currentUser.id) {
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
            if (
              payload.respondingTo === currentUser.id &&
              payload.userId !== currentUser.id
            ) {
              // Check if we've already processed this user
              if (processedUserListRef.current.has(payload.userId)) {
                console.log("Already processed user:", payload.full_name);
                return;
              }

              console.log("Received existing user:", payload);
              processedUserListRef.current.add(payload.userId);
              addParticipant(payload);

              // Only initiate WebRTC if our ID is greater (prevents duplicate offers)
              if (currentUser.id > payload.userId) {
                console.log(
                  "Initiating WebRTC offer to existing user:",
                  payload.full_name
                );
                createOffer(payload.userId);
              } else {
                console.log(
                  "Waiting for offer from existing user:",
                  payload.full_name
                );
              }
            }
          })
          .subscribe(async (status) => {
            console.log("📡 Channel subscription status:", status);
            if (status === "SUBSCRIBED") {
              console.log("🎉 Subscribed to channel, broadcasting join");
              // First, request list of existing users
              channel.send({
                type: "broadcast",
                event: "request-users",
                payload: {
                  requesterId: currentUser.id,
                },
              });

              // Then announce our join
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
                console.log("✅ Successfully joined voice channel");
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
        handleDisconnect(); // Exit if can't get microphone
      }
    };

    let isMounted = true;

    const join = async () => {
      if (isMounted) {
        await joinVoiceChannel();
      }
    };

    join();

    // Cleanup on unmount
    return () => {
      console.log("🧹 VoiceChannelPanel cleanup function called");
      isMounted = false;
      cleanupConnection();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentUser,
    channelId,
    channelName,
    cleanupConnection,
    handleDisconnect,
  ]);

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

  if (!currentUser) return null;

  console.log(
    "VoiceChannelPanel render - participants:",
    participants.length,
    participants.map((p) => p.full_name)
  );

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
            onClick={handleDisconnect}
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
