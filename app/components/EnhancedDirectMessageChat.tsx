import {
    Check,
    Download,
    Edit2,
    File,
    Image as ImageIcon,
    Mic,
    MoreVertical,
    Paperclip,
    Phone,
    Pin,
    Plus,
    Reply,
    Search,
    Send, Smile,
    Trash2,
    UserPlus,
    Video,
    X
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AddToGroupModal } from './AddToGroupModal';
import { ImageViewerModal } from './ImageViewerModal';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { VoicePlayer } from './VoicePlayer';
import { VoiceRecorder } from './VoiceRecorder';

interface DirectMessageChatProps {
  selectedDM: {
    userId: string;
    userName: string;
    userAvatar: string;
    userStatus: 'online' | 'idle' | 'dnd' | 'offline';
  } | null;
  onBack?: () => void;
}

interface MessageAttachment {
  id: string;
  type: 'image' | 'file' | 'voice' | 'video';
  url: string;
  name: string;
  size?: string;
  duration?: number; // For voice/video
}

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isCurrentUser: boolean;
  isEdited?: boolean;
  replyTo?: {
    id: string;
    content: string;
    author: string;
  };
  reactions?: { emoji: string; count: number; users: string[] }[];
  attachments?: MessageAttachment[];
}

const mockDMMessages: Message[] = [
  {
    id: '1',
    content: 'Hey! Did you see the latest design updates?',
    timestamp: '10:30 AM',
    isCurrentUser: false,
  },
  {
    id: '2',
    content: 'Yes! They look amazing. I especially like the new color scheme.',
    timestamp: '10:32 AM',
    isCurrentUser: true,
  },
];

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥'];
const RECENT_REACTIONS = ['👍', '❤️', '😂', '🔥']; // Most commonly used

