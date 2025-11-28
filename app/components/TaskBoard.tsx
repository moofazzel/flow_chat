"use client";

import type { BoardMember } from "@/hooks/useBoard";
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import { Filter, MessageSquare, Plus, Search, Star, Tag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Task } from "../page";
import { AddListButton } from "./AddListButton";
import { AddTaskForm } from "./AddTaskForm";
import type { BoardColumn } from "./BoardsContainer";
import { BoardSettingsMenu } from "./BoardSettingsMenu";
import { ColumnMenu } from "./ColumnMenu";
import { CreateTaskModal } from "./CreateTaskModal";
import type { Label } from "./LabelBadge";
import { LabelManager } from "./LabelManager";
import { TaskCard } from "./TaskCard";
import { type TaskFilter } from "./TaskFilters";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface TaskBoardProps {
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
  columns?: BoardColumn[];
  boardId?: string;
  boardName?: string;
  boardDescription?: string;
  boardColor?: string;

  onBoardUpdate?: (updates: {
    title?: string;
    description?: string;
    color?: string;
    isFavorite?: boolean;
    [key: string]: unknown;
  }) => void;
  onDeleteBoard?: () => void;
  onDuplicateBoard?: () => void;
  onColumnsChange?: (columns: BoardColumn[]) => void;
  onAddTask?: (taskData: {
    title: string;
    description: string;
    columnId: string;
    boardId: string;
    priority?: "low" | "medium" | "high" | "urgent";
    assignee?: string;
    labels?: string[];
  }) => void;
  onTasksUpdate?: (tasks: Task[]) => void;
  onDeleteTask?: (taskId: string) => void;
  onDuplicateTask?: (task: Task) => void;
  onArchiveTask?: (taskId: string) => void;
  boardLabels?: Label[];
  onLabelsChange?: (labels: Label[]) => void;
  // Member management props for BoardSettingsMenu
  currentUserId?: string;
  serverId?: string | null;
  onGetBoardMembers?: (boardId: string) => Promise<BoardMember[]>;
  onAddBoardMember?: (
    boardId: string,
    userId: string,
    role?: "admin" | "member" | "observer"
  ) => Promise<BoardMember | null>;
  onRemoveBoardMember?: (memberId: string) => Promise<boolean>;
  onUpdateMemberRole?: (
    memberId: string,
    role: "admin" | "member" | "observer"
  ) => Promise<boolean>;
  onSearchUsers?: (
    query: string
  ) => Promise<{ id: string; username: string; avatar_url: string | null }[]>;
  onGetServerMembers?: (
    serverId: string
  ) => Promise<{ id: string; username: string; avatar_url: string | null }[]>;
}

// Default columns only used for new board initialization
const DEFAULT_COLUMNS: BoardColumn[] = [
  { id: "backlog", title: "Backlog", color: "bg-gray-500" },
  { id: "todo", title: "To Do", color: "bg-blue-500" },
  { id: "in-progress", title: "In Progress", color: "bg-yellow-500" },
  { id: "review", title: "Review", color: "bg-purple-500" },
  { id: "done", title: "Done", color: "bg-green-500" },
];

// Sortable Task Card with smooth animations
function SortableTaskCard({
  task,
  onClick,
  onDelete,
  onDuplicate,
  onArchive,
  onQuickEdit,
  boardLabels,
}: {
  task: Task;
  onClick: () => void;
  onDelete?: (taskId: string) => void;
  onDuplicate?: (task: Task) => void;
  onArchive?: (taskId: string) => void;
  onQuickEdit?: (task: Task) => void;
  boardLabels?: Label[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  // Use Translate instead of Transform to avoid scale/rotation issues
  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
    position: "relative" as const,
  };

  // Handle click - only trigger if not dragging
  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger click if we just finished dragging
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={isDragging ? "cursor-grabbing" : "cursor-grab"}
    >
      <TaskCard
        task={task}
        onClick={() => {}} // Handle click at wrapper level
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onArchive={onArchive}
        onQuickEdit={onQuickEdit}
        boardLabels={boardLabels}
        isDragging={isDragging}
      />
    </div>
  );
}

