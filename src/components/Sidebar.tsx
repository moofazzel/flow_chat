import { Hash, Volume2, Plus, ChevronDown, MessageSquare, LayoutGrid, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import type { ViewType, Channel } from '../App';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  selectedChannel: string;
  onChannelSelect: (channelId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const channels: Channel[] = [
  { id: 'general', name: 'general', type: 'text', category: 'TEXT CHANNELS' },
  { id: 'dev-team', name: 'dev-team', type: 'text', category: 'TEXT CHANNELS' },
  { id: 'design', name: 'design', type: 'text', category: 'TEXT CHANNELS' },
  { id: 'sprint-planning', name: 'sprint-planning', type: 'text', category: 'TEXT CHANNELS' },
  { id: 'bugs', name: 'bugs', type: 'text', category: 'TEXT CHANNELS' },
];

const voiceChannels: Channel[] = [
  { id: 'standup', name: 'Daily Standup', type: 'voice', category: 'VOICE CHANNELS' },
  { id: 'general-voice', name: 'General', type: 'voice', category: 'VOICE CHANNELS' },
];

const directMessages = [
  { id: 'dm1', name: 'Sarah Chen', avatar: 'SC', status: 'online' },
  { id: 'dm2', name: 'Mike Johnson', avatar: 'MJ', status: 'idle' },
  { id: 'dm3', name: 'Alex Kim', avatar: 'AK', status: 'dnd' },
];

export function Sidebar({ currentView, onViewChange, selectedChannel, onChannelSelect, collapsed, onToggleCollapse }: SidebarProps) {
  if (collapsed) {
    return (
      <div className="w-[72px] bg-[#1e1f22] py-3 flex flex-col items-center gap-2">
        <div className="w-12 h-12 bg-[#5865f2] rounded-[24px] flex items-center justify-center mb-2 hover:rounded-[16px] transition-all cursor-pointer">
          <span className="text-white">WS</span>
        </div>
        <div className="w-8 h-[2px] bg-[#35363c] rounded-full" />
        
        <button
          onClick={() => onViewChange('chat')}
          className={`w-12 h-12 rounded-[24px] flex items-center justify-center hover:rounded-[16px] transition-all ${
            currentView === 'chat' ? 'bg-[#5865f2] text-white' : 'bg-[#313338] text-gray-400 hover:bg-[#5865f2] hover:text-white'
          }`}
          title="Chat"
        >
          <MessageSquare size={20} />
        </button>
        
        <button
          onClick={() => onViewChange('board')}
          className={`w-12 h-12 rounded-[24px] flex items-center justify-center hover:rounded-[16px] transition-all ${
            currentView === 'board' ? 'bg-[#5865f2] text-white' : 'bg-[#313338] text-gray-400 hover:bg-[#5865f2] hover:text-white'
          }`}
          title="Board"
        >
          <LayoutGrid size={20} />
        </button>
        
        <div className="flex-1" />
        
        <button
          onClick={onToggleCollapse}
          className="w-12 h-12 bg-[#313338] rounded-[24px] flex items-center justify-center hover:rounded-[16px] hover:bg-[#5865f2] transition-all text-gray-400 hover:text-white"
          title="Expand sidebar"
        >
          <PanelLeftOpen size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex">
      {/* Server bar */}
      <div className="w-[72px] bg-[#1e1f22] py-3 flex flex-col items-center gap-2">
        <div className="w-12 h-12 bg-[#5865f2] rounded-[24px] flex items-center justify-center mb-2 hover:rounded-[16px] transition-all cursor-pointer">
          <span className="text-white">WS</span>
        </div>
        <div className="w-8 h-[2px] bg-[#35363c] rounded-full" />
        <div className="w-12 h-12 bg-[#313338] rounded-[24px] flex items-center justify-center hover:rounded-[16px] hover:bg-[#5865f2] transition-all cursor-pointer group">
          <Plus className="text-[#3ba55d] group-hover:text-white" />
        </div>
      </div>

      {/* Channel sidebar */}
      <div className="w-60 bg-[#2b2d31] flex flex-col">
        <div className="h-12 px-4 flex items-center shadow-md border-b border-[#1e1f22] cursor-pointer hover:bg-[#35363c]">
          <span className="text-white">Workspace</span>
          <ChevronDown className="ml-auto text-gray-400" size={18} />
        </div>

        {/* View Toggle */}
        <div className="p-2 border-b border-[#1e1f22]">
          <div className="flex gap-1 bg-[#1e1f22] rounded-md p-1">
            <Button
              variant={currentView === 'chat' ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1 gap-2"
              onClick={() => onViewChange('chat')}
            >
              <MessageSquare size={16} />
              Chat
            </Button>
            <Button
              variant={currentView === 'board' ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1 gap-2"
              onClick={() => onViewChange('board')}
            >
              <LayoutGrid size={16} />
              Board
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 gap-2 text-gray-400 hover:text-gray-200"
            onClick={onToggleCollapse}
          >
            <PanelLeftClose size={16} />
            Collapse sidebar
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {/* Text Channels */}
            <div className="mb-4">
              <div className="flex items-center px-2 mb-1">
                <ChevronDown size={12} className="text-gray-400 mr-1" />
                <span className="text-gray-400 text-xs tracking-wide">TEXT CHANNELS</span>
                <Plus size={16} className="ml-auto text-gray-400 hover:text-gray-200 cursor-pointer" />
              </div>
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => onChannelSelect(channel.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#35363c] text-gray-400 hover:text-gray-200 group ${
                    selectedChannel === channel.id && currentView === 'chat' ? 'bg-[#35363c] text-gray-200' : ''
                  }`}
                >
                  <Hash size={18} className="text-gray-500" />
                  <span className="text-[15px]">{channel.name}</span>
                </button>
              ))}
            </div>

            {/* Voice Channels */}
            <div className="mb-4">
              <div className="flex items-center px-2 mb-1">
                <ChevronDown size={12} className="text-gray-400 mr-1" />
                <span className="text-gray-400 text-xs tracking-wide">VOICE CHANNELS</span>
              </div>
              {voiceChannels.map((channel) => (
                <button
                  key={channel.id}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#35363c] text-gray-400 hover:text-gray-200"
                >
                  <Volume2 size={18} className="text-gray-500" />
                  <span className="text-[15px]">{channel.name}</span>
                </button>
              ))}
            </div>

            {/* Direct Messages */}
            <div>
              <div className="flex items-center px-2 mb-1">
                <ChevronDown size={12} className="text-gray-400 mr-1" />
                <span className="text-gray-400 text-xs tracking-wide">DIRECT MESSAGES</span>
                <Plus size={16} className="ml-auto text-gray-400 hover:text-gray-200 cursor-pointer" />
              </div>
              {directMessages.map((dm) => (
                <button
                  key={dm.id}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#35363c] text-gray-400 hover:text-gray-200"
                >
                  <div className="relative">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs">{dm.avatar}</AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#2b2d31] ${
                      dm.status === 'online' ? 'bg-[#3ba55d]' : 
                      dm.status === 'idle' ? 'bg-[#f0b232]' : 
                      'bg-[#ed4245]'
                    }`} />
                  </div>
                  <span className="text-[15px]">{dm.name}</span>
                </button>
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* User bar */}
        <div className="h-[52px] bg-[#232428] px-2 flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm">John Doe</div>
            <div className="text-gray-400 text-xs">Online</div>
          </div>
        </div>
      </div>
    </div>
  );
}