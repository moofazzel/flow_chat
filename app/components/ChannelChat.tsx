"use client";

import { useChannelMessages } from "@/hooks/useChannelMessages";
import { User } from "@/utils/auth";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ChannelChatProps {
  channelId: string;
  channelName: string;
  currentUser: User;
}

export function ChannelChat({
  channelId,
  channelName,
  currentUser,
}: ChannelChatProps) {
  const { messages, loading, sendMessage } = useChannelMessages(
    channelId,
    currentUser.id
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    setSending(true);
    const result = await sendMessage(input);
    if (result.success) {
      setInput("");
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#313338]">
      {/* Header */}
      <div className="flex-shrink-0 h-12 px-4 flex items-center border-b border-gray-700">
        <span className="text-gray-300 text-lg"># {channelName}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-gray-400">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold">
                  {message.author?.username?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-white">
                    {message.author?.username || "Unknown"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-gray-300 mt-1">{message.content}</div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4">
        <div className="flex items-center gap-2 bg-[#383a40] rounded px-4 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder={`Message #${channelName}`}
            className="flex-1 bg-transparent text-white outline-none placeholder-gray-400"
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="text-gray-400 hover:text-white disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
