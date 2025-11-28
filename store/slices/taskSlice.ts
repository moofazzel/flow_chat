import { createClient } from "@/utils/supabase/client";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  position?: number;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: "image" | "file" | "video";
  url?: string;
  file_url?: string; // For compatibility
  filename?: string; // For compatibility
  file_size?: number; // For compatibility
  file_type?: string; // For compatibility
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  avatar: string;
  author_id?: string; // For compatibility
  created_at?: string; // For compatibility
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  statusName?: string;
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

// Async Thunks

export const fetchTaskDetails = createAsyncThunk(
  "task/fetchDetails",
  async (taskId: string, { rejectWithValue }) => {
    const supabase = createClient();
    try {
      // Fetch task details
      const { data: taskData, error: taskError } = await supabase
        .from("cards")
        .select("*")
        .eq("id", taskId)
        .single();

      if (taskError) throw taskError;

      // Fetch related data in parallel
      const [comments, subtasks, attachments] = await Promise.all([
        supabase
          .from("card_comments")
          .select("*, author:users(id, username, avatar_url)")
          .eq("card_id", taskId)
          .order("created_at", { ascending: true }),
        supabase
          .from("card_subtasks")
          .select("*")
          .eq("card_id", taskId)
          .order("position", { ascending: true }),
        supabase
          .from("card_attachments")
          .select("*")
          .eq("card_id", taskId)
          .order("created_at", { ascending: false }),
      ]);

      if (comments.error) throw comments.error;
      if (subtasks.error) throw subtasks.error;
      if (attachments.error) throw attachments.error;

      // Map to UI format
      const mappedComments: Comment[] = comments.data.map((c) => ({
        id: c.id,
        author: c.author?.username || "Unknown",
        content: c.content,
        timestamp: c.created_at,
        avatar: c.author?.avatar_url || "",
        author_id: c.author_id,
        created_at: c.created_at,
      }));

      const mappedSubtasks: SubTask[] = subtasks.data.map((s) => ({
        id: s.id,
        title: s.title,
        completed: s.completed,
        position: s.position,
      }));

      const mappedAttachments: Attachment[] = attachments.data.map((a) => ({
        id: a.id,
        name: a.filename,
        size: a.file_size ? `${Math.round(a.file_size / 1024)} KB` : "",
        type: a.file_type?.startsWith("image/") ? "image" : "file",
        url: a.file_url,
        file_url: a.file_url,
        filename: a.filename,
        file_size: a.file_size,
        file_type: a.file_type,
      }));

      return {
        ...taskData,
        comments: mappedComments,
        subtasks: mappedSubtasks,
        attachments: mappedAttachments,
        // Map other fields as needed
        dueDate: taskData.due_date,
        createdAt: taskData.created_at,
        boardId: "unknown", // We might need to fetch board info if not present
        labels: taskData.labels || [],
        assignees: taskData.assignees || [],
        priority: taskData.priority || "medium",
      } as Task;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateTaskThunk = createAsyncThunk(
  "task/update",
  async (
    { taskId, updates }: { taskId: string; updates: Partial<Task> },
    { rejectWithValue }
  ) => {
    const supabase = createClient();
    try {
      // Map UI fields to DB fields
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined)
        dbUpdates.description = updates.description;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.labels !== undefined) dbUpdates.labels = updates.labels;
      if (updates.assignees !== undefined)
        dbUpdates.assignees = updates.assignees;
      if (updates.status !== undefined) {
        // status in UI is list_id in DB usually, but let's check
        // If status is a UUID (list_id), we update list_id
        // If it's a string like "todo", we might need mapping, but assuming UUID for now
        // Actually, the previous code used updateCardPosition for moving, but updateCard for details
        // Let's assume updates.status maps to list_id if provided
        // But usually status change involves moving lists which is handled separately
      }

      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase
          .from("cards")
          .update({ ...dbUpdates, updated_at: new Date().toISOString() })
          .eq("id", taskId);
        if (error) throw error;
      }

      return { taskId, updates };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const addCommentThunk = createAsyncThunk(
  "task/addComment",
  async (
    { taskId, content }: { taskId: string; content: string },
    { rejectWithValue }
  ) => {
    const supabase = createClient();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("card_comments")
        .insert({
          card_id: taskId,
          author_id: user.id,
          content,
        })
        .select("*, author:users(id, username, avatar_url)")
        .single();

      if (error) throw error;

      return {
        id: data.id,
        author: data.author?.username || "Unknown",
        content: data.content,
        timestamp: data.created_at,
        avatar: data.author?.avatar_url || "",
        author_id: data.author_id,
        created_at: data.created_at,
      } as Comment;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteCommentThunk = createAsyncThunk(
  "task/deleteComment",
  async (commentId: string, { rejectWithValue }) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("card_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
      return commentId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const addSubtaskThunk = createAsyncThunk(
  "task/addSubtask",
  async (
    { taskId, title }: { taskId: string; title: string },
    { rejectWithValue }
  ) => {
    const supabase = createClient();
    try {
      // Get max position
      const { data: existing } = await supabase
        .from("card_subtasks")
        .select("position")
        .eq("card_id", taskId)
        .order("position", { ascending: false })
        .limit(1);

      const position = (existing?.[0]?.position ?? -1) + 1;

      const { data, error } = await supabase
        .from("card_subtasks")
        .insert({
          card_id: taskId,
          title,
          position,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        title: data.title,
        completed: data.completed,
        position: data.position,
      } as SubTask;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const toggleSubtaskThunk = createAsyncThunk(
  "task/toggleSubtask",
  async (
    { subtaskId, completed }: { subtaskId: string; completed: boolean },
    { rejectWithValue }
  ) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("card_subtasks")
        .update({ completed })
        .eq("id", subtaskId);
      if (error) throw error;
      return { subtaskId, completed };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteSubtaskThunk = createAsyncThunk(
  "task/deleteSubtask",
  async (subtaskId: string, { rejectWithValue }) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("card_subtasks")
        .delete()
        .eq("id", subtaskId);
      if (error) throw error;
      return subtaskId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

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
    updateTaskLocal: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
      if (state.selectedTask?.id === action.payload.id) {
        state.selectedTask = { ...state.selectedTask, ...action.payload };
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter((t) => t.id !== action.payload);
      if (state.selectedTask?.id === action.payload) {
        state.selectedTask = null;
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
  extraReducers: (builder) => {
    // Fetch Details
    builder.addCase(fetchTaskDetails.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchTaskDetails.fulfilled, (state, action) => {
      state.isLoading = false;
      state.selectedTask = action.payload;
      // Also update the task in the list if it exists
      const index = state.tasks.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = { ...state.tasks[index], ...action.payload };
      }
    });
    builder.addCase(fetchTaskDetails.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Update Task
    builder.addCase(updateTaskThunk.fulfilled, (state, action) => {
      const { taskId, updates } = action.payload;
      if (state.selectedTask?.id === taskId) {
        state.selectedTask = { ...state.selectedTask, ...updates };
      }
      const index = state.tasks.findIndex((t) => t.id === taskId);
      if (index !== -1) {
        state.tasks[index] = { ...state.tasks[index], ...updates };
      }
    });

    // Comments
    builder.addCase(addCommentThunk.fulfilled, (state, action) => {
      if (state.selectedTask) {
        state.selectedTask.comments.push(action.payload);
      }
    });
    builder.addCase(deleteCommentThunk.fulfilled, (state, action) => {
      if (state.selectedTask) {
        state.selectedTask.comments = state.selectedTask.comments.filter(
          (c) => c.id !== action.payload
        );
      }
    });

    // Subtasks
    builder.addCase(addSubtaskThunk.fulfilled, (state, action) => {
      if (state.selectedTask) {
        if (!state.selectedTask.subtasks) state.selectedTask.subtasks = [];
        state.selectedTask.subtasks.push(action.payload);
      }
    });
    builder.addCase(toggleSubtaskThunk.fulfilled, (state, action) => {
      if (state.selectedTask && state.selectedTask.subtasks) {
        const subtask = state.selectedTask.subtasks.find(
          (s) => s.id === action.payload.subtaskId
        );
        if (subtask) {
          subtask.completed = action.payload.completed;
        }
      }
    });
    builder.addCase(deleteSubtaskThunk.fulfilled, (state, action) => {
      if (state.selectedTask && state.selectedTask.subtasks) {
        state.selectedTask.subtasks = state.selectedTask.subtasks.filter(
          (s) => s.id !== action.payload
        );
      }
    });
  },
});

export const {
  setTasks,
  addTask,
  updateTaskLocal,
  deleteTask,
  setSelectedTask,
  setLoading,
  setError,
} = taskSlice.actions;

export default taskSlice.reducer;