export function EnhancedDirectMessageChat({ selectedDM, onBack }: DirectMessageChatProps) {
  const [messages, setMessages] = useState<Message[]>(mockDMMessages);
  const [newMessage, setNewMessage] = useState('');
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerForMessage, setEmojiPickerForMessage] = useState<string | null>(null);
  const [showAddToGroupModal, setShowAddToGroupModal] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getStatusColor = () => {
    if (!selectedDM) return 'bg-gray-500';
    switch (selectedDM.userStatus) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: `${Date.now()}`,
        content: newMessage,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        isCurrentUser: true,
        replyTo: replyingTo ? {
          id: replyingTo.id,
          content: replyingTo.content,
          author: replyingTo.isCurrentUser ? 'You' : selectedDM?.userName || 'User'
        } : undefined,
      };
      setMessages([...messages, message]);
      setNewMessage('');
      setReplyingTo(null);
      toast.success('Message sent!');
    }
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const imageUrl = event.target?.result as string;
            const message: Message = {
              id: `${Date.now()}-${Math.random()}`,
              content: '',
              timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
              isCurrentUser: true,
              attachments: [{
                id: `att-${Date.now()}`,
                type: 'image',
                url: imageUrl,
                name: file.name,
                size: `${(file.size / 1024).toFixed(1)} KB`,
              }]
            };
            setMessages(prev => [...prev, message]);
            toast.success(`Image uploaded: ${file.name}`);
          };
          reader.readAsDataURL(file);
        }
      });
    }
    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const fileUrl = event.target?.result as string;
          const message: Message = {
            id: `${Date.now()}-${Math.random()}`,
            content: '',
            timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            isCurrentUser: true,
            attachments: [{
              id: `att-${Date.now()}`,
              type: 'file',
              url: fileUrl,
              name: file.name,
              size: `${(file.size / 1024).toFixed(1)} KB`,
            }]
          };
          setMessages(prev => [...prev, message]);
          toast.success(`File uploaded: ${file.name}`);
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Voice Note Handler
  const handleVoiceNoteSend = (audioBlob: Blob, duration: number) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const message: Message = {
      id: `${Date.now()}`,
      content: '',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      isCurrentUser: true,
      attachments: [{
        id: `att-${Date.now()}`,
        type: 'voice',
        url: audioUrl,
        name: 'Voice Note',
        duration: duration,
      }]
    };
    setMessages(prev => [...prev, message]);
    setShowVoiceRecorder(false);
    toast.success('Voice note sent!');
  };

  const handleEditMessage = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message) {
      setEditingMessage(messageId);
      setEditContent(message.content);
    }
  };

  const handleSaveEdit = () => {
    if (editingMessage && editContent.trim()) {
      setMessages(
        messages.map((m) =>
          m.id === editingMessage ? { ...m, content: editContent, isEdited: true } : m
        )
      );
      setEditingMessage(null);
      setEditContent('');
      toast.success('Message edited!');
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(messages.filter((m) => m.id !== messageId));
    toast.success('Message deleted!');
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    setMessages(messages.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || [];
        const existingReaction = reactions.find(r => r.emoji === emoji);
        
        if (existingReaction) {
          // Add user to existing reaction
          return {
            ...msg,
            reactions: reactions.map(r =>
              r.emoji === emoji
                ? { ...r, count: r.count + 1, users: [...r.users, 'You'] }
                : r
            )
          };
        } else {
          // Add new reaction
          return {
            ...msg,
            reactions: [...reactions, { emoji, count: 1, users: ['You'] }]
          };
        }
      }
      return msg;
    }));
    setEmojiPickerForMessage(null);
    toast.success(`Reacted with ${emoji}`);
  };

  const handleImageClick = (url: string, name: string) => {
    setSelectedImage({ url, name });
    setShowImageViewer(true);
  };

  const handleDownloadFile = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloading ${name}`);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#313338]">
      {/* DM Header */}
      <div className="h-12 px-4 flex items-center border-b border-[#1e1f22] shadow-sm">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-[#5865f2]">{selectedDM?.userAvatar}</AvatarFallback>
            </Avatar>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#313338] ${getStatusColor()}`} />
          </div>
          <span className="text-white">{selectedDM?.userName}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200 p-1.5 h-auto" title="Voice Call">
            <Phone size={18} />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200 p-1.5 h-auto" title="Video Call">
            <Video size={18} />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200 p-1.5 h-auto" title="Pinned Messages">
            <Pin size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-200 p-1.5 h-auto"
            title="Add to Group"
            onClick={() => setShowAddToGroupModal(true)}
          >
            <UserPlus size={18} />
          </Button>

          <div className="relative ml-2">
            <Input
              placeholder="Search"
              className="w-32 h-7 bg-[#1e1f22] border-none text-xs pr-7"
            />
            <Search size={14} className="absolute right-2 top-1.5 text-gray-400 pointer-events-none" />
          </div>

          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200 p-1.5 h-auto">
            <MoreVertical size={18} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
          {messages.map((message, index) => {
            const prevMessage = messages[index - 1];
            const isGrouped = prevMessage && prevMessage.isCurrentUser === message.isCurrentUser;

            return (
              <div
                key={message.id}
                onMouseEnter={() => setHoveredMessage(message.id)}
                onMouseLeave={() => setHoveredMessage(null)}
                className={`flex gap-3 ${message.isCurrentUser ? 'flex-row-reverse' : ''} group relative`}
              >
                {/* Avatar */}
                {!isGrouped && (
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="bg-[#5865f2] text-white">
                      {message.isCurrentUser ? 'You' : selectedDM?.userAvatar}
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* Message Content */}
                <div className={`flex-1 ${isGrouped ? (message.isCurrentUser ? 'mr-[52px]' : 'ml-[52px]') : ''}`}>
                  {!isGrouped && (
                    <div className={`flex items-baseline gap-2 mb-1 ${message.isCurrentUser ? 'flex-row-reverse' : ''}`}>
                      <span className="text-white text-sm">
                        {message.isCurrentUser ? 'You' : selectedDM?.userName}
                      </span>
                      <span className="text-gray-500 text-xs">{message.timestamp}</span>
                    </div>
                  )}

                  {/* Reply Preview */}
                  {message.replyTo && (
                    <div className={`mb-2 pl-2 border-l-2 border-gray-500 ${message.isCurrentUser ? 'mr-0 ml-auto' : ''} max-w-[70%]`}>
                      <div className="text-xs text-gray-400">
                        Replying to <span className="text-gray-300">{message.replyTo.author}</span>
                      </div>
                      <div className="text-xs text-gray-500 truncate">{message.replyTo.content}</div>
                    </div>
                  )}

                  {editingMessage === message.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') {
                            setEditingMessage(null);
                            setEditContent('');
                          }
                        }}
                        className="bg-[#383a40] border-none text-white text-sm"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleSaveEdit} className="bg-[#248046] hover:bg-[#1a6334] p-2 h-auto">
                        <Check size={16} />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingMessage(null);
                          setEditContent('');
                        }}
                        variant="ghost"
                        className="text-gray-400 hover:text-white p-2 h-auto"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Text Message */}
                      {message.content && (
                        <div
                          className={`inline-block px-3 py-2 rounded-lg ${
                            message.isCurrentUser
                              ? 'bg-[#5865f2] text-white'
                              : 'bg-[#2b2d31] text-gray-200'
                          } max-w-[70%]`}
                        >
                          <p className="text-sm break-words">{message.content}</p>
                          {message.isEdited && (
                            <span className="text-xs opacity-50 ml-1">(edited)</span>
                          )}
                        </div>
                      )}

                      {/* Attachments */}
                      {message.attachments?.map((attachment) => (
                        <div key={attachment.id}>
                          {attachment.type === 'image' && (
                            <div
                              className="cursor-pointer rounded-lg overflow-hidden max-w-sm hover:opacity-90 transition-opacity"
                              onClick={() => handleImageClick(attachment.url, attachment.name)}
                            >
                              <img src={attachment.url} alt={attachment.name} className="w-full h-auto" />
                              <div className="bg-[#2b2d31] px-3 py-2 text-xs text-gray-400">
                                {attachment.name} • {attachment.size}
                              </div>
                            </div>
                          )}

                          {attachment.type === 'file' && (
                            <div className="bg-[#2b2d31] rounded-lg p-3 max-w-sm flex items-center gap-3">
                              <div className="w-10 h-10 rounded bg-[#5865f2] flex items-center justify-center">
                                <File size={20} className="text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-white text-sm truncate">{attachment.name}</div>
                                <div className="text-gray-400 text-xs">{attachment.size}</div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-gray-400 hover:text-white p-2"
                                onClick={() => handleDownloadFile(attachment.url, attachment.name)}
                              >
                                <Download size={18} />
                              </Button>
                            </div>
                          )}

                          {attachment.type === 'voice' && (
                            <VoicePlayer
                              audioUrl={attachment.url}
                              duration={attachment.duration || 0}
                              isOwn={message.isCurrentUser}
                            />
                          )}
                        </div>
                      ))}

                      {/* Reactions */}
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {message.reactions.map((reaction, idx) => (
                            <div
                              key={idx}
                              className="bg-[#2b2d31] rounded-full px-2 py-0.5 flex items-center gap-1 text-xs"
                            >
                              <span>{reaction.emoji}</span>
                              <span className="text-gray-400">{reaction.count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Message Actions with Quick Reactions */}
                {hoveredMessage === message.id && editingMessage !== message.id && emojiPickerForMessage !== message.id && (
                  <div className={`absolute -top-4 ${message.isCurrentUser ? 'right-0' : 'left-0'} flex items-center gap-1 bg-[#2f3136] border border-[#202225] rounded-full shadow-lg px-1 py-1`}>
                    {/* Quick Reactions */}
                    {RECENT_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleAddReaction(message.id, emoji)}
                        className="hover:bg-[#383a40] rounded-full p-1.5 text-lg transition-colors"
                        title={`React with ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                    <div className="w-px h-4 bg-[#202225] mx-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1.5 h-auto w-auto text-gray-400 hover:text-white rounded-full"
                      onClick={() => setEmojiPickerForMessage(message.id)}
                      title="More reactions"
                    >
                      <Plus size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1.5 h-auto w-auto text-gray-400 hover:text-white rounded-full"
                      onClick={() => handleReply(message)}
                      title="Reply"
                    >
                      <Reply size={14} />
                    </Button>
                    {message.isCurrentUser && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 h-auto w-auto text-gray-400 hover:text-white rounded-full"
                          onClick={() => handleEditMessage(message.id)}
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 h-auto w-auto text-gray-400 hover:text-red-400 rounded-full"
                          onClick={() => handleDeleteMessage(message.id)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {/* All Emoji Picker */}
                {emojiPickerForMessage === message.id && (
                  <div className={`absolute ${message.isCurrentUser ? 'right-0' : 'left-0'} top-8 bg-[#2b2d31] border border-[#1e1f22] rounded-lg shadow-xl p-3 z-10`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 text-sm">Pick a reaction</span>
                      <button
                        onClick={() => setEmojiPickerForMessage(null)}
                        className="hover:bg-[#383a40] rounded p-1 text-gray-400"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {EMOJI_LIST.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleAddReaction(message.id, emoji)}
                          className="hover:bg-[#383a40] rounded p-2 text-2xl transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Voice Recorder */}
      <AnimatePresence>
        {showVoiceRecorder && (
          <div className="px-4 pb-2">
            <VoiceRecorder
              onSend={handleVoiceNoteSend}
              onCancel={() => setShowVoiceRecorder(false)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 pt-2">
          <div className="bg-[#2b2d31] rounded-lg p-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400">
                Replying to <span className="text-white">{replyingTo.isCurrentUser ? 'yourself' : selectedDM?.userName}</span>
              </div>
              <div className="text-sm text-gray-300 truncate max-w-md">{replyingTo.content}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
              onClick={() => setReplyingTo(null)}
            >
              <X size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="px-4 pb-6 pt-2">
        <div className="bg-[#383a40] rounded-lg flex items-center px-3 py-2">
          {/* Attachment Menu */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 h-auto text-gray-400 hover:text-gray-200 mr-2"
              onClick={() => {
                const menu = document.getElementById('attachment-menu');
                menu?.classList.toggle('hidden');
              }}
            >
              <Plus size={20} />
            </Button>
            
            {/* Attachment Popup Menu */}
            <div id="attachment-menu" className="hidden absolute bottom-full left-0 mb-2 bg-[#2b2d31] rounded-lg shadow-xl p-2 space-y-1 w-48">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-[#383a40]"
                onClick={() => {
                  imageInputRef.current?.click();
                  document.getElementById('attachment-menu')?.classList.add('hidden');
                }}
              >
                <ImageIcon size={18} className="mr-2" />
                Upload Image
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-[#383a40]"
                onClick={() => {
                  fileInputRef.current?.click();
                  document.getElementById('attachment-menu')?.classList.add('hidden');
                }}
              >
                <Paperclip size={18} className="mr-2" />
                Upload File
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-[#383a40]"
                onClick={() => {
                  setShowVoiceRecorder(true);
                  document.getElementById('attachment-menu')?.classList.add('hidden');
                }}
              >
                <Mic size={18} className="mr-2" />
                Record Voice
              </Button>
            </div>
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Text Input */}
          <Input
            ref={inputRef}
            placeholder={`Message @${selectedDM?.userName}`}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="border-none bg-transparent text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-1 ml-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 h-auto text-gray-400 hover:text-gray-200"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile size={20} />
            </Button>
            
            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              size="sm"
              className={`p-1 h-auto ml-1 ${
                newMessage.trim() 
                  ? 'text-white bg-[#5865f2] hover:bg-[#4752c4]' 
                  : 'text-gray-500 bg-transparent cursor-not-allowed'
              }`}
            >
              <Send size={20} />
            </Button>
          </div>
        </div>
        <div className="text-gray-500 text-[11px] mt-1 px-1">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>

      {/* Image Viewer Modal */}
      {selectedImage && (
        <ImageViewerModal
          open={showImageViewer}
          onClose={() => {
            setShowImageViewer(false);
            setSelectedImage(null);
          }}
          imageUrl={selectedImage.url}
          imageName={selectedImage.name}
        />
      )}

      {/* Add to Group Modal */}
      <AddToGroupModal
        open={showAddToGroupModal}
        onClose={() => setShowAddToGroupModal(false)}
        currentUser={{
          userId: selectedDM?.userId || '',
          userName: selectedDM?.userName || ''
        }}
      />
    </div>
  );
}