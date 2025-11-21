import { useState } from 'react';
import { Hash, Pin, Bell, Users, Search, Inbox, HelpCircle, PlusCircle, Smile, Gift, Sticker, Image as ImageIcon } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import type { Task } from '../App';

interface ChatAreaProps {
  channelId: string;
  onTaskClick: (task: Task) => void;
}

interface Message {
  id: string;
  author: string;
  avatar: string;
  timestamp: string;
  content: string;
  task?: Task;
}

const mockMessages: Message[] = [
  {
    id: '1',
    author: 'Sarah Chen',
    avatar: 'SC',
    timestamp: '10:30 AM',
    content: 'Hey team! Just created a new task for the authentication bug we discussed yesterday.',
    task: {
      id: 'PROJ-123',
      title: 'Fix authentication redirect issue',
      description: 'Users are being redirected to the wrong page after login',
      status: 'todo',
      priority: 'high',
      reporter: 'Sarah Chen',
      labels: ['bug', 'auth'],
      createdAt: '2025-11-21',
      comments: [],
    },
  },
  {
    id: '2',
    author: 'Mike Johnson',
    avatar: 'MJ',
    timestamp: '10:35 AM',
    content: "I'll take a look at this. Should be a quick fix.",
  },
  {
    id: '3',
    author: 'Alex Kim',
    avatar: 'AK',
    timestamp: '11:15 AM',
    content: 'Updated the design for the new dashboard. Moving the task to review!',
    task: {
      id: 'PROJ-124',
      title: 'Dashboard redesign mockups',
      description: 'Create new mockups for the analytics dashboard',
      status: 'review',
      priority: 'medium',
      reporter: 'Alex Kim',
      labels: ['design', 'frontend'],
      createdAt: '2025-11-21',
      comments: [],
    },
  },
  {
    id: '4',
    author: 'Sarah Chen',
    avatar: 'SC',
    timestamp: '11:45 AM',
    content: 'Looks great! The new color scheme is much better.',
  },
  {
    id: '5',
    author: 'Mike Johnson',
    avatar: 'MJ',
    timestamp: '2:15 PM',
    content: 'Auth bug is fixed and pushed to staging. Can someone test it?',
  },
];

export function ChatArea({ channelId, onTaskClick }: ChatAreaProps) {
  const [message, setMessage] = useState('');

  return (
    <div className="flex-1 flex flex-col">
      {/* Channel header */}
      <div className="h-12 px-4 flex items-center gap-4 border-b border-[#1e1f22] shadow-sm">
        <div className="flex items-center gap-2">
          <Hash size={20} className="text-gray-400" />
          <span className="text-white">{channelId}</span>
        </div>
        <div className="h-6 w-px bg-[#3f4147]" />
        <span className="text-gray-400 text-sm">Team collaboration and task updates</span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200">
            <Bell size={20} />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200">
            <Pin size={20} />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200">
            <Users size={20} />
          </Button>
          <div className="relative">
            <Input
              placeholder="Search"
              className="w-36 h-8 bg-[#1e1f22] border-none text-sm"
            />
            <Search size={16} className="absolute right-2 top-2 text-gray-400" />
          </div>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200">
            <Inbox size={20} />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200">
            <HelpCircle size={20} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {mockMessages.map((msg) => (
            <div key={msg.id} className="flex gap-3 hover:bg-[#2e3035] -mx-4 px-4 py-1">
              <Avatar className="h-10 w-10 mt-1">
                <AvatarFallback>{msg.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-white">{msg.author}</span>
                  <span className="text-gray-400 text-xs">{msg.timestamp}</span>
                </div>
                <div className="text-gray-300 text-[15px] mt-1">{msg.content}</div>
                {msg.task && (
                  <button
                    onClick={() => onTaskClick(msg.task!)}
                    className="mt-2 p-3 bg-[#2b2d31] rounded-lg border-l-4 border-blue-500 hover:bg-[#35363c] transition-colors text-left w-full max-w-md"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {msg.task.id}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          msg.task.priority === 'urgent' ? 'border-red-500 text-red-500' :
                          msg.task.priority === 'high' ? 'border-orange-500 text-orange-500' :
                          msg.task.priority === 'medium' ? 'border-yellow-500 text-yellow-500' :
                          'border-gray-500 text-gray-500'
                        }`}
                      >
                        {msg.task.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {msg.task.status}
                      </Badge>
                    </div>
                    <div className="text-white mb-1">{msg.task.title}</div>
                    <div className="text-gray-400 text-sm">{msg.task.description}</div>
                    <div className="flex gap-1 mt-2">
                      {msg.task.labels.map((label) => (
                        <Badge key={label} variant="secondary" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Message input */}
      <div className="p-4">
        <div className="bg-[#383a40] rounded-lg">
          <Input
            placeholder={`Message #${channelId}`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="border-none bg-transparent text-gray-200 placeholder:text-gray-500"
          />
          <div className="flex items-center gap-2 px-3 pb-2">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200 p-1 h-auto">
              <PlusCircle size={20} />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200 p-1 h-auto">
              <Gift size={20} />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200 p-1 h-auto">
              <ImageIcon size={20} />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200 p-1 h-auto">
              <Sticker size={20} />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200 p-1 h-auto ml-auto">
              <Smile size={20} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
