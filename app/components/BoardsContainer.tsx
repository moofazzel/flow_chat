"use client";

import { type BoardData } from "@/utils/storage"; // 🆕 Import storage
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Task } from "../page";
import { AddBoardModal } from "./AddBoardModal";
import { BoardMenu } from "./BoardMenu";
import { TaskBoard } from "./TaskBoard";
import { Button } from "./ui/button";

export interface BoardColumn {
  id: string;
  title: string;
  color: string;
  bgColor?: string;
}

interface BoardsContainerProps {
  currentServerId?: string | null;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onTaskStatusChange?: (
    taskId: string,
    newStatus: string,
    oldStatus: string
  ) => void;
  onTaskAssignment?: (
    taskId: string,
    newAssignee: string | undefined,
    oldAssignee: string | undefined
  ) => void;
  onAddTask?: (taskData: {
    title: string;
    description: string;
    columnId: string;
    boardId: string;
  }) => void;
  onTasksUpdate?: (tasks: Task[]) => void;
  onDeleteTask?: (taskId: string) => void;
  onDuplicateTask?: (task: Task) => void;
  onArchiveTask?: (taskId: string) => void;
}

// 🆕 Default boards (used if no saved boards found)

import { useBoard } from "@/hooks/useBoard";
// ... existing imports ...

