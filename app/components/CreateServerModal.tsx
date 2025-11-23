"use client";

import { GripVertical, Sparkles, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";

interface CreateServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (serverData: ServerData) => void;
}

export interface ServerData {
  id: string;
  name: string;
  description: string;
  template: string;
  icon: string;
  color: string;
  channels: ChannelData[];
  boards: BoardData[];
}

interface ChannelData {
  id: string;
  name: string;
  type: "text" | "voice";
  category: string;
}

interface BoardData {
  id: string;
  name: string;
  description: string;
  color: string;
  columns: ColumnData[];
}

interface ColumnData {
  id: string;
  title: string;
  color: string;
}

const templates = [
  {
    id: "blank",
    name: "Start from scratch",
    description: "Create a custom server with your own channels",
    icon: "⚡",
  },
  {
    id: "project",
    name: "Project Management",
    description: "Organized channels for tasks, sprints, and planning",
    icon: "📋",
  },
  {
    id: "team",
    name: "Team Collaboration",
    description: "Perfect for team communication and file sharing",
    icon: "👥",
  },
  {
    id: "development",
    name: "Software Development",
    description: "Channels for dev, design, QA, and deployment",
    icon: "💻",
  },
];

export function CreateServerModal({
  isOpen,
  onClose,
  onCreate,
}: CreateServerModalProps) {
  const [step, setStep] = useState<"choose" | "customize">("choose");
  const [serverName, setServerName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const [serverIcon, setServerIcon] = useState<string>("");
  const [serverDescription, setServerDescription] = useState("");
  const [serverColor, setServerColor] = useState("#5865f2");
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [boards, setBoards] = useState<BoardData[]>([]);

  const handleCreate = () => {
    if (serverName.trim()) {
      onCreate({
        id: Math.random().toString(36).substr(2, 9),
        name: serverName,
        description: serverDescription,
        template: selectedTemplate,
        icon: serverIcon,
        color: serverColor,
        channels: channels,
        boards: boards,
      });
      // Reset form
      setServerName("");
      setSelectedTemplate("blank");
      setServerIcon("");
      setServerDescription("");
      setServerColor("#5865f2");
      setChannels([]);
      setBoards([]);
      setStep("choose");
      onClose();
    }
  };

  const handleClose = () => {
    setStep("choose");
    setServerName("");
    setSelectedTemplate("blank");
    setServerIcon("");
    setServerDescription("");
    setServerColor("#5865f2");
    setChannels([]);
    setBoards([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[480px] bg-[#313338] border-none p-0 gap-0 overflow-hidden">
        {step === "choose" && (
          <>
            <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-b from-[#313338] to-[#2b2d31]">
              <DialogTitle className="text-white text-2xl text-center flex items-center justify-center gap-2">
                <Sparkles className="text-[#5865f2]" size={24} />
                Create a server
              </DialogTitle>
              <DialogDescription className="text-[#b5bac1] text-center text-[15px] mt-2">
                Your server is where you and your team collaborate. Choose a
                template or start from scratch.
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 pb-6 pt-2">
              <div className="space-y-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      setStep("customize");
                    }}
                    className="w-full flex items-start gap-4 p-4 bg-[#2b2d31] rounded-lg hover:bg-[#404249] transition-all text-left group border-2 border-transparent hover:border-[#5865f2] shadow-sm"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-[#5865f2] to-[#4752c4] rounded-xl flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-105 transition-transform shadow-lg">
                      {template.icon}
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <div className="text-white font-semibold mb-1.5 text-[15px]">
                        {template.name}
                      </div>
                      <div className="text-[#b5bac1] text-[13px] leading-relaxed">
                        {template.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-[#404249]">
                <button
                  onClick={handleClose}
                  className="w-full py-2.5 text-[#b5bac1] hover:text-white hover:underline transition-colors text-sm"
                >
                  Back
                </button>
              </div>
            </div>
          </>
        )}

        {step === "customize" && (
          <>
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle className="text-white text-2xl text-center">
                Customize your server
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-center">
                Give your server a personality with a name and icon. You can
                always change it later.
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 pb-6">
              {/* Server Icon Upload */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative group">
                  {serverIcon ? (
                    <div className="w-24 h-24 rounded-full bg-[#5865f2] flex items-center justify-center text-4xl cursor-pointer hover:opacity-80 transition-opacity">
                      {serverIcon}
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#4e5058] flex items-center justify-center cursor-pointer hover:border-[#5865f2] transition-colors">
                      <Upload
                        className="text-[#4e5058] group-hover:text-[#5865f2]"
                        size={32}
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      // In a real app, you'd upload the file
                      if (e.target.files?.[0]) {
                        // For now, just use emoji
                        setServerIcon("🎯");
                      }
                    }}
                  />
                </div>
                <button
                  className="mt-3 text-[#5865f2] hover:underline text-sm"
                  onClick={() => {
                    const emojis = [
                      "🎯",
                      "🚀",
                      "⚡",
                      "💼",
                      "🎨",
                      "🔥",
                      "💡",
                      "🌟",
                      "🎮",
                      "📱",
                    ];
                    const randomEmoji =
                      emojis[Math.floor(Math.random() * emojis.length)];
                    setServerIcon(randomEmoji);
                  }}
                >
                  Use random emoji
                </button>
              </div>

              {/* Server Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="server-name"
                  className="text-gray-400 text-xs uppercase tracking-wider"
                >
                  Server Name
                </Label>
                <Input
                  id="server-name"
                  placeholder="My Awesome Server"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  className="bg-[#1e1f22] border-[#3f4147] text-white"
                  autoFocus
                />
                <p className="text-gray-500 text-xs">
                  By creating a server, you agree to our Community Guidelines
                </p>
              </div>

              {/* Server Description */}
              <div className="space-y-2">
                <Label
                  htmlFor="server-description"
                  className="text-gray-400 text-xs uppercase tracking-wider"
                >
                  Server Description
                </Label>
                <Textarea
                  id="server-description"
                  placeholder="Describe your server"
                  value={serverDescription}
                  onChange={(e) => setServerDescription(e.target.value)}
                  className="bg-[#1e1f22] border-[#3f4147] text-white"
                />
              </div>

              {/* Server Color */}
              <div className="space-y-2">
                <Label
                  htmlFor="server-color"
                  className="text-gray-400 text-xs uppercase tracking-wider"
                >
                  Server Color
                </Label>
                <Input
                  id="server-color"
                  type="color"
                  value={serverColor}
                  onChange={(e) => setServerColor(e.target.value)}
                  className="bg-[#1e1f22] border-[#3f4147] text-white"
                />
              </div>

              {/* Channels */}
              <div className="space-y-2">
                <Label
                  htmlFor="server-channels"
                  className="text-gray-400 text-xs uppercase tracking-wider"
                >
                  Channels
                </Label>
                <ScrollArea className="h-40">
                  <div className="space-y-2">
                    {channels.map((channel) => (
                      <div
                        key={channel.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <GripVertical
                            className="text-gray-400 mr-2"
                            size={16}
                          />
                          <div className="text-white font-medium">
                            {channel.name}
                          </div>
                        </div>
                        <Trash2
                          className="text-gray-400 hover:text-red-500 cursor-pointer"
                          size={16}
                          onClick={() =>
                            setChannels(
                              channels.filter((c) => c.id !== channel.id)
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Button
                  onClick={() => {
                    const newChannel: ChannelData = {
                      id: Math.random().toString(36).substr(2, 9),
                      name: "New Channel",
                      type: "text",
                      category: "General",
                    };
                    setChannels([...channels, newChannel]);
                  }}
                  className="bg-[#5865f2] hover:bg-[#4752c4] text-white"
                >
                  Add Channel
                </Button>
              </div>

              {/* Boards */}
              <div className="space-y-2">
                <Label
                  htmlFor="server-boards"
                  className="text-gray-400 text-xs uppercase tracking-wider"
                >
                  Boards
                </Label>
                <ScrollArea className="h-40">
                  <div className="space-y-2">
                    {boards.map((board) => (
                      <div
                        key={board.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <GripVertical
                            className="text-gray-400 mr-2"
                            size={16}
                          />
                          <div className="text-white font-medium">
                            {board.name}
                          </div>
                        </div>
                        <Trash2
                          className="text-gray-400 hover:text-red-500 cursor-pointer"
                          size={16}
                          onClick={() =>
                            setBoards(boards.filter((b) => b.id !== board.id))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Button
                  onClick={() => {
                    const newBoard: BoardData = {
                      id: Math.random().toString(36).substr(2, 9),
                      name: "New Board",
                      description: "A new board for your server",
                      color: "#5865f2",
                      columns: [
                        {
                          id: Math.random().toString(36).substr(2, 9),
                          title: "To Do",
                          color: "#5865f2",
                        },
                        {
                          id: Math.random().toString(36).substr(2, 9),
                          title: "In Progress",
                          color: "#5865f2",
                        },
                        {
                          id: Math.random().toString(36).substr(2, 9),
                          title: "Done",
                          color: "#5865f2",
                        },
                      ],
                    };
                    setBoards([...boards, newBoard]);
                  }}
                  className="bg-[#5865f2] hover:bg-[#4752c4] text-white"
                >
                  Add Board
                </Button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setStep("choose")}
                  variant="ghost"
                  className="flex-1 text-gray-300 hover:text-white"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!serverName.trim()}
                  className="flex-1 bg-[#5865f2] hover:bg-[#4752c4] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
