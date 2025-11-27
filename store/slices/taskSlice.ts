import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: "image" | "file" | "video";
  url?: string;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  avatar: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  boardId: string;
  priority: "low" | "medium" | "high" | "urgent";
  assignee?: string;
  assignees?: string[];
  reporter: string;
  labels: string[];
  createdAt: string;
  comments: Comment[];
  dueDate?: string;
  subtasks?: SubTask[];
  attachments?: Attachment[];
  sourceMessageId?: string;
  // New fields for enhanced functionality
  issueType?: "story" | "task" | "bug" | "epic" | "subtask";
  storyPoints?: number;
  epicId?: string;
  watchers?: string[];
  timeEstimate?: number; // in minutes
  timeLogged?: number; // in minutes
  sourceMessageContent?: string;
  sourceMessageAuthor?: string;
}

interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  tasks: [],
  selectedTask: null,
  isLoading: false,
  error: null,
};

const taskSlice = createSlice({
  name: "task",
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
    },
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks.push(action.payload);
    },
    updateTask: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter((t) => t.id !== action.payload);
    },
    updateTaskStatus: (
      state,
      action: PayloadAction<{ taskId: string; status: string }>
    ) => {
      const task = state.tasks.find((t) => t.id === action.payload.taskId);
      if (task) {
        task.status = action.payload.status;
      }
    },
    updateTaskAssignee: (
      state,
      action: PayloadAction<{ taskId: string; assignee?: string }>
    ) => {
      const task = state.tasks.find((t) => t.id === action.payload.taskId);
      if (task) {
        task.assignee = action.payload.assignee;
      }
    },
    setSelectedTask: (state, action: PayloadAction<Task | null>) => {
      state.selectedTask = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setTasks,
  addTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskAssignee,
  setSelectedTask,
  setLoading,
  setError,
} = taskSlice.actions;

export default taskSlice.reducer;