// Droppable Column with visual feedback
function BoardColumn({
  column,
  tasks,
  onTaskClick,
  onAddTask,
  onRenameColumn,
  onDeleteColumn,
  onChangeColumnColor,
  onChangeBgColor,
  onCopyColumn,
  onMoveColumn,
  onSortColumn,
  onArchiveAllCards,
  existingColumnTitles,
  boardId,
  onDeleteTask,
  onDuplicateTask,
  onArchiveTask,
  boardLabels,
  columnIndex,
  totalColumns,
}: {
  column: BoardColumn;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (taskData: {
    title: string;
    description: string;
    columnId: string;
    boardId: string;
  }) => void;
  onRenameColumn: (columnId: string, newTitle: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onChangeColumnColor: (columnId: string, newColor: string) => void;
  onChangeBgColor?: (columnId: string, newBgColor: string) => void;
  onCopyColumn?: (columnId: string) => void;
  onMoveColumn?: (columnId: string, direction: "left" | "right") => void;
  onSortColumn?: (
    columnId: string,
    sortBy: "date" | "name" | "priority" | "assignee"
  ) => void;
  onArchiveAllCards?: (columnId: string) => void;
  existingColumnTitles: string[];
  boardId: string;
  onDeleteTask?: (taskId: string) => void;
  onDuplicateTask?: (task: Task) => void;
  onArchiveTask?: (taskId: string) => void;
  boardLabels?: Label[];
  columnIndex?: number;
  totalColumns?: number;
}) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`shrink-0 w-[280px] h-full flex flex-col rounded-lg p-2 transition-all duration-200 group ${
        isOver
          ? "bg-[#5865f2]/20 shadow-lg ring-2 ring-[#5865f2] scale-[1.02]"
          : column.bgColor || "bg-[#2b2d31]"
      }`}
    >
      {/* Column Header */}
      <div className="shrink-0 flex items-center gap-2 px-2 py-1 mb-2">
        <div className={`w-3 h-3 rounded-full ${column.color}`} />
        <h3 className="text-gray-200 font-medium">{column.title}</h3>
        <span className="text-gray-500 text-sm">({tasks.length})</span>
        <div className="ml-auto">
          <ColumnMenu
            columnId={column.id}
            columnTitle={column.title}
            columnColor={column.color}
            columnBgColor={column.bgColor}
            taskCount={tasks.length}
            onRename={(newTitle) => onRenameColumn(column.id, newTitle)}
            onDelete={() => onDeleteColumn(column.id)}
            onChangeColor={(newColor) =>
              onChangeColumnColor(column.id, newColor)
            }
            onChangeBgColor={
              onChangeBgColor
                ? (newBgColor) => onChangeBgColor(column.id, newBgColor)
                : undefined
            }
            onCopy={onCopyColumn ? () => onCopyColumn(column.id) : undefined}
            onMove={
              onMoveColumn
                ? (direction) => onMoveColumn(column.id, direction)
                : undefined
            }
            onSortBy={
              onSortColumn
                ? (sortBy) => onSortColumn(column.id, sortBy)
                : undefined
            }
            onArchiveAllCards={
              onArchiveAllCards ? () => onArchiveAllCards(column.id) : undefined
            }
            onAddCard={() => setIsAddingTask(true)}
            existingTitles={existingColumnTitles}
            canMoveLeft={columnIndex !== undefined && columnIndex > 0}
            canMoveRight={
              columnIndex !== undefined &&
              totalColumns !== undefined &&
              columnIndex < totalColumns - 1
            }
          />
        </div>
      </div>

      {/* Add Card Button or Form */}
      <div className="shrink-0">
        {isAddingTask ? (
          <div className="mb-2">
            <AddTaskForm
              columnId={column.id}
              boardId={boardId}
              onAdd={(taskData) => {
                onAddTask(taskData);
                setIsAddingTask(false);
              }}
              onCancel={() => setIsAddingTask(false)}
            />
          </div>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start mb-2 text-gray-400 hover:bg-[#404249] hover:text-gray-200 px-2 py-1.5 h-auto rounded"
            onClick={() => setIsAddingTask(true)}
          >
            <Plus size={16} className="mr-2" />
            Add a card
          </Button>
        )}
      </div>

      {/* Task List - Sortable with vertical scroll */}
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden space-y-2 pb-2 min-h-[100px]"
          style={{ scrollbarWidth: "thin" }}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              onDelete={onDeleteTask}
              onDuplicate={onDuplicateTask}
              onArchive={onArchiveTask}
              onQuickEdit={(task) => onTaskClick(task)}
              boardLabels={boardLabels}
            />
          ))}
          {tasks.length === 0 && !isAddingTask && (
            <div className="text-center text-gray-500 text-sm py-8 border-2 border-dashed border-[#404249] rounded-lg bg-[#1e1f22]/50">
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function TaskBoard({
  tasks,
  onTaskClick,
  onToggleChat,
  isChatOpen,
  onTaskStatusChange,
  onTaskAssignment,
  columns: propColumns,
  boardId = "board-1",
  boardName = "Project Board",
  boardDescription = "",
  boardColor = "bg-blue-500",
  onBoardUpdate,
  onDeleteBoard,
  onDuplicateBoard,
  onColumnsChange,
  onAddTask,
  onTasksUpdate,
  onDeleteTask,
  onDuplicateTask,
  onArchiveTask,
  boardLabels,
  onLabelsChange,
  // Member management props
  currentUserId,
  serverId,
  onGetBoardMembers,
  onAddBoardMember,
  onRemoveBoardMember,
  onUpdateMemberRole,
  onSearchUsers,
  onGetServerMembers,
}: TaskBoardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [localTasks, setLocalTasks] = useState(tasks);
  const [localColumns, setLocalColumns] = useState<BoardColumn[]>(
    propColumns || DEFAULT_COLUMNS
  );
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [filters, setFilters] = useState<TaskFilter>({
    labels: [],
    priorities: [],
    assignees: [],
    statuses: [],
    search: "",
  });
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingBoard, setIsDraggingBoard] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Update local columns when props change
  useEffect(() => {
    if (propColumns) {
      setLocalColumns(propColumns);
    }
  }, [propColumns]);

  // Update local tasks when props change
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Restore board scroll position on mount
  useEffect(() => {
    if (!isInitialized && boardContainerRef.current) {
      const savedScrollLeft = localStorage.getItem("Flow Chat_boardScrollLeft");
      if (savedScrollLeft) {
        boardContainerRef.current.scrollLeft = parseInt(savedScrollLeft, 10);
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Save board scroll position to localStorage
  useEffect(() => {
    const handleScroll = () => {
      if (boardContainerRef.current) {
        localStorage.setItem(
          "Flow Chat_boardScrollLeft",
          String(boardContainerRef.current.scrollLeft)
        );
      }
    };

    const container = boardContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Check scroll position to show/hide scroll indicators
  const checkScroll = () => {
    if (boardContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        boardContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const container = boardContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScroll);
      return () => container.removeEventListener("scroll", checkScroll);
    }
  }, [localTasks]);

  // Drag sensors - require longer distance to distinguish from click
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require 10px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Click-and-drag board scrolling
  const handleBoardMouseDown = (e: React.MouseEvent) => {
    if (boardContainerRef.current && e.button === 0) {
      // Only on left click
      const target = e.target as HTMLElement;

      // Don't scroll if clicking on interactive elements or task cards
      const isInteractive =
        target.closest("button") ||
        target.closest('[role="button"]') ||
        target.closest("input") ||
        target.closest("a") ||
        target.closest("[data-task-card]") ||
        target.closest(".cursor-grab") ||
        target.closest(".cursor-grabbing");

      if (isInteractive) return;

      // Also check if we're inside a column's task area
      const isInTaskArea = target.closest(".space-y-2");
      if (isInTaskArea) return;

      e.preventDefault();
      setIsDraggingBoard(true);
      setDragStart({
        x: e.pageX,
        scrollLeft: boardContainerRef.current.scrollLeft,
      });
    }
  };

  const handleBoardMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingBoard || !boardContainerRef.current) return;
    e.preventDefault();
    const walk = (e.pageX - dragStart.x) * 1.5; // Scroll speed multiplier
    boardContainerRef.current.scrollLeft = dragStart.scrollLeft - walk;
  };

  const handleBoardMouseUp = () => {
    setIsDraggingBoard(false);
  };

  const handleBoardMouseLeave = () => {
    setIsDraggingBoard(false);
  };

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const task = localTasks.find((t) => t.id === active.id);
    setActiveTask(task || null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeTask = localTasks.find((t) => t.id === active.id);
    const overTask = localTasks.find((t) => t.id === over.id);

    if (!activeTask) return;

    // Determine the column we're over
    let targetColumn: Task["status"] | null = null;

    if (overTask) {
      // We're over another task, use its column
      targetColumn = overTask.status;
    } else if (typeof over.id === "string") {
      // We might be over a column directly
      const column = localColumns.find((c) => c.id === over.id);
      if (column) {
        targetColumn = column.id as Task["status"];
      }
    }

    if (targetColumn && activeTask.status !== targetColumn) {
      // Move task to new column immediately for real-time feedback
      setLocalTasks((prevTasks) => {
        const updatedTasks = prevTasks.map((task) =>
          task.id === activeTask.id ? { ...task, status: targetColumn! } : task
        );
        return updatedTasks;
      });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = localTasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Find the old status from the original tasks prop
    const originalTask = tasks.find((t) => t.id === active.id);
    const oldStatus = originalTask?.status || activeTask.status;

    // Determine final column
    let targetColumn: Task["status"] = activeTask.status;

    const overTask = localTasks.find((t) => t.id === over.id);
    if (overTask) {
      targetColumn = overTask.status;
    } else if (typeof over.id === "string") {
      const column = localColumns.find((c) => c.id === over.id);
      if (column) {
        targetColumn = column.id as Task["status"];
      }
    }

    // Only trigger callback if status actually changed
    if (oldStatus !== targetColumn && onTaskStatusChange) {
      onTaskStatusChange(activeTask.id, targetColumn, oldStatus);
    }

    // Reorder within same column
    if (active.id !== over.id && activeTask.status === targetColumn) {
      setLocalTasks((tasks) => {
        const columnTasks = tasks.filter((t) => t.status === targetColumn);
        const oldIndex = columnTasks.findIndex((t) => t.id === active.id);
        const newIndex = columnTasks.findIndex((t) => t.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(columnTasks, oldIndex, newIndex);
          const otherTasks = tasks.filter((t) => t.status !== targetColumn);
          return [...otherTasks, ...reordered];
        }
        return tasks;
      });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full h-full flex flex-col bg-[#313338]">
        {/* Board header - FIXED */}
        <div className="shrink-0 h-16 px-6 flex items-center gap-3 bg-[#2b2d31] border-b border-[#1e1f22]">
          {/* Board Name with Settings */}
          <div className="flex items-center gap-2">
            <h1 className="text-white font-semibold text-lg">{boardName}</h1>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-[#404249]"
              onClick={() => onBoardUpdate?.({ isFavorite: true })}
              title="Star this board"
            >
              <Star
                size={16}
                className="text-gray-400 hover:text-yellow-500 hover:fill-yellow-500"
              />
            </Button>
            {onBoardUpdate && onDeleteBoard && onDuplicateBoard && (
              <div className="relative">
                <BoardSettingsMenu
                  boardId={boardId}
                  boardName={boardName}
                  boardDescription={boardDescription}
                  boardColor={boardColor}
                  onUpdateBoard={onBoardUpdate}
                  onDeleteBoard={onDeleteBoard}
                  onDuplicateBoard={onDuplicateBoard}
                  currentUserId={currentUserId}
                  serverId={serverId}
                  onGetBoardMembers={onGetBoardMembers}
                  onAddBoardMember={onAddBoardMember}
                  onRemoveBoardMember={onRemoveBoardMember}
                  onUpdateMemberRole={onUpdateMemberRole}
                  onSearchUsers={onSearchUsers}
                  onGetServerMembers={onGetServerMembers}
                />
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-[#404249]" />

          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1e1f22] border-[#1e1f22] text-white placeholder:text-gray-500 h-9"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-[#404249] bg-[#2b2d31] text-gray-300 hover:bg-[#404249] h-9"
            >
              <Filter size={16} />
              Filter
            </Button>
            <Button
              variant={isChatOpen ? "default" : "outline"}
              size="sm"
              className={`gap-2 h-9 ${
                isChatOpen
                  ? "bg-[#5865f2] hover:bg-[#4752c4]"
                  : "border-[#404249] bg-[#2b2d31] text-gray-300 hover:bg-[#404249]"
              }`}
              onClick={onToggleChat}
            >
              <MessageSquare size={16} />
              Chat
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-[#404249] bg-[#2b2d31] text-gray-300 hover:bg-[#404249] h-9"
              onClick={() => setShowLabelManager(true)}
            >
              <Tag size={16} />
              Labels
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-[#5865f2] hover:bg-[#4752c4] h-9"
              onClick={() => setShowCreateTaskModal(true)}
            >
              <Plus size={16} />
              Create
            </Button>
          </div>
        </div>

        {/* Create Task Modal */}
        {showCreateTaskModal && (
          <CreateTaskModal
            isOpen={showCreateTaskModal}
            onClose={() => setShowCreateTaskModal(false)}
            onCreateTask={(taskData) => {
              onAddTask?.({
                title: taskData.title,
                description: taskData.description,
                columnId: taskData.status,
                boardId: boardId || "board-1",
                priority: taskData.priority,
                assignee: taskData.assignee,
                labels: taskData.labels,
              });
              setShowCreateTaskModal(false);
            }}
          />
        )}

        {/* Label Manager Dialog */}
        <LabelManager
          labels={boardLabels || []}
          onAddLabel={(name, color) => {
            const newLabel: Label = {
              id: `label-${Date.now()}`,
              name,
              color,
              boardId,
            };
            onLabelsChange?.([...(boardLabels || []), newLabel]);
          }}
          onEditLabel={(labelId, name, color) => {
            const updated = (boardLabels || []).map((l) =>
              l.id === labelId ? { ...l, name, color } : l
            );
            onLabelsChange?.(updated);
          }}
          onDeleteLabel={(labelId) => {
            const updated = (boardLabels || []).filter((l) => l.id !== labelId);
            onLabelsChange?.(updated);
          }}
          open={showLabelManager}
          onOpenChange={setShowLabelManager}
        />

        {/* Board columns - Click and drag scrolling */}
        <div
          ref={boardContainerRef}
          className={`flex-1 overflow-x-auto overflow-y-hidden scroll-smooth ${
            isDraggingBoard ? "cursor-grabbing" : "cursor-grab"
          }`}
          onMouseDown={handleBoardMouseDown}
          onMouseMove={handleBoardMouseMove}
          onMouseUp={handleBoardMouseUp}
          onMouseLeave={handleBoardMouseLeave}
          style={{
            userSelect: isDraggingBoard ? "none" : "auto",
            scrollbarWidth: "thin", // For Firefox
          }}
        >
          <div className="h-full flex gap-3 p-6 min-w-min">
            {localColumns.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.5,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                <AddListButton
                  isEmpty={true}
                  onAdd={(columnName) => {
                    const newColumn: BoardColumn = {
                      id: `column-${Date.now()}`,
                      title: columnName,
                      color: "bg-blue-500",
                    };
                    const newColumns = [newColumn];
                    setLocalColumns(newColumns);
                    if (onColumnsChange) {
                      onColumnsChange(newColumns);
                    }
                  }}
                  existingNames={localColumns.map((c) => c.title)}
                  currentCount={localColumns.length}
                />
              </motion.div>
            ) : (
              <>
                <AnimatePresence mode="sync">
                  {localColumns.map((column, index) => {
                    const columnTasks = localTasks.filter(
                      (task) => task.status === column.id
                    );

                    return (
                      <motion.div
                        key={column.id}
                        layout
                        initial={{
                          opacity: 0,
                          scale: 0.88,
                          x: -40,
                          y: 20,
                          rotateY: -20,
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          x: 0,
                          y: 0,
                          rotateY: 0,
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0.88,
                          x: -40,
                          y: 20,
                          rotateY: -20,
                          transition: {
                            duration: 0.35,
                            ease: [0.4, 0, 0.2, 1],
                          },
                        }}
                        transition={{
                          duration: 0.5,
                          delay: index * 0.06,
                          ease: [0.16, 1, 0.3, 1],
                          layout: {
                            duration: 0.45,
                            ease: [0.16, 1, 0.3, 1],
                          },
                        }}
                        className="shrink-0"
                        style={{
                          transformPerspective: 1200,
                          transformStyle: "preserve-3d",
                        }}
                      >
                        <BoardColumn
                          column={column}
                          tasks={columnTasks}
                          onTaskClick={onTaskClick}
                          onAddTask={(taskData) => {
                            if (onAddTask) {
                              onAddTask({
                                ...taskData,
                                columnId: column.id,
                              });
                            }
                          }}
                          onRenameColumn={(columnId, newTitle) => {
                            const updatedColumns = localColumns.map((c) =>
                              c.id === columnId ? { ...c, title: newTitle } : c
                            );
                            setLocalColumns(updatedColumns);
                            if (onColumnsChange) {
                              onColumnsChange(updatedColumns);
                            }
                          }}
                          onDeleteColumn={(columnId) => {
                            const updatedColumns = localColumns.filter(
                              (c) => c.id !== columnId
                            );
                            setLocalColumns(updatedColumns);
                            if (onColumnsChange) {
                              onColumnsChange(updatedColumns);
                            }
                          }}
                          onChangeColumnColor={(columnId, newColor) => {
                            const updatedColumns = localColumns.map((c) =>
                              c.id === columnId ? { ...c, color: newColor } : c
                            );
                            setLocalColumns(updatedColumns);
                            if (onColumnsChange) {
                              onColumnsChange(updatedColumns);
                            }
                          }}
                          onChangeBgColor={(columnId, newBgColor) => {
                            const updatedColumns = localColumns.map((c) =>
                              c.id === columnId
                                ? { ...c, bgColor: newBgColor }
                                : c
                            );
                            setLocalColumns(updatedColumns);
                            if (onColumnsChange) {
                              onColumnsChange(updatedColumns);
                            }
                          }}
                          existingColumnTitles={localColumns.map(
                            (c) => c.title
                          )}
                          boardId={boardId!}
                          onDeleteTask={onDeleteTask}
                          onDuplicateTask={onDuplicateTask}
                          onArchiveTask={onArchiveTask}
                          boardLabels={boardLabels}
                          columnIndex={index}
                          totalColumns={localColumns.length}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Add List Button at the end */}
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9, x: -30 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: localColumns.length * 0.06,
                    ease: [0.16, 1, 0.3, 1],
                    layout: {
                      duration: 0.45,
                      ease: [0.16, 1, 0.3, 1],
                    },
                  }}
                >
                  <AddListButton
                    onAdd={(columnName) => {
                      const colorPalette = [
                        "bg-gray-500",
                        "bg-blue-500",
                        "bg-green-500",
                        "bg-yellow-500",
                        "bg-purple-500",
                        "bg-pink-500",
                        "bg-red-500",
                        "bg-indigo-500",
                        "bg-teal-500",
                        "bg-orange-500",
                      ];
                      const newColumn: BoardColumn = {
                        id: `column-${Date.now()}`,
                        title: columnName,
                        color:
                          colorPalette[
                            localColumns.length % colorPalette.length
                          ],
                      };
                      const newColumns = [...localColumns, newColumn];
                      setLocalColumns(newColumns);
                      if (onColumnsChange) {
                        onColumnsChange(newColumns);
                      }
                    }}
                    existingNames={localColumns.map((c) => c.title)}
                    currentCount={localColumns.length}
                  />
                </motion.div>
              </>
            )}
          </div>
        </div>

        {/* Drag Overlay - Shows the dragged task */}
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="rotate-3">
              <div className="w-[280px] bg-[#1e1f22] rounded-lg p-3 shadow-2xl border-2 border-[#5865f2] opacity-95">
                <TaskCard
                  task={activeTask}
                  onClick={() => {}}
                  isDragging={true}
                />
              </div>
            </div>
          ) : null}
        </DragOverlay>

        {/* Drag hint */}
        {activeTask && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1e1f22] text-gray-200 px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-50 border border-[#404249]">
            Drag to another column to change status
          </div>
        )}

        {/* Scroll indicators */}
        {!activeTask && canScrollLeft && (
          <div className="absolute left-0 top-16 bottom-0 w-12 bg-linear-to-r from-[#313338] to-transparent pointer-events-none z-10" />
        )}
        {!activeTask && canScrollRight && (
          <div className="absolute right-0 top-16 bottom-0 w-12 bg-linear-to-l from-[#313338] to-transparent pointer-events-none z-10" />
        )}

        {/* Scroll hint */}
        {!activeTask &&
          !isDraggingBoard &&
          (canScrollLeft || canScrollRight) && (
            <div className="absolute bottom-4 right-4 bg-[#1e1f22] text-gray-300 px-3 py-1.5 rounded-md shadow-lg text-xs z-50 flex items-center gap-2 border border-[#404249]">
              <span className="opacity-70">
                💡 Click + drag to scroll board
              </span>
            </div>
          )}
      </div>
    </DndContext>
  );
}
