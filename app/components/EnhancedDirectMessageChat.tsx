"use client";

import type { ChatMessage as RealtimeChatMessage } from "@/hooks/use-dm-chat";
import { useDmChat } from "@/hooks/use-dm-chat";
import { getDmMessages, sendDmMessage } from "@/lib/friendService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { endCall, receiveCall, startCall } from "@/store/slices/callSlice";
import { createClient } from "@/utils/supabase/client";
import {
  Edit2,
  MoreVertical,
  Phone,
  Reply,
  Search,
  Send,
  Smile,
  Trash2,
  UserPlus,
  Video,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ChatLoadingSkeleton } from "./ChatLoadingSkeleton";
import { DirectCallModal } from "./DirectCallModal";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
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
  fullTimestamp: string;
  isCurrentUser: boolean;
  senderName: string;
  isEdited?: boolean;
  replyTo?: {
    id: string;
    content: string;
    author: string;
  };
  reactions?: { emoji: string; count: number; users: string[] }[];
}

const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "🎉"];

export function EnhancedDirectMessageChat({
  selectedDM,
  currentUserId = "anon",
  currentUserName = "You",
  onBack,
}: DirectMessageChatProps) {
  const [newMessage, setNewMessage] = useState("");
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [dbMessages, setDbMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Redux state
  const dispatch = useAppDispatch();
  const { isCallModalOpen, callType, isInitiator, incomingOffer } =
    useAppSelector((state) => state.call);

  // Debug: Log Redux call state changes - only when modal opens
  useEffect(() => {
    if (isCallModalOpen) {
      console.log("[EnhancedDMChat] Call modal opened:", {
        callType,
        isInitiator,
        hasIncomingOffer: !!incomingOffer,
      });
    }
  }, [isCallModalOpen, callType, isInitiator, incomingOffer]);

  // Use the broadcast-based realtime chat hook
  const {
    messages: realtimeMessages,
    sendMessage: broadcastMessage,
    sendReaction,
    editMessage,
    deleteMessage,
    isConnected,
    clearMessages,
    otherUserTyping,
    handleTyping,
  } = useDmChat({
    threadId: selectedDM?.threadId || "",
    currentUserId,
    currentUserName,
  });

  // Convert ChatMessage to Message format
  const convertToMessage = useCallback(
    (msg: RealtimeChatMessage): Message => ({
      id: msg.id,
      content: msg.content,
      timestamp: new Date(msg.createdAt).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      fullTimestamp: msg.createdAt,
      isCurrentUser: msg.senderId === currentUserId,
      senderName: msg.senderName,
      isEdited: msg.isEdited,
      replyTo: msg.replyToId
        ? { id: msg.replyToId, content: "", author: "" }
        : undefined,
      reactions:
        msg.reactions?.map((r) => ({
          emoji: r.emoji,
          count: r.count,
          users: r.users.map((u) => u.userName),
        })) || [],
    }),
    [currentUserId]
  );

  // Merge database messages with realtime messages
  const allMessages = useMemo(() => {
    const realtimeConverted = realtimeMessages.map(convertToMessage);

    // Use a Map to merge messages properly, keeping the latest version
    const messageMap = new Map<string, Message>();

    // First add DB messages
    dbMessages.forEach((msg) => {
      messageMap.set(msg.id, msg);
    });

    // Then merge/update with realtime messages (these have the latest reactions/edits)
    realtimeConverted.forEach((msg) => {
      const existing = messageMap.get(msg.id);
      if (existing) {
        // Merge: keep db message but update with realtime data (reactions, edits, etc)
        messageMap.set(msg.id, {
          ...existing,
          content: msg.content,
          isEdited: msg.isEdited,
          reactions: msg.reactions,
        });
      } else {
        // New message from realtime
        messageMap.set(msg.id, msg);
      }
    });

    // Convert back to array and sort
    const merged = Array.from(messageMap.values());
    return merged.sort((a, b) => {
      return (
        new Date(a.fullTimestamp).getTime() -
        new Date(b.fullTimestamp).getTime()
      );
    });
  }, [dbMessages, realtimeMessages, convertToMessage]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  // Debug: Log hook functions availability
  useEffect(() => {
    console.log("Hook functions check:", {
      sendReaction: typeof sendReaction,
      editMessage: typeof editMessage,
      deleteMessage: typeof deleteMessage,
      isConnected,
    });
  }, [sendReaction, editMessage, deleteMessage, isConnected]);

  // Load messages from database when thread changes
  useEffect(() => {
    if (!selectedDM?.threadId) {
      setDbMessages([]);
      clearMessages();
      return;
    }

    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const dmMessages = await getDmMessages(selectedDM.threadId);
        const mapped: Message[] = dmMessages.map((m) => ({
          id: m.id,
          content: m.content,
          timestamp: new Date(m.created_at).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          fullTimestamp: m.created_at,
          isCurrentUser: m.sender_id === currentUserId,
          senderName:
            m.sender_id === currentUserId
              ? currentUserName
              : selectedDM.userName,
          isEdited: m.is_edited,
          reactions: m.reactions
            ? Object.entries(m.reactions).map(([emoji, users]) => ({
                emoji,
                count: users.length,
                users,
              }))
            : [],
        }));
        setDbMessages(mapped);
        clearMessages();
      } catch (error) {
        console.error("Failed to load messages:", error);
        toast.error("Failed to load messages");
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [
    selectedDM?.threadId,
    currentUserId,
    currentUserName,
    selectedDM?.userName,
    clearMessages,
  ]);

  // Listen for incoming calls - only when the call modal is NOT open
  // This prevents conflicts with the DirectCallModal's signaling channel
  useEffect(() => {
    // Don't set up listener if modal is already open (DirectCallModal handles signaling)
    if (isCallModalOpen) {
      console.log("[CallListener] Call modal is open, skipping listener setup");
      return;
    }

    if (!selectedDM?.threadId) {
      console.log("[CallListener] No threadId, skipping call listener setup");
      return;
    }

    console.log(
      "[CallListener] Setting up call listener for thread:",
      selectedDM.threadId
    );
    console.log("[CallListener] Current user ID:", currentUserId);

    const supabase = createClient();
    // Use the same channel name as DirectCallModal but with broadcast config to not conflict
    const callChannel = supabase.channel(`dm-call:${selectedDM.threadId}`, {
      config: {
        broadcast: { self: false },
      },
    });

    let isSubscribed = false;

    callChannel
      .on(
        "broadcast",
        { event: "call-offer" },
        ({
          payload,
        }: {
          payload: {
            toUserId: string;
            fromUserId: string;
            fromUserName: string;
            callType: "audio" | "video";
            offer: RTCSessionDescriptionInit;
            sessionId?: string;
          };
        }) => {
          // Double-check modal isn't open
          if (isCallModalOpen) {
            console.log("[CallListener] Modal opened, ignoring call-offer");
            return;
          }

          console.log("[CallListener] Received call-offer event:", {
            fromUserId: payload.fromUserId,
            toUserId: payload.toUserId,
            currentUserId,
            isForMe: payload.toUserId === currentUserId,
            callType: payload.callType,
            sessionId: payload.sessionId,
          });

          // Only respond if this call is for us
          if (payload.toUserId === currentUserId) {
            console.log(
              "[CallListener] ✅ Incoming call from:",
              payload.fromUserName
            );

            dispatch(
              receiveCall({
                type: payload.callType,
                userId: payload.fromUserId,
                userName: payload.fromUserName,
                userAvatar: selectedDM.userAvatar || "",
                threadId: selectedDM.threadId,
                offer: payload.offer,
              })
            );

            // Show notification with action
            toast.info(
              `Incoming ${payload.callType} call from ${payload.fromUserName}`,
              {
                duration: 30000, // Keep notification for 30 seconds
                action: {
                  label: "Answer",
                  onClick: () => {
                    // The modal should already be open via dispatch
                  },
                },
              }
            );
          } else {
            console.log("[CallListener] ❌ Call not for me, ignoring");
          }
        }
      )
      .subscribe((status) => {
        console.log("[CallListener] Channel subscription status:", status);
        if (status === "SUBSCRIBED") {
          isSubscribed = true;
          console.log(
            "[CallListener] ✅ Successfully subscribed to call channel for thread:",
            selectedDM.threadId
          );
        } else if (status === "CHANNEL_ERROR") {
          console.error(
            "[CallListener] ❌ Channel error - check Supabase realtime configuration"
          );
        }
      });

    return () => {
      console.log("[CallListener] Unsubscribing from call channel");
      if (isSubscribed) {
        supabase.removeChannel(callChannel);
      } else {
        callChannel.unsubscribe();
      }
    };
  }, [
    selectedDM?.threadId,
    selectedDM?.userAvatar,
    currentUserId,
    dispatch,
    isCallModalOpen,
  ]);

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

  const handleSend = async () => {
    if (!selectedDM || !newMessage.trim() || !isConnected) return;

    const tempMessage = newMessage;
    const tempReply = replyingTo;

    setNewMessage("");
    setReplyingTo(null);

    try {
      const broadcastedMsg = await broadcastMessage(tempMessage, tempReply?.id);

      if (!broadcastedMsg) {
        throw new Error("Failed to broadcast message");
      }

      // Save to database for persistence
      const result = await sendDmMessage(
        selectedDM.threadId,
        currentUserId,
        tempMessage,
        tempReply?.id
      );

      if (!result.success) {
        toast.error(result.error || "Failed to save message");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
      setNewMessage(tempMessage);
      setReplyingTo(tempReply);
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    console.log("handleAddReaction called:", { messageId, emoji });
    if (!sendReaction) {
      console.error("sendReaction function is not available!");
      return;
    }
    try {
      await sendReaction(messageId, emoji);
      console.log("Reaction sent successfully");
      setShowReactionPicker(null);
    } catch (error) {
      console.error("Failed to send reaction:", error);
      toast.error("Failed to add reaction");
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!window.confirm("Delete this message?")) return;
    console.log("handleDelete called:", messageId);
    if (!deleteMessage) {
      console.error("deleteMessage function is not available!");
      return;
    }
    try {
      await deleteMessage(messageId);
      console.log("Message deleted successfully");
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast.error("Failed to delete message");
    }
  };

  const handleEditStart = (msg: Message) => {
    console.log("handleEditStart called:", msg.id);
    setEditingMessage(msg.id);
    setEditContent(msg.content);
  };

  const handleEditSave = async () => {
    if (!editingMessage || !editContent.trim()) return;
    console.log("handleEditSave called:", { editingMessage, editContent });
    if (!editMessage) {
      console.error("editMessage function is not available!");
      return;
    }
    try {
      await editMessage(editingMessage, editContent);
      console.log("Message edited successfully");
      setEditingMessage(null);
      setEditContent("");
    } catch (error) {
      console.error("Failed to edit message:", error);
      toast.error("Failed to edit message");
    }
  };

  const handleEditCancel = () => {
    setEditingMessage(null);
    setEditContent("");
  };

  // Call handlers
  const handleStartCall = (type: "audio" | "video") => {
    if (!selectedDM) {
      toast.error("No user selected");
      return;
    }
    dispatch(
      startCall({
        type,
        userId: selectedDM.userId,
        userName: selectedDM.userName,
        userAvatar: selectedDM.userAvatar,
        threadId: selectedDM.threadId,
      })
    );
    toast.success(`Starting ${type} call with ${selectedDM.userName}...`);
  };

  const handleCloseCall = () => {
    dispatch(endCall());
  };

  if (isLoading) {
    return <ChatLoadingSkeleton />;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#313338] overflow-hidden">
      {/* Header */}
      <div className="h-12 px-4 flex items-center gap-3 border-b border-[#1e1f22] bg-[#313338] shrink-0">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white p-2 h-auto"
            onClick={onBack}
          >
            <Reply size={16} className="rotate-180" />
          </Button>
        )}
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#5865f2] text-white text-xs">
                {selectedDM?.userAvatar}
              </AvatarFallback>
            </Avatar>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#313338] ${getStatusColor()}`}
            />
          </div>
          <div>
            <div className="text-white text-sm font-medium">
              {selectedDM?.userName}
            </div>
            <div className="text-gray-400 text-xs capitalize flex items-center gap-1.5">
              {selectedDM?.userStatus}
              {isConnected && (
                <span className="w-1 h-1 bg-green-400 rounded-full" />
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-[#3f4147] transition-colors p-2 h-auto rounded"
            onClick={() => handleStartCall("audio")}
            title="Start voice call"
          >
            <Phone size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-[#3f4147] transition-colors p-2 h-auto rounded"
            onClick={() => handleStartCall("video")}
            title="Start video call"
          >
            <Video size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-[#3f4147] transition-colors p-2 h-auto rounded"
          >
            <UserPlus size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-[#3f4147] transition-colors p-2 h-auto rounded"
          >
            <Search size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-[#3f4147] transition-colors p-2 h-auto rounded"
          >
            <MoreVertical size={16} />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4"
      >
        {allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-[#2b2d31] rounded-full flex items-center justify-center mb-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-[#5865f2] text-white">
                  {selectedDM?.userAvatar}
                </AvatarFallback>
              </Avatar>
            </div>
            <h3 className="text-white font-semibold mb-1">
              {selectedDM?.userName}
            </h3>
            <p className="text-gray-400 text-sm">
              This is the beginning of your direct message history with{" "}
              <span className="font-medium">{selectedDM?.userName}</span>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {allMessages.map((msg, index) => {
              const prevMessage = index > 0 ? allMessages[index - 1] : null;
              const showHeader =
                !prevMessage || prevMessage.isCurrentUser !== msg.isCurrentUser;
              const isOwn = msg.isCurrentUser;
              const isEditing = editingMessage === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`group flex items-start gap-3 ${
                    isOwn ? "flex-row-reverse" : ""
                  }`}
                  onMouseEnter={() => setHoveredMessage(msg.id)}
                  onMouseLeave={() => setHoveredMessage(null)}
                >
                  {/* Avatar */}
                  {showHeader ? (
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback
                        className={
                          isOwn
                            ? "bg-[#5865f2] text-white"
                            : "bg-[#f23f43] text-white"
                        }
                      >
                        {isOwn
                          ? currentUserName.slice(0, 2).toUpperCase()
                          : selectedDM?.userAvatar}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-10 w-10 shrink-0" />
                  )}

                  {/* Message Content */}
                  <div
                    className={`flex flex-col gap-1 flex-1 max-w-[70%] ${
                      isOwn ? "items-end" : "items-start"
                    }`}
                  >
                    {/* Header */}
                    {showHeader && (
                      <div
                        className={`flex items-center gap-2 px-1 ${
                          isOwn ? "flex-row-reverse" : ""
                        }`}
                      >
                        <span className="text-white text-sm font-semibold">
                          {msg.senderName}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {msg.timestamp}
                        </span>
                      </div>
                    )}

                    {/* Reply indicator */}
                    {msg.replyTo && (
                      <div
                        className={`text-[11px] text-gray-400 border-l-2 border-[#5865f2] pl-2 mb-1 ${
                          isOwn ? "ml-auto" : ""
                        }`}
                      >
                        <span className="opacity-70">
                          Replying to {msg.replyTo.author}
                        </span>
                      </div>
                    )}

                    {/* Message bubble */}
                    <div className="relative group/message w-full">
                      {isEditing ? (
                        <div className="flex flex-col gap-2">
                          <input
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleEditSave();
                              if (e.key === "Escape") handleEditCancel();
                            }}
                            className="w-full bg-[#40444b] border border-[#5865f2] rounded-lg px-3 py-2 text-sm text-white outline-none"
                            autoFocus
                          />
                          <div className="flex gap-2 text-xs">
                            <button
                              onClick={handleEditSave}
                              className="text-[#5865f2] hover:underline"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleEditCancel}
                              className="text-gray-400 hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-sm transition-all ${
                              isOwn
                                ? "bg-[#5865f2] text-white rounded-tr-sm"
                                : "bg-[#2b2d31] text-gray-100 rounded-tl-sm"
                            }`}
                          >
                            <p className="whitespace-pre-wrap wrap-break-word">
                              {msg.content}
                            </p>
                            {msg.isEdited && (
                              <span className="text-[10px] opacity-60 ml-2">
                                (edited)
                              </span>
                            )}
                          </div>

                          {/* Hover actions - Improved UX */}
                          {hoveredMessage === msg.id && !isEditing && (
                            <div
                              className={`absolute -top-8 flex items-center gap-0.5 bg-[#1e1f22] border border-[#3f4147] rounded-md shadow-xl z-10 ${
                                isOwn ? "right-0" : "left-0"
                              }`}
                            >
                              <button
                                onClick={() =>
                                  setShowReactionPicker(
                                    msg.id === showReactionPicker
                                      ? null
                                      : msg.id
                                  )
                                }
                                className="p-2 hover:bg-[#2b2d31] rounded-md transition-colors"
                                title="Add reaction"
                              >
                                <Smile
                                  size={16}
                                  className="text-gray-400 hover:text-white"
                                />
                              </button>
                              <button
                                onClick={() => setReplyingTo(msg)}
                                className="p-2 hover:bg-[#2b2d31] rounded-md transition-colors"
                                title="Reply"
                              >
                                <Reply
                                  size={16}
                                  className="text-gray-400 hover:text-white"
                                />
                              </button>
                              {isOwn && (
                                <>
                                  <button
                                    onClick={() => handleEditStart(msg)}
                                    className="p-2 hover:bg-[#2b2d31] rounded-md transition-colors"
                                    title="Edit"
                                  >
                                    <Edit2
                                      size={16}
                                      className="text-gray-400 hover:text-white"
                                    />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(msg.id)}
                                    className="p-2 hover:bg-[#2b2d31] rounded-md transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2
                                      size={16}
                                      className="text-gray-400 hover:text-red-400"
                                    />
                                  </button>
                                </>
                              )}
                            </div>
                          )}

                          {/* Reaction picker */}
                          {showReactionPicker === msg.id && (
                            <div
                              className={`absolute -top-14 bg-[#1e1f22] border border-[#3f4147] rounded-lg p-2 shadow-xl z-20 ${
                                isOwn ? "right-0" : "left-0"
                              }`}
                            >
                              <div className="flex gap-1">
                                {EMOJI_LIST.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() =>
                                      handleAddReaction(msg.id, emoji)
                                    }
                                    className="text-xl hover:scale-125 transition-transform p-1.5 hover:bg-[#2b2d31] rounded"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Reactions */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div
                        className={`flex gap-1 flex-wrap ${
                          isOwn ? "justify-end" : ""
                        }`}
                      >
                        {msg.reactions.map((reaction, idx) => (
                          <button
                            key={idx}
                            onClick={() =>
                              handleAddReaction(msg.id, reaction.emoji)
                            }
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs hover:scale-110 transition-all ${
                              reaction.users.includes(currentUserName)
                                ? "bg-[#5865f2] text-white border border-[#5865f2]"
                                : "bg-[#2b2d31] text-gray-300 border border-[#3f4147] hover:border-[#5865f2]"
                            }`}
                            title={reaction.users.join(", ")}
                          >
                            <span>{reaction.emoji}</span>
                            <span className="font-medium">
                              {reaction.count}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {otherUserTyping && (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[#f23f43] text-white">
                    {selectedDM?.userAvatar}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-[#2b2d31] rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-[#1e1f22] bg-[#313338] shrink-0">
        {replyingTo && (
          <div className="px-4 pt-2">
            <div className="bg-[#2b2d31] rounded-lg border-l-4 border-[#5865f2] px-3 py-2 flex items-center justify-between">
              <div className="flex-1">
                <div className="text-[#5865f2] text-xs font-medium mb-0.5">
                  Replying to {replyingTo.senderName}
                </div>
                <div className="text-gray-400 text-sm truncate">
                  {replyingTo.content}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white p-1 h-auto ml-2"
                onClick={() => setReplyingTo(null)}
              >
                <X size={14} />
              </Button>
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4"
        >
          <div className="flex items-end gap-2">
            <div className="flex-1 bg-[#40444b] rounded-lg border border-[#3f4147] focus-within:border-[#5865f2] hover:border-[#4a4f58] transition-colors">
              <input
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="w-full bg-transparent outline-none text-sm text-white placeholder:text-gray-500 px-4 py-3"
                placeholder={`Message @${selectedDM?.userName || "user"}`}
                disabled={!isConnected}
              />
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-[#3f4147] transition-all p-2.5 h-auto rounded"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                type="button"
              >
                <Smile size={20} />
              </Button>
              {newMessage.trim() && (
                <Button
                  type="submit"
                  size="sm"
                  className="bg-[#5865f2] hover:bg-[#4752c4] text-white p-2.5 h-auto rounded"
                  disabled={!isConnected || !newMessage.trim()}
                >
                  <Send size={20} />
                </Button>
              )}
            </div>
          </div>

          {showEmojiPicker && (
            <div className="mt-2 bg-[#2b2d31] rounded-lg border border-[#3f4147] p-3 shadow-lg">
              <div className="grid grid-cols-8 gap-2">
                {EMOJI_LIST.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="text-2xl hover:scale-125 hover:bg-[#35363c] rounded p-2 transition-all"
                    onClick={() => {
                      setNewMessage((prev) => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Call Modal */}
      {selectedDM && (
        <DirectCallModal
          isOpen={isCallModalOpen}
          onClose={handleCloseCall}
          callType={callType}
          otherUser={{
            id: selectedDM.userId,
            name: selectedDM.userName,
            avatar: selectedDM.userAvatar,
          }}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          threadId={selectedDM.threadId}
          isInitiator={isInitiator}
          incomingOffer={incomingOffer || undefined}
        />
      )}
    </div>
  );
}
