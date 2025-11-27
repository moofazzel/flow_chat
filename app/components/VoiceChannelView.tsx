import { Mic, MicOff, Users, Video, Volume2, VolumeX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

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

interface VoiceChannelViewProps {
  channelName: string;
  participants: VoiceParticipant[];
}

export function VoiceChannelView({
  channelName,
  participants,
}: VoiceChannelViewProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex-1 bg-[#313338] flex flex-col h-full">
      {/* Header */}
      <div className="h-12 px-4 flex items-center shadow-sm border-b border-[#26272d]">
        <div className="flex items-center gap-2 text-white font-semibold">
          <span className="text-gray-400 text-2xl">🔊</span>
          {channelName}
        </div>
      </div>

      {/* Main Content - Voice Channel Active View */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col items-center justify-center h-full">
          <div className="p-6 bg-[#2b2d31] rounded-full mb-6">
            <Mic size={64} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            You&apos;re in the Voice Channel!
          </h2>
          <p className="text-gray-400 text-center max-w-md mb-4">
            Use the controls at the bottom of the screen to manage your audio
            and see who&apos;s talking.
          </p>
          <div className="flex flex-col items-center gap-3 mt-8 bg-[#2b2d31] p-6 rounded-lg">
            <h3 className="text-white font-semibold mb-2">Quick Controls</h3>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <div className="flex items-center gap-2 bg-[#1e1f22] px-4 py-2 rounded">
                <Mic size={16} />
                <span>Toggle Mute</span>
              </div>
              <div className="flex items-center gap-2 bg-[#1e1f22] px-4 py-2 rounded">
                <Volume2 size={16} />
                <span>Toggle Deafen</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300 bg-[#1e1f22] px-4 py-2 rounded">
              <Users size={16} />
              <span>Click Participants to see everyone in the channel</span>
            </div>
          </div>
        </div>
        {participants.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className={`relative aspect-video bg-[#2b2d31] rounded-lg flex flex-col items-center justify-center border-2 transition-all ${
                  participant.isSpeaking
                    ? "border-green-500 shadow-[0_0_0_2px_rgba(34,197,94,0.2)]"
                    : "border-transparent hover:border-[#1e1f22]"
                }`}
              >
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-20 w-20 border-4 border-[#1e1f22]">
                    <AvatarImage src={participant.avatar_url} />
                    <AvatarFallback className="bg-[#5865f2] text-white text-xl">
                      {getInitials(participant.full_name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Status Indicators */}
                  <div className="absolute -bottom-2 -right-2 flex gap-1">
                    {participant.isMuted && (
                      <div className="p-1.5 bg-red-500 rounded-full border-2 border-[#2b2d31]">
                        <MicOff size={14} className="text-white" />
                      </div>
                    )}
                    {participant.isDeafened && (
                      <div className="p-1.5 bg-gray-600 rounded-full border-2 border-[#2b2d31]">
                        <VolumeX size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Name */}
                <div className="mt-3 font-semibold text-white flex items-center gap-2">
                  {participant.full_name}
                  {participant.isVideoEnabled && (
                    <Video size={14} className="text-gray-400" />
                  )}
                </div>

                {/* Speaking Indicator Text */}
                {participant.isSpeaking && (
                  <div className="absolute bottom-3 text-xs font-bold text-green-500 uppercase tracking-wider">
                    Speaking
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
