#!/usr/bin/env node

/**
 * Voice Channel Configuration Checker
 * Run this to diagnose voice channel issues
 */

console.log("🔍 Checking Voice Channel Configuration...\n");

// Check 1: Environment Variables
console.log("1️⃣ Checking Environment Variables:");
console.log(
  "   NEXT_PUBLIC_SUPABASE_URL:",
  process.env.NEXT_PUBLIC_SUPABASE_URL || "❌ NOT SET"
);
console.log(
  "   NEXT_PUBLIC_SUPABASE_ANON_KEY:",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ SET" : "❌ NOT SET"
);
console.log(
  "   NEXT_PUBLIC_TURN_SERVER:",
  process.env.NEXT_PUBLIC_TURN_SERVER || "⚠️ Not configured (using STUN only)"
);
console.log(
  "   NEXT_PUBLIC_TURN_USERNAME:",
  process.env.NEXT_PUBLIC_TURN_USERNAME || "⚠️ Not configured"
);
console.log(
  "   NEXT_PUBLIC_TURN_CREDENTIAL:",
  process.env.NEXT_PUBLIC_TURN_CREDENTIAL || "⚠️ Not configured"
);

// Check 2: Supabase URL format
console.log("\n2️⃣ Checking Supabase URL Format:");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl) {
  if (supabaseUrl.includes("localhost") || supabaseUrl.includes("127.0.0.1")) {
    console.log("   ⚠️  WARNING: Using local Supabase instance");
    console.log("   Make sure Supabase is running: npx supabase start");
  } else if (supabaseUrl.includes(".supabase.co")) {
    console.log("   ✅ Using hosted Supabase instance");
  } else {
    console.log("   ❌ Invalid Supabase URL format");
  }
} else {
  console.log("   ❌ Supabase URL not configured");
}

// Check 3: Protocol
console.log("\n3️⃣ Checking Application Protocol:");
const isHttps =
  typeof window !== "undefined" && window.location.protocol === "https:";
console.log(
  "   Protocol:",
  typeof window !== "undefined" ? window.location.protocol : "N/A"
);
console.log(
  "   Status:",
  isHttps ? "✅ HTTPS (required for WebRTC)" : "❌ HTTP (WebRTC requires HTTPS)"
);

// Check 4: WebRTC Support
console.log("\n4️⃣ Checking WebRTC Support:");
if (typeof navigator !== "undefined") {
  const hasGetUserMedia = !!(
    navigator.mediaDevices && navigator.mediaDevices.getUserMedia
  );
  const hasRTCPeerConnection = !!window.RTCPeerConnection;
  console.log(
    "   getUserMedia:",
    hasGetUserMedia ? "✅ Supported" : "❌ Not supported"
  );
  console.log(
    "   RTCPeerConnection:",
    hasRTCPeerConnection ? "✅ Supported" : "❌ Not supported"
  );
} else {
  console.log("   ⚠️  Running in Node.js environment (not browser)");
}

// Check 5: Common Issues
console.log("\n5️⃣ Common Issues Checklist:");
console.log("   [ ] Is Supabase Realtime enabled for voice_sessions table?");
console.log("   [ ] Are you using HTTPS (not HTTP)?");
console.log("   [ ] Have you granted microphone permissions?");
console.log("   [ ] Are you testing with 2+ users?");
console.log("   [ ] Is another app using your microphone?");

// Recommendations
console.log("\n💡 Recommendations:");
if (!supabaseUrl || supabaseUrl.includes("localhost")) {
  console.log("   1. Check your .env.local file");
  console.log(
    "   2. Make sure NEXT_PUBLIC_SUPABASE_URL is set to your hosted Supabase URL"
  );
  console.log("   3. Example: https://xxxxx.supabase.co");
}
if (!process.env.NEXT_PUBLIC_TURN_SERVER) {
  console.log(
    "   4. Add TURN server for better connectivity (see WEBRTC_CONFIGURATION.md)"
  );
}

console.log("\n📚 Documentation:");
console.log("   - Quick Start: VOICE_QUICK_REFERENCE.md");
console.log("   - Full Setup: VOICE_SETUP_GUIDE.md");
console.log("   - Config Guide: docs/WEBRTC_CONFIGURATION.md");

console.log("\n✅ Configuration check complete!\n");
