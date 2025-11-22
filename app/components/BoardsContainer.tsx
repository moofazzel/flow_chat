import { storage, type BoardData } from "@/utils/storage"; // 🆕 Import storage
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
const DEFAULT_BOARDS: BoardData[] = [
  {
    id: "board-1",
    name: "Project Alpha",
    description: "Main development board",
    color: "bg-blue-500",
    columns: [
      { id: "column-1-1", title: "To Do", color: "bg-gray-300" },
      { id: "column-1-2", title: "In Progress", color: "bg-yellow-300" },
      { id: "column-1-3", title: "Done", color: "bg-green-300" },
    ],
    labels: [
      { id: "label-1-1", name: "Bug", color: "bg-red-500", boardId: "board-1" },
      {
        id: "label-1-2",
        name: "Feature",
        color: "bg-blue-500",
        boardId: "board-1",
      },
      {
        id: "label-1-3",
        name: "Urgent",
        color: "bg-orange-500",
        boardId: "board-1",
      },
    ],
  },
  {
    id: "board-2",
    name: "Marketing Campaign",
    description: "Q4 Marketing tasks",
    color: "bg-purple-500",
    columns: [
      { id: "column-2-1", title: "Ideas", color: "bg-gray-300" },
      { id: "column-2-2", title: "Planning", color: "bg-yellow-300" },
      { id: "column-2-3", title: "Execution", color: "bg-green-300" },
    ],
    labels: [
      {
        id: "label-2-1",
        name: "Social",
        color: "bg-pink-500",
        boardId: "board-2",
      },
      {
        id: "label-2-2",
        name: "Content",
        color: "bg-purple-500",
        boardId: "board-2",
      },
      {
        id: "label-2-3",
        name: "Design",
        color: "bg-teal-500",
        boardId: "board-2",
      },
    ],
  },
  {
    id: "board-3",
    name: "Bug Tracker",
    description: "Track and resolve bugs",
    color: "bg-red-500",
    columns: [
      { id: "column-3-1", title: "Reported", color: "bg-gray-300" },
      { id: "column-3-2", title: "Investigating", color: "bg-yellow-300" },
      { id: "column-3-3", title: "Fixed", color: "bg-green-300" },
    ],
    labels: [
      {
        id: "label-3-1",
        name: "Critical",
        color: "bg-red-500",
        boardId: "board-3",
      },
      {
        id: "label-3-2",
        name: "High Priority",
        color: "bg-orange-500",
        boardId: "board-3",
      },
      {
        id: "label-3-3",
        name: "Low Priority",
        color: "bg-gray-500",
        boardId: "board-3",
      },
    ],
  },
];

