import {
  AtSign,
  Check,
  Edit2,
  Gift,
  Image as ImageIcon,
  MoreVertical,
  Phone,
  Pin,
  PlusCircle,
  Search,
  Smile,
  Trash2,
  UserPlus,
  Video,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import type { Task } from "../page";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";

interface DirectMessageChatProps {
  onTaskClick?: (task: Task) => void;
  selectedDM: {
    userId: string;
    userName: string;
    userAvatar: string;
    userStatus: "online" | "idle" | "dnd" | "offline";
  } | null;
  onBack?: () => void;
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
}

export function DirectMessageChat({
  onTaskClick: _onTaskClick,
  selectedDM,
  onBack: _onBack,
}: DirectMessageChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const getStatusColor = () => {
    if (!selectedDM) return "bg-gray-500";
    switch (selectedDM.userStatus) {
      case "online":
        return "bg-green-500";
      case "idle":
        return "bg-yellow-500";
      case "dnd":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: `${messages.length + 1}`,
        content: newMessage,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        isCurrentUser: true,
      };
      setMessages([...messages, message]);
      setNewMessage("");
    }
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
          m.id === editingMessage
            ? { ...m, content: editContent, isEdited: true }
            : m
        )
      );
      setEditingMessage(null);
      setEditContent("");
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (confirm("Delete this message?")) {
      setMessages(messages.filter((m) => m.id !== messageId));
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#313338]">
      {/* DM Header */}
      <div className="h-12 px-4 flex items-center border-b border-[#1e1f22] shadow-sm">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-[#5865f2]">
                {selectedDM?.userAvatar}
              </AvatarFallback>
            </Avatar>
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#313338] ${getStatusColor()}`}
            />
          </div>
          <span className="text-white">{selectedDM?.userName}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-200 p-1.5 h-auto"
            title="Voice Call"
          >
            <Phone size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-200 p-1.5 h-auto"
            title="Video Call"
          >
            <Video size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-200 p-1.5 h-auto"
            title="Pinned Messages"
          >
            <Pin size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-200 p-1.5 h-auto"
            title="Add to Group"
          >
            <UserPlus size={18} />
          </Button>

          <div className="relative ml-2">
            <Input
              placeholder="Search"
              className="w-32 h-7 bg-[#1e1f22] border-none text-xs pr-7"
            />
            <Search
              size={14}
              className="absolute right-2 top-1.5 text-gray-400 pointer-events-none"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-200 p-1.5 h-auto"
          >
            <MoreVertical size={18} />
          </Button>
        </div>
      </div>

      {/* User Profile Banner */}
      <div className="px-4 py-6 bg-[#2b2d31] border-b border-[#1e1f22]">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl bg-[#5865f2]">
                {selectedDM?.userAvatar}
              </AvatarFallback>
            </Avatar>
            <div
              className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-[#2b2d31] ${getStatusColor()}`}
            />
          </div>
          <h2 className="text-white text-xl mb-1">{selectedDM?.userName}</h2>
          <div className="flex items-center gap-1 text-gray-400 text-sm mb-4">
            <span className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            <span className="capitalize">{selectedDM?.userStatus}</span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-[#5865f2] hover:bg-[#4752c4] text-white gap-2"
            >
              <AtSign size={16} />
              Mention
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-[#4e5058] text-gray-300 hover:text-white gap-2"
            >
              <Phone size={16} />
              Call
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-[#4e5058] text-gray-300 hover:text-white gap-2"
            >
              <Video size={16} />
              Video
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
          {messages.map((message, index) => {
            const prevMessage = messages[index - 1];
            const isGrouped =
              prevMessage &&
              prevMessage.isCurrentUser === message.isCurrentUser;

            return (
              <div
                key={message.id}
                onMouseEnter={() => setHoveredMessage(message.id)}
                onMouseLeave={() => setHoveredMessage(null)}
                className={`flex gap-3 ${
                  message.isCurrentUser ? "flex-row-reverse" : ""
                } group relative`}
              >
                {/* Avatar */}
                {!isGrouped && (
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-[#5865f2] text-white">
                      {message.isCurrentUser ? "JD" : selectedDM?.userAvatar}
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* Message Content */}
                <div
                  className={`flex-1 ${
                    isGrouped
                      ? message.isCurrentUser
                        ? "mr-[52px]"
                        : "ml-[52px]"
                      : ""
                  }`}
                >
                  {!isGrouped && (
                    <div
                      className={`flex items-baseline gap-2 mb-1 ${
                        message.isCurrentUser ? "flex-row-reverse" : ""
                      }`}
                    >
                      <span className="text-white text-sm">
                        {message.isCurrentUser ? "You" : selectedDM?.userName}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {message.timestamp}
                      </span>
                    </div>
                  )}

                  {editingMessage === message.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit();
                          if (e.key === "Escape") {
                            setEditingMessage(null);
                            setEditContent("");
                          }
                        }}
                        className="bg-[#383a40] border-none text-white text-sm"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        className="bg-[#3ba55d] hover:bg-[#2d7d46] p-2 h-auto"
                      >
                        <Check size={16} />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingMessage(null);
                          setEditContent("");
                        }}
                        variant="ghost"
                        className="text-gray-400 hover:text-white p-2 h-auto"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className={`inline-block px-3 py-2 rounded-lg ${
                        message.isCurrentUser
                          ? "bg-[#5865f2] text-white"
                          : "bg-[#2b2d31] text-gray-200"
                      } max-w-[70%]`}
                    >
                      <p className="text-sm break-words">{message.content}</p>
                      {message.isEdited && (
                        <span className="text-xs opacity-50 ml-1">
                          (edited)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Message Actions */}
                {hoveredMessage === message.id &&
                  message.isCurrentUser &&
                  editingMessage !== message.id && (
                    <div className="absolute top-0 right-0 flex items-center gap-1 bg-[#2f3136] border border-[#202225] rounded shadow-lg">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-6 w-6 text-gray-400 hover:text-white"
                        onClick={() => handleEditMessage(message.id)}
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-6 w-6 text-gray-400 hover:text-red-400"
                        onClick={() => handleDeleteMessage(message.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="px-4 pb-6 pt-2">
        <div className="bg-[#383a40] rounded-lg flex items-center px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto text-gray-400 hover:text-gray-200 mr-2"
          >
            <PlusCircle size={20} />
          </Button>

          <Input
            ref={inputRef}
            placeholder={`Message @${selectedDM?.userName}`}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="border-none bg-transparent text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
          />

          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-auto text-gray-400 hover:text-gray-200"
            >
              <Gift size={20} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-auto text-gray-400 hover:text-gray-200"
            >
              <ImageIcon size={20} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-auto text-gray-400 hover:text-gray-200"
            >
              <Smile size={20} />
            </Button>
          </div>
        </div>
        <div className="text-gray-500 text-[11px] mt-1 px-1">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
