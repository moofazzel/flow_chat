"use client";

import { useServerChannels, useServers } from "@/hooks/useServer";
import { Channel } from "@/lib/serverService";
import { ChevronDown, Hash, Plus, Volume2 } from "lucide-react";
import { useState } from "react";

interface ServerChannelListProps {
  userId: string;
  onChannelSelect: (channelId: string, channelName: string) => void;
  selectedChannelId?: string;
}

export function ServerChannelList({
  userId,
  onChannelSelect,
  selectedChannelId,
}: ServerChannelListProps) {
  const { servers, loading: serversLoading } = useServers(userId);
  const [activeServerId, setActiveServerId] = useState<string | null>(
    servers[0]?.id || null
  );
  const { channels, loading: channelsLoading } =
    useServerChannels(activeServerId);

  if (serversLoading)
    return <div className="p-4 text-gray-400">Loading servers...</div>;
  if (servers.length === 0)
    return <div className="p-4 text-gray-400">No servers yet</div>;

  const groupedChannels = channels.reduce((acc, channel) => {
    const category = channel.category || "GENERAL";
    if (!acc[category]) acc[category] = [];
    acc[category].push(channel);
    return acc;
  }, {} as Record<string, Channel[]>);

  return (
    <div className="flex flex-col h-full">
      {/* Server selector */}
      <div className="flex-shrink-0 p-3 border-b border-gray-700">
        <button className="w-full flex items-center justify-between hover:bg-gray-700 p-2 rounded">
          <span className="font-semibold text-white">
            {servers.find((s) => s.id === activeServerId)?.name ||
              "Select Server"}
          </span>
          <ChevronDown size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto">
        {channelsLoading ? (
          <div className="p-4 text-gray-400">Loading channels...</div>
        ) : (
          <div className="p-2 space-y-4">
            {Object.entries(groupedChannels).map(
              ([category, categoryChannels]) => (
                <div key={category}>
                  <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase">
                    {category}
                  </div>
                  <div className="space-y-0.5">
                    {categoryChannels.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() =>
                          onChannelSelect(channel.id, channel.name)
                        }
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-700 transition-colors ${
                          selectedChannelId === channel.id
                            ? "bg-gray-600 text-white"
                            : "text-gray-300"
                        }`}
                      >
                        {channel.type === "voice" ? (
                          <Volume2 size={16} className="text-gray-400" />
                        ) : (
                          <Hash size={16} className="text-gray-400" />
                        )}
                        <span className="text-sm">{channel.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Add channel button */}
      <div className="flex-shrink-0 p-2 border-t border-gray-700">
        <button className="w-full flex items-center gap-2 px-2 py-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors text-sm">
          <Plus size={16} />
          Add Channel
        </button>
      </div>
    </div>
  );
}
