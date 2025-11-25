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
  isInitiator: boolean; // true if this user started the call
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
}: DirectCallModalProps) {
  const [callStatus, setCallStatus] = useState<CallStatus>("initializing");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === "video");
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<
    "excellent" | "good" | "fair" | "poor"
  >("good");

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);
  const callStartTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Define all functions before useEffect using useCallback
  const cleanup = useCallback(() => {
    // Stop duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    // Unsubscribe from channel
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }
  }, []);

  const startDurationTimer = useCallback(() => {
    durationIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - callStartTimeRef.current) / 1000
      );
      setCallDuration(elapsed);
    }, 1000);
  }, []);

  const handleEndCall = useCallback(() => {
    if (channelRef.current && callStatus !== "ended") {
      channelRef.current.send({
        type: "broadcast",
        event: "call-end",
        payload: {
          fromUserId: currentUserId,
          toUserId: otherUser.id,
        },
      });
    }

    cleanup();
    onClose();
  }, [callStatus, currentUserId, otherUser.id, cleanup, onClose]);

  const handleAnswer = useCallback(
    async (offer: RTCSessionDescriptionInit) => {
      if (!peerConnectionRef.current) return;

      try {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "call-answer",
            payload: {
              answer,
              fromUserId: currentUserId,
              toUserId: otherUser.id,
            },
          });
        }

        setCallStatus("connected");
      } catch (error) {
        console.error("Failed to answer call:", error);
        toast.error("Failed to answer call");
        setCallStatus("failed");
      }
    },
    [currentUserId, otherUser.id]
  );

  // Initialize call
  useEffect(() => {
    if (!isOpen) return;

    const initializeCall = async () => {
      if (!isWebRTCSupported()) {
        toast.error("Your browser doesn't support voice/video calls");
        setCallStatus("failed");
        return;
      }

      try {
        // Request media access
        const constraints = getMediaConstraints(callType === "audio");
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;

        // Display local video if video call
        if (localVideoRef.current && callType === "video") {
          localVideoRef.current.srcObject = stream;
        }

        // Initialize peer connection
        const pc = new RTCPeerConnection(getRTCConfiguration());
        peerConnectionRef.current = pc;

        // Add local stream to peer connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Handle remote stream
        pc.ontrack = (event) => {
          console.log("Received remote track:", event.track.kind);
          if (remoteStreamRef.current) {
            remoteStreamRef.current.addTrack(event.track);
          } else {
            remoteStreamRef.current = event.streams[0];
          }

          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStreamRef.current;
          }
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate && channelRef.current) {
            channelRef.current.send({
              type: "broadcast",
              event: "ice-candidate",
              payload: {
                candidate: event.candidate,
                fromUserId: currentUserId,
                toUserId: otherUser.id,
              },
            });
          }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
          console.log("Connection state:", pc.connectionState);
          if (pc.connectionState === "connected") {
            setCallStatus("connected");
            callStartTimeRef.current = Date.now();
            startDurationTimer();
          } else if (
            pc.connectionState === "disconnected" ||
            pc.connectionState === "failed"
          ) {
            setCallStatus("ended");
            handleEndCall();
          }
        };

        // Setup Supabase channel for signaling
        const supabase = createClient();
        const channel = supabase.channel(`dm-call:${threadId}`);
        channelRef.current = channel;

        channel
          .on("broadcast", { event: "call-offer" }, async ({ payload }) => {
            if (payload.toUserId !== currentUserId) return;
            console.log("Received call offer");

            setCallStatus("ringing");

            // Auto-answer if we're the receiver
            if (!isInitiator) {
              await handleAnswer(payload.offer);
            }
          })
          .on("broadcast", { event: "call-answer" }, async ({ payload }) => {
            if (payload.toUserId !== currentUserId) return;
            console.log("Received call answer");

            await pc.setRemoteDescription(
              new RTCSessionDescription(payload.answer)
            );
            setCallStatus("connected");
          })
          .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
            if (payload.toUserId !== currentUserId) return;
            console.log("Received ICE candidate");

            if (payload.candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            }
          })
          .on("broadcast", { event: "call-end" }, ({ payload }) => {
            if (payload.toUserId !== currentUserId) return;
            console.log("Call ended by other user");
            setCallStatus("ended");
            handleEndCall();
          })
          .on("broadcast", { event: "call-declined" }, ({ payload }) => {
            if (payload.toUserId !== currentUserId) return;
            console.log("Call declined");
            setCallStatus("declined");
            setTimeout(() => onClose(), 2000);
          })
          .subscribe();

        // If initiator, create and send offer
        if (isInitiator) {
          setCallStatus("calling");
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          channel.send({
            type: "broadcast",
            event: "call-offer",
            payload: {
              offer,
              fromUserId: currentUserId,
              fromUserName: currentUserName,
              toUserId: otherUser.id,
              callType,
            },
          });
        }
      } catch (error) {
        console.error("Failed to initialize call:", error);
        toast.error("Failed to start call. Please check your permissions.");
        setCallStatus("failed");
      }
    };

    initializeCall();

    return () => {
      cleanup();
    };
  }, [
    isOpen,
    isInitiator,
    callType,
    currentUserId,
    currentUserName,
    otherUser.id,
    threadId,
    cleanup,
    handleAnswer,
    handleEndCall,
    startDurationTimer,
    onClose,
  ]);

  const handleDeclineCall = () => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "call-declined",
        payload: {
          fromUserId: currentUserId,
          toUserId: otherUser.id,
        },
      });
    }

    cleanup();
    onClose();
  };

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
    setIsSpeakerOn(!isSpeakerOn);
    // Note: Speaker control is limited in web browsers
    toast.info(isSpeakerOn ? "Speaker muted" : "Speaker unmuted", {
      duration: 1000,
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getStatusText = () => {
    switch (callStatus) {
      case "initializing":
        return "Initializing...";
      case "calling":
        return "Calling...";
      case "ringing":
        return "Incoming call...";
      case "connected":
        return formatDuration(callDuration);
      case "ended":
        return "Call ended";
      case "declined":
        return "Call declined";
      case "missed":
        return "Call missed";
      case "failed":
        return "Call failed";
      default:
        return "";
    }
  };

  const getQualityColor = () => {
    switch (connectionQuality) {
      case "excellent":
        return "bg-green-500";
      case "good":
        return "bg-blue-500";
      case "fair":
        return "bg-yellow-500";
      case "poor":
        return "bg-red-500";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-[#2b2d31] rounded-lg shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleEndCall}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        {/* Video area */}
        <div className="relative aspect-video bg-[#1e1f22]">
          {callType === "video" ? (
            <>
              {/* Remote video (main) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Local video (picture-in-picture) */}
              <div className="absolute bottom-4 right-4 w-32 h-24 bg-[#313338] rounded-lg overflow-hidden border-2 border-[#404249]">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                />
              </div>
            </>
          ) : (
            // Audio call - show avatar
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Avatar className="h-32 w-32 mx-auto mb-4">
                  <AvatarFallback className="bg-[#5865f2] text-white text-4xl">
                    {otherUser.avatar}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-white text-2xl font-semibold mb-2">
                  {otherUser.name}
                </h3>
                <p className="text-gray-400 text-lg">{getStatusText()}</p>
              </div>
            </div>
          )}

          {/* Connection quality indicator */}
          {callStatus === "connected" && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full">
              <div className={`w-2 h-2 rounded-full ${getQualityColor()}`} />
              <span className="text-white text-xs capitalize">
                {connectionQuality}
              </span>
            </div>
          )}

          {/* Call duration (for video) */}
          {callType === "video" && callStatus === "connected" && (
            <div className="absolute top-4 right-4 bg-black/50 px-3 py-1.5 rounded-full">
              <span className="text-white text-sm font-medium">
                {formatDuration(callDuration)}
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 bg-[#2b2d31]">
          <div className="flex items-center justify-center gap-4">
            {/* Mute button */}
            <Button
              onClick={toggleMute}
              variant="ghost"
              size="lg"
              className={`rounded-full w-14 h-14 ${
                isMuted
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-[#404249] hover:bg-[#4a4f58] text-white"
              }`}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </Button>

            {/* Video toggle (only for video calls) */}
            {callType === "video" && (
              <Button
                onClick={toggleVideo}
                variant="ghost"
                size="lg"
                className={`rounded-full w-14 h-14 ${
                  !isVideoEnabled
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-[#404249] hover:bg-[#4a4f58] text-white"
                }`}
              >
                {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
              </Button>
            )}

            {/* End call button */}
            <Button
              onClick={
                callStatus === "ringing" && !isInitiator
                  ? handleDeclineCall
                  : handleEndCall
              }
              variant="ghost"
              size="lg"
              className="rounded-full w-14 h-14 bg-red-500 hover:bg-red-600 text-white"
            >
              <PhoneOff size={24} />
            </Button>

            {/* Speaker toggle */}
            <Button
              onClick={toggleSpeaker}
              variant="ghost"
              size="lg"
              className={`rounded-full w-14 h-14 ${
                !isSpeakerOn
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-[#404249] hover:bg-[#4a4f58] text-white"
              }`}
            >
              {isSpeakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </Button>

            {/* Answer button (only when ringing and not initiator) */}
            {callStatus === "ringing" && !isInitiator && (
              <Button
                onClick={() => handleAnswer({} as RTCSessionDescriptionInit)}
                variant="ghost"
                size="lg"
                className="rounded-full w-14 h-14 bg-green-500 hover:bg-green-600 text-white"
              >
                <Phone size={24} />
              </Button>
            )}
          </div>

          {/* Status text */}
          <div className="text-center mt-4">
            <p className="text-gray-400 text-sm">{getStatusText()}</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
