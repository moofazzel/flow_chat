import { Check, X, Clock, UserPlus, Inbox } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { motion } from 'motion/react';

export interface FriendRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  timestamp: string;
  type: 'incoming' | 'outgoing';
}

interface FriendRequestsPanelProps {
  requests: FriendRequest[];
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  onCancel: (requestId: string) => void;
}

export function FriendRequestsPanel({ 
  requests, 
  onAccept, 
  onDecline,
  onCancel 
}: FriendRequestsPanelProps) {
  const incomingRequests = requests.filter(r => r.type === 'incoming');
  const outgoingRequests = requests.filter(r => r.type === 'outgoing');

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col bg-[#313338]">
      <div className="h-14 px-4 flex items-center border-b border-[#1e1f22]">
        <div className="flex items-center gap-2">
          <Inbox size={20} className="text-gray-400" />
          <h2 className="text-white font-semibold">Friend Requests</h2>
          {requests.length > 0 && (
            <span className="bg-[#ed4245] text-white text-xs rounded-full px-2 py-0.5">
              {requests.length}
            </span>
          )}
        </div>
      </div>

      <Tabs defaultValue="incoming" className="flex-1 flex flex-col">
        <div className="px-4 pt-3">
          <TabsList className="grid w-full grid-cols-2 bg-[#2b2d31]">
            <TabsTrigger value="incoming" className="data-[state=active]:bg-[#5865f2]">
              <UserPlus size={16} className="mr-2" />
              Incoming ({incomingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="data-[state=active]:bg-[#5865f2]">
              <Clock size={16} className="mr-2" />
              Pending ({outgoingRequests.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Incoming Requests */}
        <TabsContent value="incoming" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {incomingRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Inbox size={48} className="text-gray-600 mb-4" />
                  <h3 className="text-white text-lg font-medium mb-2">No pending requests</h3>
                  <p className="text-gray-400 text-sm">
                    When someone sends you a friend request, it will appear here
                  </p>
                </div>
              ) : (
                incomingRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#2b2d31] rounded-lg p-4 hover:bg-[#35363c] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                          {request.userAvatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-white font-medium">{request.userName}</h3>
                          <span className="text-gray-500 text-xs">
                            {formatTimestamp(request.timestamp)}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-3">{request.userEmail}</p>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => onAccept(request.id)}
                            size="sm"
                            className="flex-1 bg-[#248046] hover:bg-[#1a6334] text-white"
                          >
                            <Check size={16} className="mr-1" />
                            Accept
                          </Button>
                          <Button
                            onClick={() => onDecline(request.id)}
                            size="sm"
                            variant="outline"
                            className="flex-1 border-[#ed4245] text-[#ed4245] hover:bg-[#ed4245] hover:text-white"
                          >
                            <X size={16} className="mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Outgoing Requests */}
        <TabsContent value="outgoing" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {outgoingRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock size={48} className="text-gray-600 mb-4" />
                  <h3 className="text-white text-lg font-medium mb-2">No pending requests</h3>
                  <p className="text-gray-400 text-sm">
                    Friend requests you've sent will appear here
                  </p>
                </div>
              ) : (
                outgoingRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#2b2d31] rounded-lg p-4 hover:bg-[#35363c] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                          {request.userAvatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-white font-medium">{request.userName}</h3>
                          <span className="text-gray-500 text-xs">
                            {formatTimestamp(request.timestamp)}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-3">{request.userEmail}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-yellow-500 text-sm">
                            <Clock size={14} />
                            <span>Waiting for response...</span>
                          </div>
                          <Button
                            onClick={() => onCancel(request.id)}
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:text-white hover:bg-[#ed4245]"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
