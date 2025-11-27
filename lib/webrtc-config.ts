/**
 * WebRTC Configuration Utility
 * Provides STUN/TURN server configuration for voice channels
 */

export interface RTCConfigOptions {
  iceServers: RTCIceServer[];
}

/**
 * Get ICE servers configuration
 * Supports both environment variables and fallback to public STUN servers
 */
export function getIceServers(): RTCIceServer[] {
  const iceServers: RTCIceServer[] = [];

  // Add TURN server if configured via environment variables
  const turnServer = process.env.NEXT_PUBLIC_TURN_SERVER;
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  if (turnServer && turnUsername && turnCredential) {
    iceServers.push({
      urls: turnServer,
      username: turnUsername,
      credential: turnCredential,
    });
    console.log("✅ Using configured TURN server");
  } else {
    console.warn(
      "⚠️ No TURN server configured. Voice may not work behind strict NATs."
    );
    
    // Add free public TURN servers as fallback (OpenRelay project)
    iceServers.push({
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    });
    iceServers.push({
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject", 
      credential: "openrelayproject",
    });
    iceServers.push({
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    });
  }

  // Add STUN servers (always include these)
  const stunServer1 =
    process.env.NEXT_PUBLIC_STUN_SERVER_1 || "stun:stun.l.google.com:19302";
  const stunServer2 =
    process.env.NEXT_PUBLIC_STUN_SERVER_2 || "stun:stun1.l.google.com:19302";

  iceServers.push({ urls: stunServer1 });
  iceServers.push({ urls: stunServer2 });

  // Additional public STUN servers for better connectivity
  iceServers.push({ urls: "stun:stun2.l.google.com:19302" });
  iceServers.push({ urls: "stun:stun3.l.google.com:19302" });
  iceServers.push({ urls: "stun:stun4.l.google.com:19302" });
  
  // Metered STUN server (another reliable option)
  iceServers.push({ urls: "stun:openrelay.metered.ca:80" });

  console.log("📡 ICE Servers configured:", iceServers.length, "servers");
  return iceServers;
}

/**
 * Get complete RTCPeerConnection configuration
 */
export function getRTCConfiguration(): RTCConfiguration {
  return {
    iceServers: getIceServers(),
    iceCandidatePoolSize: 10,
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require",
  };
}

/**
 * Get media constraints for getUserMedia
 */
export function getMediaConstraints(
  audioOnly: boolean = true
): MediaStreamConstraints {
  const constraints: MediaStreamConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      // Additional advanced constraints for better audio quality
      sampleRate: 48000,
      channelCount: 1,
    },
    video: false,
  };

  if (!audioOnly) {
    constraints.video = {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    };
  }

  return constraints;
}

/**
 * Check if WebRTC is supported in the current browser
 */
export function isWebRTCSupported(): boolean {
  return !!(
    typeof navigator !== "undefined" &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function" &&
    typeof window !== "undefined" &&
    typeof window.RTCPeerConnection === "function"
  );
}

/**
 * Check browser permissions for microphone access
 */
export async function checkMicrophonePermission(): Promise<
  "granted" | "denied" | "prompt"
> {
  try {
    // Check if Permissions API is supported
    if (typeof navigator.permissions === "undefined") {
      return "prompt";
    }

    const result = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });
    return result.state as "granted" | "denied" | "prompt";
  } catch (error) {
    console.error("Error checking microphone permission:", error);
    return "prompt";
  }
}

/**
 * Request microphone access with user-friendly error handling
 */
export async function requestMicrophoneAccess(): Promise<{
  success: boolean;
  stream?: MediaStream;
  error?: string;
}> {
  try {
    if (!isWebRTCSupported()) {
      return {
        success: false,
        error: "WebRTC is not supported in your browser",
      };
    }

    const stream = await navigator.mediaDevices.getUserMedia(
      getMediaConstraints(true)
    );

    return { success: true, stream };
  } catch (error) {
    console.error("Microphone access error:", error);

    if (error instanceof Error) {
      if (error.name === "NotAllowedError") {
        return {
          success: false,
          error:
            "Microphone access denied. Please grant permission in your browser settings.",
        };
      } else if (error.name === "NotFoundError") {
        return {
          success: false,
          error:
            "No microphone found. Please connect a microphone and try again.",
        };
      } else if (error.name === "NotReadableError") {
        return {
          success: false,
          error:
            "Microphone is already in use by another application. Please close other apps using your microphone.",
        };
      }
    }

    return {
      success: false,
      error: "Failed to access microphone. Please check your device settings.",
    };
  }
}

/**
 * Get network quality estimate based on RTCPeerConnection stats
 */
export async function getNetworkQuality(
  peerConnection: RTCPeerConnection
): Promise<{
  quality: "excellent" | "good" | "fair" | "poor";
  latency: number;
  packetLoss: number;
}> {
  try {
    const stats = await peerConnection.getStats();
    let latency = 0;
    let packetLoss = 0;

    stats.forEach((report) => {
      if (report.type === "candidate-pair" && report.state === "succeeded") {
        latency = report.currentRoundTripTime * 1000 || 0;
      }
      if (report.type === "inbound-rtp" && report.kind === "audio") {
        const packetsLost = report.packetsLost || 0;
        const packetsReceived = report.packetsReceived || 1;
        packetLoss = (packetsLost / (packetsLost + packetsReceived)) * 100;
      }
    });

    let quality: "excellent" | "good" | "fair" | "poor";
    if (latency < 100 && packetLoss < 1) {
      quality = "excellent";
    } else if (latency < 200 && packetLoss < 3) {
      quality = "good";
    } else if (latency < 300 && packetLoss < 5) {
      quality = "fair";
    } else {
      quality = "poor";
    }

    return { quality, latency, packetLoss };
  } catch (error) {
    console.error("Error getting network quality:", error);
    return { quality: "poor", latency: 999, packetLoss: 100 };
  }
}
