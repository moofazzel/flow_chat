import {
  Bell,
  CornerUpRight,
  Gift,
  Hash,
  HelpCircle,
  Image as ImageIcon,
  Inbox,
  MoreHorizontal,
  Pin,
  PlusCircle,
  Reply,
  Search,
  Smile,
  Sticker,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Task } from "../page";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";

interface ChatAreaProps {
  channelId: string;
  onTaskClick: (task: Task) => void;
}

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

interface Message {
  id: string;
  author: string;
  avatar: string;
  timestamp: string;
  content: string;
  task?: Task;
  replyTo?: {
    id: string;
    author: string;
    content: string;
  };
  isCurrentUser?: boolean;
  reactions?: Reaction[];
}

export function ChatArea({ channelId, onTaskClick }: ChatAreaProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showTaskMentions, setShowTaskMentions] = useState(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [showMoreMenu, setShowMoreMenu] = useState<string | null>(null);

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Check if user is trying to mention a task with #
    const lastWord = value.split(' ').pop() || '';
    if (lastWord.startsWith('#') && lastWord.length > 1) {
      setShowTaskMentions(true);
      setTaskSearchQuery(lastWord.substring(1).toLowerCase());
    } else {
      setShowTaskMentions(false);
      setTaskSearchQuery('');
    }
  };

  const handleTaskMention = (task: Task) => {
    const words = message.split(' ');
    words.pop(); // Remove the partial #mention
    words.push(`#${task.id}`);
    setMessage(words.join(' ') + ' ');
    setShowTaskMentions(false);
  };

  // Filter tasks based on search query - tasks should be passed as prop
  // For now, using empty array until parent component passes tasks
  const filteredTasks: Task[] = [];

  const handleReply = (msg: Message) => {
    setReplyingTo(msg);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg.id === messageId) {
          const reactions = msg.reactions || [];
          const existingReaction = reactions.find((r) => r.emoji === emoji);

          if (existingReaction) {
            // Check if user already reacted
            if (existingReaction.users.includes("You")) {
              // Remove user's reaction
              return {
                ...msg,
                reactions: reactions
                  .map((r) =>
                    r.emoji === emoji
                      ? {
                          ...r,
                          count: r.count - 1,
                          users: r.users.filter((u) => u !== "You"),
                        }
                      : r
                  )
                  .filter((r) => r.count > 0),
              };
            } else {
              // Add user's reaction
              return {
                ...msg,
                reactions: reactions.map((r) =>
                  r.emoji === emoji
                    ? {
                        ...r,
                        count: r.count + 1,
                        users: [...r.users, "You"],
                      }
                    : r
                ),
              };
            }
          } else {
            // New reaction
            return {
              ...msg,
              reactions: [...reactions, { emoji, count: 1, users: ["You"] }],
            };
          }
        }
        return msg;
      })
    );
  };

  const handleForward = (msg: Message) => {
    alert(`Forward message: "${msg.content}" to another channel/user`);
  };

  const handleCopyMessage = (msg: Message) => {
    navigator.clipboard.writeText(msg.content);
    alert("Message copied to clipboard!");
  };

  const handleEditMessage = (msg: Message) => {
    if (msg.isCurrentUser) {
      setMessage(msg.content);
      alert("Edit mode activated. Message loaded in input field.");
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (confirm("Are you sure you want to delete this message?")) {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== messageId)
      );
      setShowMoreMenu(null);
    }
  };

  const handlePinMessage = (msg: Message) => {
    alert(`Message "${msg.content.substring(0, 30)}..." has been pinned!`);
    setShowMoreMenu(null);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Channel header */}
      <div className="h-10 px-3 flex items-center gap-3 border-b border-[#1e1f22] shadow-sm">
        <div className="flex items-center gap-2">
          <Hash size={18} className="text-gray-400" />
          <span className="text-white text-sm">{channelId}</span>
        </div>
        <div className="h-5 w-px bg-[#3f4147]" />
        <span className="text-gray-400 text-xs">
          Team collaboration and task updates
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-200 p-1.5 h-auto"
          >
            <Bell size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-200 p-1.5 h-auto"
          >
            <Pin size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-200 p-1.5 h-auto"
          >
            <Users size={16} />
          </Button>
          <div className="relative">
            <Input
              placeholder="Search"
              className="w-28 h-7 bg-[#1e1f22] border-none text-xs"
            />
            <Search
              size={14}
              className="absolute right-2 top-1.5 text-gray-400"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-200 p-1.5 h-auto"
          >
            <Inbox size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-200 p-1.5 h-auto"
          >
            <HelpCircle size={16} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 hover:bg-[#2e3035] -mx-3 px-3 py-0.5 group relative rounded ${
                msg.isCurrentUser ? "flex-row-reverse" : ""
              }`}
            >
              {/* Hover action buttons */}
              <div
                className={`absolute -top-3 ${
                  msg.isCurrentUser ? "left-3" : "right-3"
                } opacity-0 group-hover:opacity-100 transition-opacity bg-[#1e1f22] rounded-md border border-[#3f4147] shadow-lg flex items-center gap-0.5 p-0.5 z-10`}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-[#35363c] p-1 h-auto"
                  title="Like"
                  onClick={() => handleAddReaction(msg.id, "👍")}
                >
                  👍
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-[#35363c] p-1 h-auto"
                  title="Love"
                  onClick={() => handleAddReaction(msg.id, "❤️")}
                >
                  ❤️
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-[#35363c] p-1 h-auto"
                  title="Laugh"
                  onClick={() => handleAddReaction(msg.id, "😂")}
                >
                  😂
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-[#35363c] p-1 h-auto"
                  title="Surprise"
                  onClick={() => handleAddReaction(msg.id, "😮")}
                >
                  😮
                </Button>
                <div className="w-px h-4 bg-[#3f4147] mx-0.5" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-[#35363c] p-1 h-auto"
                  onClick={() => handleReply(msg)}
                  title="Reply"
                >
                  <Reply size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-[#35363c] p-1 h-auto"
                  onClick={() => handleForward(msg)}
                  title="Forward"
                >
                  <CornerUpRight size={16} />
                </Button>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white hover:bg-[#35363c] p-1 h-auto"
                    onClick={() =>
                      setShowMoreMenu(showMoreMenu === msg.id ? null : msg.id)
                    }
                    title="More"
                  >
                    <MoreHorizontal size={16} />
                  </Button>

                  {/* More menu dropdown */}
                  {showMoreMenu === msg.id && (
                    <div className="absolute top-full mt-1 right-0 bg-[#1e1f22] border border-[#3f4147] rounded-lg shadow-xl min-w-[160px] overflow-hidden z-20">
                      <button
                        onClick={() => handlePinMessage(msg)}
                        className="w-full px-3 py-1.5 text-left text-gray-300 hover:bg-[#35363c] hover:text-white flex items-center gap-2 text-xs"
                      >
                        <Pin size={14} />
                        Pin Message
                      </button>
                      <button
                        onClick={() => handleCopyMessage(msg)}
                        className="w-full px-3 py-1.5 text-left text-gray-300 hover:bg-[#35363c] hover:text-white flex items-center gap-2 text-xs"
                      >
                        <Search size={14} />
                        Copy Text
                      </button>
                      {msg.isCurrentUser && (
                        <>
                          <button
                            onClick={() => handleEditMessage(msg)}
                            className="w-full px-3 py-1.5 text-left text-gray-300 hover:bg-[#35363c] hover:text-white flex items-center gap-2 text-xs"
                          >
                            <PlusCircle size={14} />
                            Edit Message
                          </button>
                          <div className="h-px bg-[#3f4147]" />
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="w-full px-3 py-1.5 text-left text-red-400 hover:bg-red-900/20 hover:text-red-300 flex items-center gap-2 text-xs"
                          >
                            <X size={14} />
                            Delete Message
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Avatar className="h-8 w-8 mt-0.5 flex-shrink-0">
                <AvatarFallback
                  className={msg.isCurrentUser ? "bg-[#5865f2]" : ""}
                >
                  {msg.avatar}
                </AvatarFallback>
              </Avatar>
              <div
                className={`flex-1 min-w-0 ${
                  msg.isCurrentUser ? "flex flex-col items-end" : ""
                }`}
              >
                <div
                  className={`flex items-baseline gap-2 ${
                    msg.isCurrentUser ? "flex-row-reverse" : ""
                  }`}
                >
                  <span
                    className={`text-sm ${
                      msg.isCurrentUser ? "text-[#5865f2]" : "text-white"
                    }`}
                  >
                    {msg.author}
                  </span>
                  <span className="text-gray-400 text-[11px]">
                    {msg.timestamp}
                  </span>
                </div>

                {/* Reply indicator */}
                {msg.replyTo && (
                  <div
                    className={`mt-0.5 mb-0.5 p-1.5 bg-[#2b2d31] rounded border-l-2 border-gray-500 ${
                      msg.isCurrentUser ? "ml-auto max-w-md" : "max-w-md"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Reply size={10} className="text-gray-400" />
                      <span className="text-gray-400 text-[10px]">
                        {msg.replyTo.author}
                      </span>
                    </div>
                    <div className="text-gray-400 text-[11px] truncate">
                      {msg.replyTo.content}
                    </div>
                  </div>
                )}

                <div
                  className={`text-gray-300 text-[13px] mt-0.5 ${
                    msg.isCurrentUser
                      ? "bg-[#5865f2] px-2.5 py-1.5 rounded-lg max-w-md"
                      : ""
                  }`}
                >
                  {msg.content}
                </div>

                {msg.task && (
                  <button
                    onClick={() => onTaskClick(msg.task!)}
                    className={`mt-1.5 p-2 bg-[#2b2d31] rounded-md border-l-4 border-blue-500 hover:bg-[#35363c] transition-colors text-left w-full max-w-md ${
                      msg.isCurrentUser ? "ml-auto" : ""
                    }`}
                  >
                    <div className="flex items-start gap-1.5 mb-1">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {msg.task.id}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${
                          msg.task.priority === "urgent"
                            ? "border-red-500 text-red-500"
                            : msg.task.priority === "high"
                            ? "border-orange-500 text-orange-500"
                            : msg.task.priority === "medium"
                            ? "border-yellow-500 text-yellow-500"
                            : "border-gray-500 text-gray-500"
                        }`}
                      >
                        {msg.task.priority}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {msg.task.status}
                      </Badge>
                    </div>
                    <div className="text-white text-sm mb-0.5">
                      {msg.task.title}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {msg.task.description}
                    </div>
                    <div className="flex gap-1 mt-1.5">
                      {msg.task.labels.map((label) => (
                        <Badge
                          key={label}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </button>
                )}

                {/* Reactions */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div
                    className={`flex gap-1 mt-1 ${
                      msg.isCurrentUser ? "justify-end" : ""
                    }`}
                  >
                    {msg.reactions.map((reaction, index) => (
                      <button
                        key={index}
                        onClick={() =>
                          handleAddReaction(msg.id, reaction.emoji)
                        }
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-colors ${
                          reaction.users.includes("You")
                            ? "bg-[#5865f2]/20 border-[#5865f2] hover:bg-[#5865f2]/30"
                            : "bg-[#2b2d31] border-[#3f4147] hover:bg-[#35363c]"
                        }`}
                        title={reaction.users.join(", ")}
                      >
                        <span className="text-xs">{reaction.emoji}</span>
                        <span
                          className={`text-[10px] ${
                            reaction.users.includes("You")
                              ? "text-[#5865f2]"
                              : "text-gray-400"
                          }`}
                        >
                          {reaction.count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Message input */}
      <div className="px-3 py-2 bg-[#313338] border-t border-[#1e1f22]">
        {/* Reply preview */}
        {replyingTo && (
          <div className="mb-2 p-1.5 bg-[#2b2d31] rounded-t-md border-l-2 border-[#5865f2] flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Reply size={10} className="text-gray-400" />
                <span className="text-gray-400 text-[10px]">
                  Replying to {replyingTo.author}
                </span>
              </div>
              <div className="text-gray-300 text-xs truncate">
                {replyingTo.content}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white p-1 h-auto flex-shrink-0"
              onClick={cancelReply}
            >
              <X size={14} />
            </Button>
          </div>
        )}

        {/* Task mention suggestions */}
        {showTaskMentions && filteredTasks.length > 0 && (
          <div className="mb-2 bg-[#2b2d31] rounded-md border border-[#3f4147] max-h-40 overflow-y-auto">
            {filteredTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => handleTaskMention(task)}
                className="w-full p-2 hover:bg-[#35363c] transition-colors text-left border-b border-[#3f4147] last:border-b-0"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {task.id}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${
                      task.priority === 'urgent'
                        ? 'border-red-500 text-red-500'
                        : task.priority === 'high'
                        ? 'border-orange-500 text-orange-500'
                        : task.priority === 'medium'
                        ? 'border-yellow-500 text-yellow-500'
                        : 'border-gray-500 text-gray-500'
                    }`}
                  >
                    {task.priority}
                  </Badge>
                </div>
                <div className="text-white text-xs">{task.title}</div>
              </button>
            ))}
          </div>
        )}

        <div
          className={`bg-[#383a40] ${
            replyingTo ? "rounded-b-md" : "rounded-md"
          }`}
        >
          <Input
            placeholder={`Message #${channelId}`}
            value={message}
            onChange={handleMessageChange}
            className="border-none bg-transparent text-gray-200 placeholder:text-gray-500 h-8 text-sm"
          />
          <div className="flex items-center gap-1 px-2 pb-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-200 p-1 h-auto"
            >
              <PlusCircle size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-200 p-1 h-auto"
            >
              <Gift size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-200 p-1 h-auto"
            >
              <ImageIcon size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-200 p-1 h-auto"
            >
              <Sticker size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-200 p-1 h-auto ml-auto"
            >
              <Smile size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
