"use client";

import { AlertCircle, CheckCircle2, Clock, Hash, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";

interface Member {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "idle" | "dnd" | "offline";
  role?: string;
}

interface Channel {
  id: string;
  name: string;
  description?: string;
}

interface Command {
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface MentionAutocompleteProps {
  show: boolean;
  type: "@" | "#" | "/";
  query: string;
  position: { top: number; left: number };
  onSelect: (value: string) => void;
  onClose: () => void;
}

// Mock data
const members: Member[] = [
  { id: "1", name: "John Doe", avatar: "JD", status: "online", role: "Admin" },
  {
    id: "2",
    name: "Sarah Chen",
    avatar: "SC",
    status: "online",
    role: "Developer",
  },
  {
    id: "3",
    name: "Mike Johnson",
    avatar: "MJ",
    status: "idle",
    role: "Designer",
  },
  {
    id: "4",
    name: "Alex Kim",
    avatar: "AK",
    status: "dnd",
    role: "Product Manager",
  },
  {
    id: "5",
    name: "Emma Wilson",
    avatar: "EW",
    status: "offline",
    role: "Developer",
  },
  {
    id: "6",
    name: "David Lee",
    avatar: "DL",
    status: "online",
    role: "QA Engineer",
  },
];

const channels: Channel[] = [
  { id: "1", name: "general", description: "General discussion" },
  { id: "2", name: "dev-team", description: "Development team channel" },
  { id: "3", name: "design", description: "Design discussions" },
  { id: "4", name: "sprint-planning", description: "Sprint planning meetings" },
  { id: "5", name: "bugs", description: "Bug tracking and reports" },
  { id: "6", name: "random", description: "Random conversations" },
];

const commands: Command[] = [
  {
    name: "giphy",
    description: "Send a GIF from Giphy",
    icon: <Zap size={18} className="text-[#5865f2]" />,
  },
  {
    name: "todo",
    description: "Create a new task",
    icon: <CheckCircle2 size={18} className="text-[#3ba55d]" />,
  },
  {
    name: "remind",
    description: "Set a reminder",
    icon: <Clock size={18} className="text-[#f0b232]" />,
  },
  {
    name: "bug",
    description: "Report a bug",
    icon: <AlertCircle size={18} className="text-[#ed4245]" />,
  },
];

export function MentionAutocomplete({
  show,
  type,
  query,
  position,
  onSelect,
  onClose,
}: MentionAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter results based on query
  const getFilteredResults = () => {
    const normalizedQuery = query.toLowerCase();

    if (type === "@") {
      return members.filter((m) =>
        m.name.toLowerCase().includes(normalizedQuery)
      );
    } else if (type === "#") {
      return channels.filter((c) =>
        c.name.toLowerCase().includes(normalizedQuery)
      );
    } else if (type === "/") {
      return commands.filter((c) =>
        c.name.toLowerCase().includes(normalizedQuery)
      );
    }
    return [];
  };

  const filteredResults = getFilteredResults();

  const handleSelect = useCallback(
    (result: Member | Channel | Command) => {
      if (type === "@") {
        onSelect(`@${result.name}`);
      } else if (type === "#") {
        onSelect(`#${result.name}`);
      } else if (type === "/") {
        onSelect(`/${result.name}`);
      }
    },
    [type, onSelect]
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!show) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredResults.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredResults.length - 1
        );
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (filteredResults.length > 0) {
          handleSelect(filteredResults[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [show, selectedIndex, filteredResults, onClose, handleSelect]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!show || filteredResults.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute z-50 w-[320px] bg-[#2b2d31] rounded-lg shadow-2xl border border-[#1e1f22] overflow-hidden"
      style={{
        bottom: position.top,
        left: position.left,
        maxHeight: "320px",
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 bg-[#1e1f22] border-b border-[#3f4147]">
        <span className="text-[#b5bac1] text-xs uppercase tracking-wider font-semibold">
          {type === "@" && "Members"}
          {type === "#" && "Channels"}
          {type === "/" && "Commands"}
        </span>
      </div>

      {/* Results */}
      <ScrollArea className="max-h-[280px]">
        <div className="py-1">
          {type === "@" &&
            (filteredResults as Member[]).map((member, idx) => (
              <button
                key={member.id}
                onClick={() => handleSelect(member)}
                className={`w-full flex items-center gap-3 px-3 py-2 transition-colors ${
                  idx === selectedIndex ? "bg-[#5865f2]" : "hover:bg-[#35363c]"
                }`}
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-sm">
                      {member.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#2b2d31] ${
                      member.status === "online"
                        ? "bg-[#3ba55d]"
                        : member.status === "idle"
                        ? "bg-[#f0b232]"
                        : member.status === "dnd"
                        ? "bg-[#ed4245]"
                        : "bg-[#80848e]"
                    }`}
                  />
                </div>
                <div className="flex-1 text-left">
                  <div
                    className={`font-medium ${
                      idx === selectedIndex ? "text-white" : "text-[#dbdee1]"
                    }`}
                  >
                    {member.name}
                  </div>
                  {member.role && (
                    <div
                      className={`text-xs ${
                        idx === selectedIndex
                          ? "text-[#e3e5e8]"
                          : "text-[#949ba4]"
                      }`}
                    >
                      {member.role}
                    </div>
                  )}
                </div>
              </button>
            ))}

          {type === "#" &&
            (filteredResults as Channel[]).map((channel, idx) => (
              <button
                key={channel.id}
                onClick={() => handleSelect(channel)}
                className={`w-full flex items-center gap-3 px-3 py-2 transition-colors ${
                  idx === selectedIndex ? "bg-[#5865f2]" : "hover:bg-[#35363c]"
                }`}
              >
                <div className="flex items-center justify-center w-8 h-8 bg-[#404249] rounded-full">
                  <Hash
                    size={18}
                    className={
                      idx === selectedIndex ? "text-white" : "text-[#b5bac1]"
                    }
                  />
                </div>
                <div className="flex-1 text-left">
                  <div
                    className={`font-medium ${
                      idx === selectedIndex ? "text-white" : "text-[#dbdee1]"
                    }`}
                  >
                    #{channel.name}
                  </div>
                  {channel.description && (
                    <div
                      className={`text-xs ${
                        idx === selectedIndex
                          ? "text-[#e3e5e8]"
                          : "text-[#949ba4]"
                      }`}
                    >
                      {channel.description}
                    </div>
                  )}
                </div>
              </button>
            ))}

          {type === "/" &&
            (filteredResults as Command[]).map((command, idx) => (
              <button
                key={command.name}
                onClick={() => handleSelect(command)}
                className={`w-full flex items-center gap-3 px-3 py-2 transition-colors ${
                  idx === selectedIndex ? "bg-[#5865f2]" : "hover:bg-[#35363c]"
                }`}
              >
                <div className="flex items-center justify-center w-8 h-8 bg-[#404249] rounded-full">
                  {command.icon}
                </div>
                <div className="flex-1 text-left">
                  <div
                    className={`font-medium ${
                      idx === selectedIndex ? "text-white" : "text-[#dbdee1]"
                    }`}
                  >
                    /{command.name}
                  </div>
                  <div
                    className={`text-xs ${
                      idx === selectedIndex
                        ? "text-[#e3e5e8]"
                        : "text-[#949ba4]"
                    }`}
                  >
                    {command.description}
                  </div>
                </div>
              </button>
            ))}
        </div>
      </ScrollArea>

      {/* Footer hint */}
      <div className="px-3 py-2 bg-[#1e1f22] border-t border-[#3f4147] flex items-center justify-between text-xs text-[#949ba4]">
        <span>↑↓ to navigate</span>
        <span>↵ to select</span>
        <span>Esc to close</span>
      </div>
    </div>
  );
}