export function BoardsContainer({
  currentServerId,
  tasks,
  onTaskClick,
  onToggleChat,
  isChatOpen,
  onTaskStatusChange,
  onTaskAssignment,
  onAddTask,
  onTasksUpdate,
  onDeleteTask,
  onDuplicateTask,
  onArchiveTask,
}: BoardsContainerProps) {
  const {
    boards,
    createBoard,
    updateBoard,
    deleteBoard,
    createList,
    // isLoading, // Unused for now
  } = useBoard(undefined, currentServerId);
  const [showAddBoardModal, setShowAddBoardModal] = useState(false);

  // Map Supabase boards to BoardData format
  const formattedBoards: BoardData[] = boards.map((board) => ({
    id: board.id,
    name: board.title,
    description: "", // Not in DB yet
    color: board.background,
    columns:
      board.lists?.map((list) => ({
        id: list.id,
        title: list.title,
        color: "bg-gray-100", // Default color for now
      })) || [],
    labels: [], // Not in DB yet
  }));

  const [activeBoard, setActiveBoard] = useState<string>(() => {
    // Load saved active board from localStorage
    return (
      localStorage.getItem("Flow Chat_activeBoard") ||
      formattedBoards[0]?.id ||
      ""
    );
  });

  // Update active board when boards load if not set
  useEffect(() => {
    if (!activeBoard && formattedBoards.length > 0) {
      setActiveBoard(formattedBoards[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formattedBoards, activeBoard]);

  const pageContainerRef = useRef<HTMLDivElement>(null);

  // Save active board to localStorage
  useEffect(() => {
    localStorage.setItem("Flow Chat_activeBoard", activeBoard);
  }, [activeBoard]);

  // Scroll to board
  const scrollToBoard = (boardId: string) => {
    const boardElement = document.getElementById(boardId);
    if (boardElement && pageContainerRef.current) {
      boardElement.scrollIntoView({
        behavior: "smooth",
        inline: "start",
        block: "nearest",
      });
    }
    setActiveBoard(boardId);
  };

  // Filter tasks by board (for demo, all boards share same tasks, but you can customize this)
  const getBoardTasks = (boardId: string) => {
    // For now, all boards show all tasks. You can filter by board-specific logic later
    return tasks;
  };

  // Handle board deletion
  const handleDeleteBoard = async (boardId: string) => {
    if (formattedBoards.length === 1) {
      toast.error("Cannot delete the last board");
      return;
    }

    await deleteBoard(boardId);

    // If the deleted board was active, switch to the first board
    if (activeBoard === boardId) {
      const remaining = formattedBoards.filter((b) => b.id !== boardId);
      if (remaining.length > 0) {
        setActiveBoard(remaining[0].id);
        setTimeout(() => {
          scrollToBoard(remaining[0].id);
        }, 100);
      }
    }

    toast.success("Board deleted successfully");
  };

  // Handle board rename
  const handleRenameBoard = async (
    boardId: string,
    newName: string,
    newDescription: string,
    newColor: string
  ) => {
    await updateBoard(boardId, {
      title: newName,
      background: newColor,
    });
    toast.success("Board updated successfully");
  };

  // Handle board duplication
  const handleDuplicateBoard = async (boardId: string) => {
    const boardToDuplicate = formattedBoards.find((b) => b.id === boardId);
    if (!boardToDuplicate) return;

    const newBoard = await createBoard(
      `${boardToDuplicate.name} (Copy)`,
      boardToDuplicate.color,
      currentServerId
    );

    if (newBoard) {
      // Duplicate columns
      if (boardToDuplicate.columns) {
        for (const [index, col] of boardToDuplicate.columns.entries()) {
          await createList(newBoard.id, col.title, index);
        }
      }

      setActiveBoard(newBoard.id);
      setTimeout(() => {
        scrollToBoard(newBoard.id);
      }, 100);

      toast.success("Board duplicated successfully");
    }
  };

  return (
    <div className="flex-1 flex flex-col relative bg-[#313338] overflow-hidden">
      {/* Board Tabs Navigation - FIXED */}
      <div className="shrink-0 h-14 bg-[#2b2d31] border-b border-[#1e1f22] flex items-center gap-2">
        {/* Scrollable Board Tabs */}
        <div className="flex items-center gap-2 px-4 overflow-x-auto flex-1 min-w-0">
          {formattedBoards.map((board) => (
            <div
              key={board.id}
              data-board-tab="true"
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1 whitespace-nowrap shrink-0 ${
                activeBoard === board.id
                  ? "bg-[#5865f2] text-white shadow-md"
                  : "bg-[#404249] text-gray-300 hover:bg-[#4a4f58]"
              }`}
            >
              <button
                onClick={() => scrollToBoard(board.id)}
                className="flex items-center gap-2"
              >
                <div className={`w-2 h-2 rounded-full ${board.color}`} />
                <span className="font-medium">{board.name}</span>
              </button>
              <BoardMenu
                boardId={board.id}
                boardName={board.name}
                boardDescription={board.description}
                boardColor={board.color}
                isOnlyBoard={formattedBoards.length === 1}
                onDelete={handleDeleteBoard}
                onRename={handleRenameBoard}
                onDuplicate={handleDuplicateBoard}
              />
            </div>
          ))}
          <Button
            onClick={() => setShowAddBoardModal(true)}
            variant="ghost"
            size="sm"
            className="gap-2 hover:bg-[#404249] shrink-0"
          >
            <Plus size={16} className="text-gray-300" />
          </Button>
        </div>

        {/* Fixed Show Chat Button */}
        <div className="shrink-0 pr-4">
          <Button
            onClick={onToggleChat}
            variant={isChatOpen ? "default" : "outline"}
            size="sm"
            className={`gap-2 ${
              isChatOpen
                ? "bg-[#5865f2] text-white hover:bg-[#4752c4]"
                : "border-[#404249] bg-[#2b2d31] text-gray-300 hover:bg-[#404249]"
            }`}
          >
            <MessageSquare size={16} />
            <span className="hidden sm:inline">
              {isChatOpen ? "Hide Chat" : "Show Chat"}
            </span>
            <span className="sm:hidden">Chat</span>
          </Button>
        </div>
        <div className="w-8.5"></div>
      </div>

      {/* Board Content Area - Flexible height */}
      <div className="flex-1 overflow-hidden relative bg-[#313338]">
        <AnimatePresence mode="wait" initial={false}>
          {/* if no board  */}

          {formattedBoards.map((board) => {
            const isActive = activeBoard === board.id;

            if (!isActive) return null;

            return (
              <motion.div
                key={board.id}
                id={board.id}
                initial={{
                  opacity: 0,
                  scale: 0.95,
                  y: 10,
                  filter: "blur(10px)",
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  filter: "blur(0px)",
                }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                  y: -10,
                  filter: "blur(10px)",
                }}
                transition={{
                  duration: 0.35,
                  ease: [0.16, 1, 0.3, 1], // Enhanced iOS spring easing
                  opacity: { duration: 0.25 },
                  scale: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                  y: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                  filter: { duration: 0.3 },
                }}
                className="absolute inset-0"
              >
                <TaskBoard
                  tasks={getBoardTasks(board.id)}
                  onTaskClick={onTaskClick}
                  onToggleChat={onToggleChat}
                  isChatOpen={isChatOpen}
                  onTaskStatusChange={onTaskStatusChange}
                  onTaskAssignment={onTaskAssignment}
                  onAddTask={onAddTask}
                  onTasksUpdate={onTasksUpdate}
                  onDeleteTask={onDeleteTask}
                  onDuplicateTask={onDuplicateTask}
                  onArchiveTask={onArchiveTask}
                  columns={board.columns}
                  boardId={board.id}
                  boardName={board.name}
                  boardDescription={board.description}
                  boardColor={board.color}
                  onBoardUpdate={(updates) => {
                    if (updates.name || updates.color) {
                      updateBoard(board.id, {
                        title: updates.name as string | undefined,
                        background: updates.color as string | undefined,
                      });
                    }
                    if (updates.color || updates.name || updates.description) {
                      toast.success("Board updated successfully");
                    }
                  }}
                  onDeleteBoard={() => handleDeleteBoard(board.id)}
                  onDuplicateBoard={() => handleDuplicateBoard(board.id)}
                  boardLabels={board.labels || []}
                  onLabelsChange={(updatedLabels) => {
                    // Labels not yet supported in DB
                    console.log(
                      "Labels update not supported yet",
                      updatedLabels
                    );
                  }}
                  onColumnsChange={(updatedColumns) => {
                    // Columns update not yet supported fully (reorder)
                    console.log(
                      "Columns update not supported yet",
                      updatedColumns
                    );
                  }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add Board Modal */}
      <AddBoardModal
        isOpen={showAddBoardModal}
        onClose={() => setShowAddBoardModal(false)}
        onCreateBoard={async (boardData) => {
          const newBoard = await createBoard(
            boardData.name,
            boardData.color,
            currentServerId
          );

          if (newBoard) {
            // Create columns from selected template
            if (boardData.columns && boardData.columns.length > 0) {
              for (const [index, col] of boardData.columns.entries()) {
                await createList(newBoard.id, col.title, index);
              }
            }

            setActiveBoard(newBoard.id);
            setTimeout(() => {
              scrollToBoard(newBoard.id);
            }, 100);

            setShowAddBoardModal(false);
          }
        }}
      />
    </div>
  );
}
