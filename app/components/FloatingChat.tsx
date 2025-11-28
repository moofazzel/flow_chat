"use client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchChannelMessages,
  sendMessageThunk,
} from "@/store/slices/chatSlice";
import { createClient } from "@/utils/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { Hash, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Task } from "../page";
import { InlineTaskActivityCard, parseActivityType } from "./TaskActivityCard";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";

interface FloatingChatProps {
  channelId: string;
  onTaskClick: (task: Task) => void;
  onClose: () => void;
}

export function FloatingChat({
  channelId,
  onTaskClick,
  onClose,
}: FloatingChatProps) {
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState("");
  const [channelName, setChannelName] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get tasks and chat messages from Redux store
  const tasksFromStore = useAppSelector((state) => state.task.tasks);
  const user = useAppSelector((state) => state.auth.user);
  const chatMessages = useAppSelector(
    (state) => state.chat.messagesByChannel[channelId] || []
  );
  const isLoading = useAppSelector((state) => state.chat.isLoading);

  // Fetch messages when channel changes
  useEffect(() => {
    if (channelId) {
      dispatch(fetchChannelMessages(channelId));
    }
  }, [channelId, dispatch]);

  // Fetch channel name
  useEffect(() => {
    const fetchChannelName = async () => {
      if (!channelId) return;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("channels")
        .select("name")
        .eq("id", channelId)
        .single();

      if (!error && data) {
        setChannelName(data.name);
      } else {
        setChannelName(channelId); // Fallback to ID
      }
    };

    fetchChannelName();
  }, [channelId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSend = () => {
    if (message.trim() && user) {
      dispatch(
        sendMessageThunk({
          channelId,
          content: message,
          userId: user.id,
        })
      );
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
        ease: [0.16, 1, 0.3, 1],
        opacity: { duration: 0.3 },
      }}
      className="fixed right-2 sm:right-4 top-2 sm:top-4 bottom-2 sm:bottom-4 w-full sm:w-[400px] max-w-[calc(100vw-1rem)] sm:max-w-[400px] max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] bg-[#313338] rounded-lg shadow-2xl flex flex-col z-100 border border-[#1e1f22]"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.15,
          duration: 0.3,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="h-11 sm:h-12 px-3 sm:px-4 flex items-center gap-2 border-b border-[#1e1f22] bg-[#2b2d31] rounded-t-lg shrink-0"
      >
        <Hash
          size={16}
          className="text-gray-400 shrink-0 sm:w-[18px] sm:h-[18px]"
        />
        <span className="text-white flex-1 truncate text-sm sm:text-base">
          {channelName || "Loading..."}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1 h-auto shrink-0"
        >
          <X size={16} className="sm:w-[18px] sm:h-[18px]" />
        </Button>
      </motion.div>

      {/* Messages - Scrollable Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-2 sm:p-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={channelId}
                initial={{ opacity: 0, x: 20, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.98 }}
                transition={{
                  duration: 0.3,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="space-y-2 sm:space-y-3"
              >
                {chatMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  chatMessages.map((msg, index: number) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: 30, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{
                        delay: 0.1 + index * 0.04,
                        duration: 0.3,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="flex gap-2 hover:bg-[#2e3035] -mx-2 px-2 py-1 rounded"
                    >
                      <Avatar className="h-7 w-7 sm:h-8 sm:w-8 mt-1 shrink-0">
                        <AvatarFallback className="text-xs">
                          {msg.author?.username?.slice(0, 2).toUpperCase() ||
                            "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-white text-xs sm:text-sm font-medium truncate">
                            {msg.author?.username || "Unknown"}
                          </span>
                          <span className="text-gray-400 text-[10px] sm:text-xs shrink-0">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="text-gray-300 text-xs sm:text-sm mt-0.5 break-words">
                          {msg.content}
                        </div>

                        {/* Task Activity Card - for activity messages */}
                        {parseActivityType(msg.content) && (
                          <InlineTaskActivityCard
                            content={msg.content}
                            tasks={tasksFromStore}
                            embeds={msg.embeds}
                            onTaskClick={onTaskClick}
                          />
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
                {/* Invisible element to scroll to */}
                <div ref={messagesEndRef} />
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>

      {/* Message input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.25,
          duration: 0.3,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="p-2 sm:p-3 border-t border-[#1e1f22] shrink-0"
      >
        <div className="flex gap-1.5 sm:gap-2">
          <Input
            placeholder={`Message #${channelName || "channel"}`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!user}
            className="flex-1 bg-[#383a40] border-none text-gray-200 placeholder:text-gray-500 text-xs sm:text-sm h-8 sm:h-10"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!message.trim() || !user}
            className="bg-[#5865f2] hover:bg-[#4752c4] px-2 sm:px-3 h-8 sm:h-10"
          >
            <Send size={14} className="sm:w-4 sm:h-4" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
