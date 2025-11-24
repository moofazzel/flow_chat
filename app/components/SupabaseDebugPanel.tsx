"use client";

/**
 * Temporary Debug Component
 * Add this to your page to see environment variable values
 * Remove after debugging
 */

export function SupabaseDebugPanel() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isLocalhost =
    supabaseUrl?.includes("localhost") || supabaseUrl?.includes("127.0.0.1");
  const isHosted = supabaseUrl?.includes(".supabase.co");

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg shadow-lg max-w-md z-50 text-xs font-mono">
      <div className="font-bold mb-2 text-yellow-400">
        🔧 Supabase Configuration Debug
      </div>

      <div className="space-y-2">
        {/* Supabase URL */}
        <div>
          <span className="text-gray-400">URL:</span>{" "}
          <span
            className={
              isLocalhost
                ? "text-red-400"
                : isHosted
                ? "text-green-400"
                : "text-yellow-400"
            }
          >
            {supabaseUrl || "❌ NOT SET"}
          </span>
        </div>

        {/* Anon Key */}
        <div>
          <span className="text-gray-400">Anon Key:</span>{" "}
          <span className={hasAnonKey ? "text-green-400" : "text-red-400"}>
            {hasAnonKey ? "✅ SET" : "❌ NOT SET"}
          </span>
        </div>

        {/* Status */}
        <div>
          <span className="text-gray-400">Type:</span>{" "}
          <span
            className={
              isLocalhost
                ? "text-red-400"
                : isHosted
                ? "text-green-400"
                : "text-yellow-400"
            }
          >
            {isLocalhost
              ? "⚠️ Local (check if running)"
              : isHosted
              ? "✅ Hosted"
              : "❓ Unknown"}
          </span>
        </div>

        {/* Protocol */}
        <div>
          <span className="text-gray-400">Protocol:</span>{" "}
          <span
            className={
              typeof window !== "undefined" &&
              window.location.protocol === "https:"
                ? "text-green-400"
                : "text-red-400"
            }
          >
            {typeof window !== "undefined"
              ? window.location.protocol === "https:"
                ? "✅ HTTPS"
                : "❌ HTTP (WebRTC needs HTTPS)"
              : "N/A"}
          </span>
        </div>

        {/* WebRTC Support */}
        <div>
          <span className="text-gray-400">WebRTC:</span>{" "}
          <span
            className={
              typeof navigator !== "undefined" &&
              navigator.mediaDevices &&
              typeof navigator.mediaDevices.getUserMedia === "function"
                ? "text-green-400"
                : "text-red-400"
            }
          >
            {typeof navigator !== "undefined" &&
            navigator.mediaDevices &&
            typeof navigator.mediaDevices.getUserMedia === "function"
              ? "✅ Supported"
              : "❌ Not Supported"}
          </span>
        </div>

        {/* Warnings */}
        {isLocalhost && (
          <div className="mt-2 p-2 bg-red-900/50 border border-red-500 rounded">
            <div className="text-red-300 font-bold mb-1">⚠️ WARNING</div>
            <div className="text-xs text-red-200">
              Using local Supabase. Make sure it's running with:
              <code className="block mt-1 bg-black/50 p-1 rounded">
                npx supabase start
              </code>
            </div>
          </div>
        )}

        {typeof window !== "undefined" &&
          window.location.protocol !== "https:" && (
            <div className="mt-2 p-2 bg-orange-900/50 border border-orange-500 rounded">
              <div className="text-orange-300 font-bold mb-1">⚠️ WARNING</div>
              <div className="text-xs text-orange-200">
                WebRTC requires HTTPS. Use ngrok:
                <code className="block mt-1 bg-black/50 p-1 rounded">
                  npx ngrok http 3000
                </code>
              </div>
            </div>
          )}
      </div>

      <div className="mt-3 text-[10px] text-gray-500">
        Remove this component after debugging
      </div>
    </div>
  );
}