export function BoardsContainer({
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
  const [boards, setBoards] = useState<BoardData[]>(DEFAULT_BOARDS);
  const [showAddBoardModal, setShowAddBoardModal] = useState(false);

  const [activeBoard, setActiveBoard] = useState<string>(() => {
    // Load saved active board from localStorage
    return localStorage.getItem("chatapp_activeBoard") || "board-1";
  });

  // 🆕 Load boards from localStorage on mount
  useEffect(() => {
    const savedBoards = storage.boards.load();
    if (savedBoards && savedBoards.length > 0) {
      setBoards(savedBoards);
      console.log(`✅ Loaded ${savedBoards.length} boards from storage`);
    } else {
      console.log("ℹ️ No saved boards found, using default boards");
    }
  }, []);

  // 🆕 Auto-save boards whenever they change
  useEffect(() => {
    if (boards.length > 0) {
      storage.boards.save(boards);
      console.log(`💾 Auto-saved ${boards.length} boards`);
    }
  }, [boards]);

  const pageContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingPage, setIsDraggingPage] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Save active board to localStorage
  useEffect(() => {
    localStorage.setItem("chatapp_activeBoard", activeBoard);
  }, [activeBoard]);

  // Restore page scroll position on mount
  useEffect(() => {
    if (!isInitialized && pageContainerRef.current) {
      const savedScrollLeft = localStorage.getItem("chatapp_pageScrollLeft");
      if (savedScrollLeft) {
        pageContainerRef.current.scrollLeft = parseInt(savedScrollLeft, 10);
      } else {
        // If no saved scroll, scroll to active board
        const boardElement = document.getElementById(activeBoard);
        if (boardElement) {
          setTimeout(() => {
            boardElement.scrollIntoView({
              behavior: "auto",
              inline: "start",
              block: "nearest",
            });
          }, 100);
        }
      }
      setIsInitialized(true);
    }
  }, [activeBoard, isInitialized]);

  // Save page scroll position to localStorage
  useEffect(() => {
    const handleScroll = () => {
      if (pageContainerRef.current) {
        localStorage.setItem(
          "chatapp_pageScrollLeft",
          String(pageContainerRef.current.scrollLeft)
        );
      }
    };

    const container = pageContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Check scroll position
  const checkScroll = () => {
    if (pageContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = pageContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const container = pageContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        container.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [boards]);

  // Page-level click-and-drag scrolling
  const handlePageMouseDown = (e: React.MouseEvent) => {
    if (pageContainerRef.current && e.button === 0) {
      const target = e.target as HTMLElement;

      // Check if clicking on grey areas (page background, wrapper, or board tabs)
      const isPageContainer =
        target === pageContainerRef.current ||
        target.classList.contains("boards-wrapper") ||
        target.classList.contains("boards-inner-wrapper");
      const isBoardTab = target.closest("[data-board-tab]");

      // Allow scrolling if clicking on page background OR board tabs
      if (isPageContainer || isBoardTab) {
        e.preventDefault();
        setIsDraggingPage(true);
        setDragStart({
          x: e.pageX - pageContainerRef.current.offsetLeft,
          scrollLeft: pageContainerRef.current.scrollLeft,
        });
      }
    }
  };

  const handlePageMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingPage || !pageContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - pageContainerRef.current.offsetLeft;
    const walk = (x - dragStart.x) * 2.5; // Slightly faster scroll for page level
    pageContainerRef.current.scrollLeft = dragStart.scrollLeft - walk;
  };

  const handlePageMouseUp = () => {
    setIsDraggingPage(false);
  };

  const handlePageMouseLeave = () => {
    setIsDraggingPage(false);
  };

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

  // Navigate to next/previous board
  const navigateBoard = (direction: "prev" | "next") => {
    const currentIndex = boards.findIndex((b) => b.id === activeBoard);
    if (direction === "prev" && currentIndex > 0) {
      scrollToBoard(boards[currentIndex - 1].id);
    } else if (direction === "next" && currentIndex < boards.length - 1) {
      scrollToBoard(boards[currentIndex + 1].id);
    }
  };

  // Filter tasks by board (for demo, all boards share same tasks, but you can customize this)
  const getBoardTasks = (boardId: string) => {
    // For now, all boards show all tasks. You can filter by board-specific logic later
    return tasks;
  };

  // Handle board deletion
  const handleDeleteBoard = (boardId: string) => {
    if (boards.length === 1) {
      toast.error("Cannot delete the last board");
      return;
    }

    setBoards((prevBoards) => {
      const filteredBoards = prevBoards.filter((b) => b.id !== boardId);

      // If the deleted board was active, switch to the first board
      if (activeBoard === boardId && filteredBoards.length > 0) {
        setActiveBoard(filteredBoards[0].id);
        setTimeout(() => {
          scrollToBoard(filteredBoards[0].id);
        }, 100);
      }

      return filteredBoards;
    });

    toast.success("Board deleted successfully");
  };

  // Handle board rename
  const handleRenameBoard = (
    boardId: string,
    newName: string,
    newDescription: string,
    newColor: string
  ) => {
    setBoards((prevBoards) =>
      prevBoards.map((b) =>
        b.id === boardId
          ? {
              ...b,
              name: newName,
              description: newDescription,
              color: newColor,
            }
          : b
      )
    );
    toast.success("Board updated successfully");
  };

  // Handle board duplication
  const handleDuplicateBoard = (boardId: string) => {
    const boardToDuplicate = boards.find((b) => b.id === boardId);
    if (!boardToDuplicate) return;

    const newBoardId = `board-${Date.now()}`;
    const duplicatedBoard: BoardData = {
      ...boardToDuplicate,
      id: newBoardId,
      name: `${boardToDuplicate.name} (Copy)`,
      columns: boardToDuplicate.columns.map((col, idx) => ({
        ...col,
        id: `column-${newBoardId}-${idx}`,
      })),
      labels: boardToDuplicate.labels.map((label, idx) => ({
        ...label,
        id: `label-${newBoardId}-${idx}`,
        boardId: newBoardId,
      })),
    };

    setBoards((prevBoards) => [...prevBoards, duplicatedBoard]);
    setActiveBoard(newBoardId);

    setTimeout(() => {
      scrollToBoard(newBoardId);
    }, 100);

    toast.success("Board duplicated successfully");
  };

  return (
    <div className="flex-1 flex flex-col relative bg-[#e8eef5] overflow-hidden">
      {/* Board Tabs Navigation - FIXED */}
      <div className="flex-shrink-0 h-14 bg-white border-b border-gray-200 shadow-sm flex items-center gap-2">
        {/* Scrollable Board Tabs */}
        <div className="flex items-center gap-2 px-4 overflow-x-auto flex-1 min-w-0">
          {boards.map((board) => (
            <div
              key={board.id}
              data-board-tab="true"
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
                activeBoard === board.id
                  ? "bg-[#0052cc] text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                isOnlyBoard={boards.length === 1}
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
            className="gap-2 hover:bg-gray-100 flex-shrink-0"
          >
            <Plus size={16} className="text-gray-700" />
          </Button>
        </div>

        {/* Fixed Show Chat Button */}
        <div className="flex-shrink-0 pr-4">
          <Button
            onClick={onToggleChat}
            variant={isChatOpen ? "default" : "outline"}
            size="sm"
            className={`gap-2 ${
              isChatOpen
                ? "bg-[#5865f2] text-white hover:bg-[#4752c4]"
                : "border-gray-300 bg-white hover:bg-gray-100"
            }`}
          >
            <MessageSquare size={16} />
            <span className="hidden sm:inline">
              {isChatOpen ? "Hide Chat" : "Show Chat"}
            </span>
            <span className="sm:hidden">Chat</span>
          </Button>
        </div>
      </div>

      {/* Board Content Area - Flexible height */}
      <div className="flex-1 overflow-hidden relative bg-[#e8eef5]">
        <AnimatePresence mode="wait" initial={false}>
          {boards.map((board) => {
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
                    setBoards((prevBoards) =>
                      prevBoards.map((b) =>
                        b.id === board.id ? { ...b, ...updates } : b
                      )
                    );
                    if (updates.color || updates.name || updates.description) {
                      toast.success("Board updated successfully");
                    }
                  }}
                  onDeleteBoard={() => handleDeleteBoard(board.id)}
                  onDuplicateBoard={() => handleDuplicateBoard(board.id)}
                  boardLabels={board.labels || []}
                  onLabelsChange={(updatedLabels) => {
                    setBoards((prevBoards) =>
                      prevBoards.map((b) =>
                        b.id === board.id ? { ...b, labels: updatedLabels } : b
                      )
                    );
                  }}
                  onColumnsChange={(updatedColumns) => {
                    // Update the board's columns in state
                    setBoards((prevBoards) =>
                      prevBoards.map((b) =>
                        b.id === board.id
                          ? { ...b, columns: updatedColumns }
                          : b
                      )
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
        onCreateBoard={(boardData) => {
          // Generate unique board ID
          const boardNumber = boards.length + 1;
          const newBoardId = `board-${Date.now()}`;

          // Get selected template columns
          const BOARD_TEMPLATES = [
            {
              id: "blank",
              columns: [
                { title: "To Do", color: "bg-gray-300" },
                { title: "In Progress", color: "bg-yellow-300" },
                { title: "Done", color: "bg-green-300" },
              ],
            },
          ];

          const newBoard: BoardData = {
            id: newBoardId,
            name: boardData.name,
            description: boardData.description,
            color: boardData.color,
            columns: BOARD_TEMPLATES[0].columns.map((col, idx) => ({
              id: `column-${newBoardId}-${idx}`,
              title: col.title,
              color: col.color,
            })),
            labels: [],
          };

          setBoards((prevBoards) => [...prevBoards, newBoard]);
          setActiveBoard(newBoardId);

          // Scroll to new board after it's rendered
          setTimeout(() => {
            scrollToBoard(newBoardId);
          }, 100);

          setShowAddBoardModal(false);
        }}
      />
    </div>
  );
}
