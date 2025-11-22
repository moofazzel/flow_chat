import { useState, useEffect } from 'react';
import { X, MessageSquare, Send, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import type { Task } from '../App';

interface FloatingChatProps {
  channelId: string;
  onTaskClick: (task: Task) => void;
  onClose: () => void;
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

export function FloatingChat({ channelId, onTaskClick, onClose }: FloatingChatProps) {
  const [message, setMessage] = useState('');
  const [prevChannelId, setPrevChannelId] = useState(channelId);

  // Detect channel change for animation
  useEffect(() => {
    if (channelId !== prevChannelId) {
      setPrevChannelId(channelId);
    }
  }, [channelId, prevChannelId]);

  return (
    <motion.div 
      initial={{ 
        x: 450,
        opacity: 0,
        scale: 0.9,
      }}
      animate={{ 
        x: 0,
        opacity: 1,
        scale: 1,
      }}
      exit={{ 
        x: 450,
        opacity: 0,
        scale: 0.9,
      }}
      transition={{
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1], // iOS spring easing
        opacity: { duration: 0.3 },
      }}
      className="fixed right-4 top-4 bottom-4 w-[400px] bg-[#313338] rounded-lg shadow-2xl flex flex-col z-50 border border-[#1e1f22]"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          delay: 0.15,
          duration: 0.3,
          ease: [0.16, 1, 0.3, 1]
        }}
        className="h-12 px-4 flex items-center gap-2 border-b border-[#1e1f22] bg-[#2b2d31] rounded-t-lg"
      >
        <Hash size={20} className="text-gray-400" />
        <span className="text-white flex-1">{channelId}</span>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white p-1 h-auto">
          <X size={20} />
        </Button>
      </motion.div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        <AnimatePresence mode="wait">
          <motion.div 
            key={channelId}
            initial={{ opacity: 0, x: 20, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.98 }}
            transition={{
              duration: 0.3,
              ease: [0.16, 1, 0.3, 1]
            }}
            className="space-y-3"
          >
            {mockMessages.map((msg, index) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, x: 30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{
                  delay: 0.1 + (index * 0.04),
                  duration: 0.3,
                  ease: [0.16, 1, 0.3, 1]
                }}
                className="flex gap-2 hover:bg-[#2e3035] -mx-2 px-2 py-1 rounded"
              >
                <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                  <AvatarFallback className="text-xs">{msg.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-white text-sm">{msg.author}</span>
                    <span className="text-gray-400 text-xs">{msg.timestamp}</span>
                  </div>
                  <div className="text-gray-300 text-sm mt-0.5">{msg.content}</div>
                  {msg.task && (
                    <motion.button
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => onTaskClick(msg.task!)}
                      className="mt-2 p-2 bg-[#2b2d31] rounded-lg border-l-4 border-blue-500 hover:bg-[#35363c] transition-colors text-left w-full"
                    >
                      <div className="flex items-start gap-1 mb-1 flex-wrap">
                        <Badge variant="outline" className="text-xs h-5">
                          {msg.task.id}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs h-5 ${
                            msg.task.priority === 'urgent' ? 'border-red-500 text-red-500' :
                            msg.task.priority === 'high' ? 'border-orange-500 text-orange-500' :
                            msg.task.priority === 'medium' ? 'border-yellow-500 text-yellow-500' :
                            'border-gray-500 text-gray-500'
                          }`}
                        >
                          {msg.task.priority}
                        </Badge>
                      </div>
                      <div className="text-white text-sm mb-1">{msg.task.title}</div>
                      <div className="text-gray-400 text-xs line-clamp-1">{msg.task.description}</div>
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </ScrollArea>

      {/* Message input */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          delay: 0.25,
          duration: 0.3,
          ease: [0.16, 1, 0.3, 1]
        }}
        className="p-3 border-t border-[#1e1f22]"
      >
        <div className="flex gap-2">
          <Input
            placeholder={`Message #${channelId}`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-[#383a40] border-none text-gray-200 placeholder:text-gray-500 text-sm"
          />
          <Button size="sm" className="bg-[#5865f2] hover:bg-[#4752c4] px-3">
            <Send size={16} />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}