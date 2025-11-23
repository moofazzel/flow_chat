"use client";

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
  Reply,
  Search,
  Send,
  Smile,
  Trash2,
  UserPlus,
  Video,
  X,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { chatService } from "@/lib/chatService";
import { AddToGroupModal } from "./AddToGroupModal";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { VoiceRecorder } from "./VoiceRecorder";

interface DirectMessageChatProps {
  selectedDM: {
    userId: string;
    userName: string;
    userAvatar: string;
    userStatus: "online" | "idle" | "dnd" | "offline";
    threadId: string;
  } | null;
  currentUserId?: string;
  currentUserName?: string;
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
  reactions?: { emoji: string; count: number; users: string[] }[];
}

const EMOJI_LIST = [":)", ":D", "<3", "👍", "🔥", "🎉", "🙌", "😎"];

export function EnhancedDirectMessageChat({
  selectedDM,
  currentUserId = "anon",
  currentUserName = "You",
  onBack,
}: DirectMessageChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAddToGroupModal, setShowAddToGroupModal] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!selectedDM) {
      setMessages([]);
      return;
    }
    chatService.listMessages("dm", selectedDM.threadId).then((list) => {
      const mapped: Message[] = list.map((m) => ({
        id: m.id,
        content: m.content,
        timestamp: new Date(m.createdAt).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        isCurrentUser: m.authorId === currentUserId,
        isEdited: Boolean(m.editedAt),
        replyTo: m.replyToId ? { id: m.replyToId, content: "", author: "" } : undefined,
      }));
      setMessages(mapped);
    });
  }, [selectedDM, currentUserId]);

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

  const handleSend = () => {
    if (!selectedDM || !newMessage.trim()) return;
    chatService
      .sendMessage({
        scope: "dm",
        threadId: selectedDM.threadId,
        authorId: currentUserId,
        content: newMessage,
        replyToId: replyingTo?.id,
      })
      .then((msg) => {
        setMessages((prev) => [
          ...prev,
          {
            id: msg.id,
            content: msg.content,
            timestamp: new Date(msg.createdAt).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            }),
            isCurrentUser: true,
            replyTo: replyingTo
              ? { id: replyingTo.id, content: replyingTo.content, author: replyingTo.isCurrentUser ? "You" : selectedDM.userName }
              : undefined,
          },
        ]);
        setNewMessage("");
        setReplyingTo(null);
        toast.success("Message sent!");
      });
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = m.reactions || [];
        const existing = reactions.find((r) => r.emoji === emoji);
        if (existing) {
          const has = existing.users.includes("You");
          const users = has ? existing.users.filter((u) => u !== "You") : [...existing.users, "You"];
          const nextReactions = users.length
            ? reactions.map((r) => (r.emoji === emoji ? { ...r, users, count: users.length } : r))
            : reactions.filter((r) => r.emoji !== emoji);
          return { ...m, reactions: nextReactions };
        }
        return { ...m, reactions: [...reactions, { emoji, count: 1, users: ["You"] }] };
      })
    );
    chatService.reactToMessage(messageId, emoji, currentUserId);
  };

  const handleDelete = (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    chatService.deleteMessage(messageId, currentUserId);
  };

  const handleEditSave = () => {
    if (!editingMessage) return;
    setMessages((prev) => prev.map((m) => (m.id === editingMessage ? { ...m, content: editContent, isEdited: true } : m)));
    chatService.editMessage(editingMessage, currentUserId, editContent);
    setEditingMessage(null);
    setEditContent("");
  };

  return (
    <div className="flex-1 flex flex-col bg-[#313338]">
      <div className="h-12 px-4 flex items-center gap-3 border-b border-[#1e1f22]">
        {onBack && (
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2 h-auto" onClick={onBack}>
            <Reply size={16} className="rotate-180" />
          </Button>
        )}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#5865f2] text-white text-xs">{selectedDM?.userAvatar}</AvatarFallback>
            </Avatar>
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#313338] ${getStatusColor()}`} />
          </div>
          <div>
            <div className="text-white text-sm">{selectedDM?.userName}</div>
            <div className="text-gray-400 text-xs capitalize">{selectedDM?.userStatus}</div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2 h-auto">
            <Phone size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2 h-auto">
            <Video size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2 h-auto">
            <UserPlus size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2 h-auto">
            <Search size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2 h-auto">
            <MoreVertical size={16} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.isCurrentUser ? "flex-row-reverse text-right" : ""}`}
              onMouseEnter={() => setHoveredMessage(msg.id)}
              onMouseLeave={() => setHoveredMessage(null)}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className={msg.isCurrentUser ? "bg-[#5865f2] text-white" : "bg-[#404249] text-gray-200"}>
                  {msg.isCurrentUser ? "You" : selectedDM?.userAvatar || "DM"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm">{msg.isCurrentUser ? currentUserName : selectedDM?.userName || "User"}</span>
                  <span className="text-[10px] text-gray-500">{msg.timestamp}</span>
                  {msg.isEdited && <span className="text-[10px] text-gray-500">(edited)</span>}
                </div>

                {msg.replyTo && (
                  <div className="text-[11px] text-gray-400 border-l-2 border-[#5865f2] pl-2 mb-1 line-clamp-1">
                    Replying to {msg.replyTo.author}: {msg.replyTo.content}
                  </div>
                )}

                <div className={`rounded-lg px-3 py-2 ${msg.isCurrentUser ? "bg-[#4b4deb]" : "bg-[#2b2d31]"} text-gray-100 text-sm whitespace-pre-wrap`}>
                  {msg.content}
                </div>

                {hoveredMessage === msg.id && (
                  <div className={`flex items-center gap-1 mt-1 ${msg.isCurrentUser ? "justify-end" : ""}`}>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-1 h-auto" onClick={() => setReplyingTo(msg)}>
                      <Reply size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-1 h-auto" onClick={() => handleAddReaction(msg.id, "👍")}>
                      <Smile size={14} />
                    </Button>
                    {msg.isCurrentUser && (
                      <>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-1 h-auto" onClick={() => { setEditingMessage(msg.id); setEditContent(msg.content); }}>
                          <Edit2 size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-400 p-1 h-auto" onClick={() => handleDelete(msg.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {msg.reactions.map((reaction, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAddReaction(msg.id, reaction.emoji)}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#2b2d31] border border-[#3f4147] text-xs text-gray-200"
                        title={reaction.users.join(", ")}
                      >
                        <span>{reaction.emoji}</span>
                        <span className="text-[10px] text-gray-400">{reaction.count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-[#1e1f22] bg-[#313338]">
        {replyingTo && (
          <div className="mb-2 px-2 py-1 bg-[#2b2d31] rounded border-l-2 border-[#5865f2] flex items-center justify-between text-xs text-gray-300">
            <span>Replying to {replyingTo.isCurrentUser ? "You" : selectedDM?.userName || "User"}: {replyingTo.content}</span>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-1 h-auto" onClick={() => setReplyingTo(null)}>
              <X size={12} />
            </Button>
          </div>
        )}

        {editingMessage && (
          <div className="mb-2 px-2 py-1 bg-[#2b2d31] rounded border-l-2 border-yellow-500 flex items-center justify-between text-xs text-gray-300">
            <span>Editing message</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300 p-1 h-auto" onClick={handleEditSave}>
                <Check size={12} />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-1 h-auto" onClick={() => { setEditingMessage(null); setEditContent(""); }}>
                <X size={12} />
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2 h-auto">
              <Paperclip size={16} />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2 h-auto">
              <ImageIcon size={16} />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2 h-auto" onClick={() => setShowVoiceRecorder(true)}>
              <Mic size={16} />
            </Button>
          </div>

          <div className="flex-1 bg-[#2b2d31] rounded-lg border border-[#3f4147] px-3 py-2">
            <input
              value={editingMessage ? editContent : newMessage}
              onChange={(e) => (editingMessage ? setEditContent(e.target.value) : setNewMessage(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (editingMessage) {
                    handleEditSave();
                  } else {
                    handleSend();
                  }
                }
              }}
              className="w-full bg-transparent outline-none text-sm text-white placeholder:text-gray-500"
              placeholder={`Message ${selectedDM?.userName || "user"}`}
            />
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2 h-auto" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
              <Smile size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#5865f2] hover:text-[#4752c4] p-2 h-auto"
              disabled={!newMessage.trim() && !editingMessage}
              onClick={() => {
                if (editingMessage) {
                  handleEditSave();
                } else {
                  handleSend();
                }
              }}
            >
              <Send size={16} />
            </Button>
          </div>
        </div>

        {showEmojiPicker && (
          <div className="mt-2 bg-[#2b2d31] rounded border border-[#3f4147] p-2 grid grid-cols-8 gap-1">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                className="text-lg hover:bg-[#35363c] rounded p-1"
                onClick={() => {
                  setNewMessage((prev) => prev + emoji);
                  setShowEmojiPicker(false);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showVoiceRecorder && (
          <VoiceRecorder
            isOpen={showVoiceRecorder}
            onClose={() => setShowVoiceRecorder(false)}
            onSave={(audioUrl) => {
              chatService.sendMessage({
                scope: "dm",
                threadId: selectedDM?.threadId || "",
                authorId: currentUserId,
                content: "[voice message]",
              });
              setShowVoiceRecorder(false);
              toast.success("Voice message saved");
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddToGroupModal && (
          <AddToGroupModal
            isOpen={showAddToGroupModal}
            onClose={() => setShowAddToGroupModal(false)}
            selectedUser={{
              userId: selectedDM?.userId || "",
              userName: selectedDM?.userName || "",
              userAvatar: selectedDM?.userAvatar || "",
              userStatus: selectedDM?.userStatus || "offline",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
